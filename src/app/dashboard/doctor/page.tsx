'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDoctorPatients, useDoctorStats } from '@/hooks/use-api';
import { Users, Calendar, FileText, Pill, Clock, Plus, LogIn, MapPin, Stethoscope, List } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { queueApi, doctorApi } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function DoctorDashboard() {
  const { data: patients = [], isLoading } = useDoctorPatients();
  const { data: stats } = useDoctorStats();
  const router = useRouter();
  const [queueData, setQueueData] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/doctor' },
    { title: 'Overview' }
  ];

  useEffect(() => {
    loadDoctorQueue();
  }, []);

  const loadDoctorQueue = async () => {
    try {
      setLoadingQueue(true);
      const profile = await doctorApi.getDoctorProfile();
      setDoctorProfile(profile);
      
      // Load current queue data
      const queue = await queueApi.getDoctorQueue(profile.id);
      setQueueData(queue);
    } catch (error) {
      console.error('Error loading queue data:', error);
    } finally {
      setLoadingQueue(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const waitingPatients = queueData?.queue?.filter((q: any) => q.status === "waiting") || [];
  const inConsultation = queueData?.queue?.filter((q: any) => q.status === "in_consultation") || [];
  const currentPatient = inConsultation.length > 0 ? inConsultation[0] : null;

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your patients and medical records
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_patients ?? patients.length}</div>
              <p className="text-xs text-muted-foreground">Under your care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultations Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.today_consultations ?? '—'}</div>
              <p className="text-xs text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending_reports ?? '—'}</div>
              <p className="text-xs text-muted-foreground">Lab reports awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_prescriptions ?? '—'}</div>
              <p className="text-xs text-muted-foreground">You have written</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Consultation */}
        {currentPatient && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Stethoscope className="h-5 w-5" />
                Current Consultation
              </CardTitle>
              <CardDescription className="text-green-700">
                Active consultation in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">
                    {currentPatient.patient_name} (UHID: {currentPatient.patient_uhid})
                  </p>
                  <p className="text-sm text-green-700">
                    Queue #{currentPatient.queue_number}
                    {currentPatient.symptoms_description && (
                      <span> • Symptoms: {currentPatient.symptoms_description}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/doctor/consultation/${currentPatient.queue_id}`)}
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Continue Consultation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue Summary */}
        {queueData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Patient Queue
              </CardTitle>
              <CardDescription>
                Current queue status and waiting patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{waitingPatients.length}</div>
                    <div className="text-xs text-muted-foreground">Waiting</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{inConsultation.length}</div>
                    <div className="text-xs text-muted-foreground">In Consultation</div>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/dashboard/doctor/queue-management">
                    <List className="mr-2 h-4 w-4" />
                    Manage Queue
                  </Link>
                </Button>
              </div>
              
              {waitingPatients.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Next Patients:</p>
                  {waitingPatients.slice(0, 3).map((patient: any, index: number) => (
                    <div key={patient.queue_id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm">{patient.patient_name}</span>
                        <Badge variant="outline" className="text-xs">{patient.patient_uhid}</Badge>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/dashboard/doctor/consultation/${patient.queue_id}`)}
                      >
                        Start
                      </Button>
                    </div>
                  ))}
                  {waitingPatients.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{waitingPatients.length - 3} more waiting...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard/doctor/queue-management">
                  <List className="mr-2 h-4 w-4" />
                  Queue Management
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/doctor/medical-records/create">
                  <Plus className="mr-2 h-4 w-4" />
                  New Medical Record
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/doctor/prescriptions/create">
                  <Pill className="mr-2 h-4 w-4" />
                  Create Prescription
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/doctor/appointments">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Appointments
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/doctor/patients">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Patients
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/doctor/checkin">
                  <LogIn className="mr-2 h-4 w-4" />
                  Check In/Out
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Patients you've seen recently</CardDescription>
            </CardHeader>
            <CardContent>
              {patients.length > 0 ? (
                <div className="space-y-3">
                  {patients.slice(0, 5).map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          UHID: {patient.uhid}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {patient.gender}
                      </Badge>
                    </div>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/dashboard/doctor/patients">View All Patients</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No patients assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your clinics for today</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.upcoming_schedule.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcoming_schedule.map((slot, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {slot.start_time}–{slot.end_time} · {slot.hospital_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slot.patient_count} patient{slot.patient_count === 1 ? '' : 's'} waiting
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <Clock className="mx-auto h-8 w-8 mb-2" />
                  <p>No scheduled clinics today.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}