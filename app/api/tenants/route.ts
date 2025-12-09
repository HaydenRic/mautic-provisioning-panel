import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, generateSecurePassword } from '@/lib/auth';
import { validateDomain, generateSlug, sanitizeStackName, sanitizeDbName } from '@/lib/validation';
import { createPortainerClient } from '@/lib/portainerClient';
import { renderMauticStackYaml, getDefaultMauticVersion } from '@/lib/stackTemplate';

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can create tenants' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, domain, mauticVersion } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    if (!validateDomain(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format. Use only letters, numbers, hyphens, and dots.' },
        { status: 400 }
      );
    }

    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { domain },
          { slug: generateSlug(name) },
        ],
      },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'A tenant with this name or domain already exists' },
        { status: 409 }
      );
    }

    const slug = generateSlug(name);
    const stackName = sanitizeStackName(`mautic-${slug}`);
    const dbName = sanitizeDbName(`mautic_${slug}`);
    const dbUser = sanitizeDbName(`mautic_${slug}_user`);
    const dbPassword = generateSecurePassword(32);
    const dbRootPassword = generateSecurePassword(32);
    const version = mauticVersion || getDefaultMauticVersion();

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        domain,
        stackName,
        dbName,
        dbUser,
        dbPassword,
        mauticVersion: version,
        status: 'PENDING',
      },
    });

    await prisma.tenantEvent.create({
      data: {
        tenantId: tenant.id,
        type: 'PROVISION_REQUESTED',
        message: `Tenant provisioning requested for ${name}`,
      },
    });

    try {
      const portainerClient = createPortainerClient();

      const traefikNetwork = process.env.TRAEFIK_NETWORK_NAME || 'traefik-public';
      const certResolver = process.env.TRAEFIK_TLS_RESOLVER_NAME || 'letsencrypt';

      const composeYaml = renderMauticStackYaml({
        stackName,
        domain,
        dbName,
        dbUser,
        dbPassword,
        dbRootPassword,
        mauticVersion: version,
        traefikNetwork,
        certResolver,
      });

      await portainerClient.createMauticStack({
        stackName,
        composeYaml,
      });

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'ACTIVE' },
      });

      await prisma.tenantEvent.create({
        data: {
          tenantId: tenant.id,
          type: 'STACK_CREATED',
          message: `Stack ${stackName} successfully created in Portainer`,
        },
      });

      return NextResponse.json({ tenant }, { status: 201 });
    } catch (portainerError) {
      const errorMessage = portainerError instanceof Error
        ? portainerError.message
        : 'Unknown error creating stack';

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          status: 'ERROR',
          errorMessage,
        },
      });

      await prisma.tenantEvent.create({
        data: {
          tenantId: tenant.id,
          type: 'ERROR',
          message: `Failed to create stack: ${errorMessage}`,
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to provision tenant',
          details: errorMessage,
          tenant,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create tenant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
