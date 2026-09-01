'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useHospitals,
  useDoctors,
  usePharmacies,
  useDiagnosticCenters,
  useAllUsers,
  useAdminStats
} from '@/hooks/use-api';
import { 
  Building2, 
  Users, 
  Stethoscope, 
  Pill, 
  TestTube, 
  Plus, 
  BarChart3,
  Shield,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: hospitals = [], isLoading: hospitalsLoading } = useHospitals();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const { data: pharmacies = [], isLoading: pharmaciesLoading } = usePharmacies();
  const { data: diagnosticCenters = [], isLoading: centersLoading } = useDiagnosticCenters();
  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const { data: stats } = useAdminStats();

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/admin' },
    { title: 'Overview' }
  ];

  const isLoading = hospitalsLoading || doctorsLoading || pharmaciesLoading || centersLoading || usersLoading;

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['admin']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const activeUsers = users.filter(user => user.is_active).length;
  const totalProviders = hospitals.length + pharmacies.length + diagnosticCenters.length;

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage healthcare providers and system settings
            </p>
          </div>
        </div>

        {/* System Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthcare Providers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProviders}</div>
              <p className="text-xs text-muted-foreground">
                Registered providers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultations Today</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.consultations_today ?? '—'}</div>
              <p className="text-xs text-muted-foreground">Completed across all centres</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients Waiting</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.patients_waiting ?? '—'}</div>
              <p className="text-xs text-muted-foreground">In queues right now</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild className="w-full">
                <Link href="/dashboard/admin/hospitals">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Hospital
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/admin/doctors">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Manage Doctors
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/admin/pharmacies">
                  <Pill className="mr-2 h-4 w-4" />
                  Manage Pharmacies
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  User Management
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Provider Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Hospitals
              </CardTitle>
              <CardDescription>Registered healthcare facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{hospitals.length}</div>
              {hospitals.slice(0, 3).map((hospital) => (
                <div key={hospital.id} className="text-sm text-muted-foreground mb-1">
                  {hospital.name}
                </div>
              ))}
              <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                <Link href="/dashboard/admin/hospitals">View All</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Pharmacies
              </CardTitle>
              <CardDescription>Registered pharmacy partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{pharmacies.length}</div>
              {pharmacies.slice(0, 3).map((pharmacy) => (
                <div key={pharmacy.id} className="text-sm text-muted-foreground mb-1">
                  {pharmacy.name}
                </div>
              ))}
              <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                <Link href="/dashboard/admin/pharmacies">View All</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Diagnostic Centers
              </CardTitle>
              <CardDescription>Laboratory and imaging centers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{diagnosticCenters.length}</div>
              {diagnosticCenters.slice(0, 3).map((center) => (
                <div key={center.id} className="text-sm text-muted-foreground mb-1">
                  {center.name}
                </div>
              ))}
              <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                <Link href="/dashboard/admin/diagnostic-centers">View All</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Management */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Analytics
              </CardTitle>
              <CardDescription>Key metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Active Users</span>
                  <span className="text-sm font-medium">{activeUsers}/{users.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Healthcare Providers</span>
                  <span className="text-sm font-medium">{totalProviders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">New sign-ups this week</span>
                  <span className="text-sm font-medium">{stats?.registrations_this_week ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Patients waiting now</span>
                  <span className="text-sm font-medium">{stats?.patients_waiting ?? '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    General Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/admin/security">
                    <Shield className="mr-2 h-4 w-4" />
                    Security Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/admin/backups">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Backup & Recovery
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}