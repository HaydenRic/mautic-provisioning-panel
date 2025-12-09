import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Database, Server, Globe, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { TenantStatus, TenantEventType } from '@/lib/types';

interface TenantPageProps {
  params: {
    id: string;
  };
}

export default async function TenantPage({ params }: TenantPageProps) {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      events: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!tenant) {
    redirect('/');
  }

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

  const status = statusConfig[tenant.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  const eventTypeColors = {
    PROVISION_REQUESTED: 'bg-blue-100 text-blue-800',
    STACK_CREATED: 'bg-green-100 text-green-800',
    ERROR: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{tenant.name}</h1>
              <p className="text-slate-500 mt-1">{tenant.domain}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={status.color} variant="secondary">
                <StatusIcon className="w-4 h-4 mr-1" />
                {status.label}
              </Badge>
              {tenant.status === 'ACTIVE' && (
                <a
                  href={`https://${tenant.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Mautic
                  </Button>
                </a>
              )}
            </div>
          </div>

          {tenant.status === 'ERROR' && tenant.errorMessage && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Provisioning Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-800">{tenant.errorMessage}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Server className="w-5 h-5 mr-2 text-blue-600" />
                  Stack Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Stack Name</span>
                  <span className="font-medium text-slate-900">{tenant.stackName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Mautic Version</span>
                  <span className="font-medium text-slate-900">{tenant.mauticVersion}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Slug</span>
                  <span className="font-medium text-slate-900">{tenant.slug}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Created</span>
                  <span className="font-medium text-slate-900">
                    {format(new Date(tenant.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Database className="w-5 h-5 mr-2 text-blue-600" />
                  Database Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Database Name</span>
                  <span className="font-medium text-slate-900">{tenant.dbName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Database User</span>
                  <span className="font-medium text-slate-900">{tenant.dbUser}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Password</span>
                  <span className="font-mono text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded">
                    {tenant.dbPassword}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  Network Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Domain</span>
                  <span className="font-medium text-slate-900">{tenant.domain}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">URL</span>
                  <a
                    href={`https://${tenant.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    https://{tenant.domain}
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Created</span>
                  <span className="font-medium text-slate-900">
                    {format(new Date(tenant.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-medium text-slate-900">
                    {format(new Date(tenant.updatedAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Log</CardTitle>
              <CardDescription>
                Activity history for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.events.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No events recorded</p>
              ) : (
                <div className="space-y-3">
                  {tenant.events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg"
                    >
                      <Badge
                        className={eventTypeColors[event.type as keyof typeof eventTypeColors]}
                        variant="secondary"
                      >
                        {event.type.replace(/_/g, ' ')}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">{event.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(event.createdAt), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
