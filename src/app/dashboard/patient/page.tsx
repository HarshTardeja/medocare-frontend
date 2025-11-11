'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  usePatientProfile, 
  usePatientMedicalRecords, 
  usePatientPrescriptions, 
  usePatientLabReports 
} from '@/hooks/use-api';
import { Heart, FileText, Pill, TestTube, QrCode, Calendar, User, AlertCircle, Stethoscope, Brain, Upload, FileImage, Shield } from 'lucide-react';
import Link from 'next/link';

export default function PatientDashboard() {
  const { data: profile, isLoading: profileLoading } = usePatientProfile();
  const { data: medicalRecords = [], isLoading: recordsLoading } = usePatientMedicalRecords();
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = usePatientPrescriptions();
  const { data: labReports = [], isLoading: labReportsLoading } = usePatientLabReports();

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/patient' },
    { title: 'Overview' }
  ];

  if (profileLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['patient']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const recentLabReports = labReports.slice(0, 3);
  const recentMedicalRecords = medicalRecords.slice(0, 3);

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['patient']}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.first_name} {profile?.last_name}</h1>
            <p className="text-muted-foreground">
              Here's your health overview for today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              UHID: {profile?.uhid}
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{medicalRecords.length}</div>
              <p className="text-xs text-muted-foreground">
                Total records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePrescriptions.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lab Reports</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{labReports.length}</div>
              <p className="text-xs text-muted-foreground">
                Total reports
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Good</div>
              <p className="text-xs text-muted-foreground">
                Based on recent data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard/patient/book-consultation">
                  <Brain className="mr-2 h-4 w-4" />
                  AI Consultation
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/patient/my-queues">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  My Queues
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/patient/qr-access">
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Access
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/patient/appointments">
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/patient/profile">
                  <User className="mr-2 h-4 w-4" />
                  Update Profile
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/patient/medical-history">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Medical History
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/patient/consent-management">
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Consents
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Medical Records */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Medical Records</CardTitle>
              <CardDescription>Your latest medical consultations</CardDescription>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : recentMedicalRecords.length > 0 ? (
                <div className="space-y-3">
                  {recentMedicalRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{record.diagnosis}</p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {record.doctor.user.full_name}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {new Date(record.visit_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/dashboard/patient/medical-records">View All</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No medical records yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Prescriptions</CardTitle>
              <CardDescription>Medications you're currently taking</CardDescription>
            </CardHeader>
            <CardContent>
              {prescriptionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : activePrescriptions.length > 0 ? (
                <div className="space-y-3">
                  {activePrescriptions.slice(0, 3).map((prescription) => (
                    <div key={prescription.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {prescription.medicines.length > 0 
                            ? prescription.medicines[0].medicine.name 
                            : 'No medicines'
                          }
                          {prescription.medicines.length > 1 && ` +${prescription.medicines.length - 1} more`}
                        </p>
                        <Badge variant={prescription.status === 'active' ? "destructive" : "secondary"}>
                          {prescription.status === 'active' ? "Active" : prescription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {prescription.medicines.length > 0 
                          ? `${prescription.medicines[0].dosage} - ${prescription.medicines[0].duration}`
                          : 'No dosage information'
                        }
                      </p>
                    </div>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/dashboard/patient/prescriptions">View All Prescriptions</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Pill className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No active prescriptions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Health Alerts */}
        {(profile?.medical_allergies || profile?.chronic_conditions || profile?.blood_group) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                Health Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.medical_allergies && (
                  <div>
                    <p className="font-medium text-orange-800">Known Allergies:</p>
                    <p className="text-orange-700">{profile.medical_allergies}</p>
                  </div>
                )}
                {profile.chronic_conditions && (
                  <div>
                    <p className="font-medium text-orange-800">Chronic Conditions:</p>
                    <p className="text-orange-700">{profile.chronic_conditions}</p>
                  </div>
                )}
                {profile.blood_group && (
                  <div>
                    <p className="font-medium text-orange-800">Blood Group:</p>
                    <p className="text-orange-700">{profile.blood_group}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}