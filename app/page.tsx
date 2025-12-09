import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { TenantStatus } from '@/lib/types';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      events: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const statusConfig = {
    PENDING: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Pending',
    },
    ACTIVE: {
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800',
      label: 'Active',
    },
    ERROR: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800',
      label: 'Error',
    },
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tenants</h2>
            <p className="text-slate-500 mt-1">Manage your Mautic instances</p>
          </div>
          {user.role === 'ADMIN' && (
            <Link href="/tenants/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Tenant
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 text-center mb-4">
                  No tenants yet. Create your first Mautic instance to get started.
                </p>
                {user.role === 'ADMIN' && (
                  <Link href="/tenants/new">
                    <Button>Create First Tenant</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            tenants.map((tenant) => {
              const status = statusConfig[tenant.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{tenant.name}</CardTitle>
                        <CardDescription className="mt-1 truncate">
                          {tenant.domain}
                        </CardDescription>
                      </div>
                      <Badge className={status.color} variant="secondary">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Version</span>
                      <span className="font-medium text-slate-900">{tenant.mauticVersion}</span>
                    </div>

                    {tenant.status === 'ERROR' && tenant.errorMessage && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-800">{tenant.errorMessage}</p>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Link href={`/tenants/${tenant.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      {tenant.status === 'ACTIVE' && (
                        <a
                          href={`https://${tenant.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
