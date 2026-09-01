'use client';

import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Download, FileText } from 'lucide-react';
import {
  useConsentedPatientSummary,
  useConsentedPatientRecords,
  useConsentedPatientPrescriptions,
  useConsentedPatientLabReports,
  useConsentedPatientDocuments,
} from '@/hooks/use-api';
import { doctorApi } from '@/lib/api-client';
import { documentTypeLabel } from '@/lib/document-types';
import { toast } from 'sonner';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard/doctor' },
  { title: 'My Patients', href: '/dashboard/doctor/patients' },
  { title: 'Patient' },
];

function NotShared() {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
      <Lock className="h-8 w-8" />
      <p>This patient hasn&rsquo;t shared this with you.</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

export default function ConsentedPatientPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = Number(params.patientId);

  const summary = useConsentedPatientSummary(patientId);
  const records = useConsentedPatientRecords(patientId);
  const prescriptions = useConsentedPatientPrescriptions(patientId);
  const labs = useConsentedPatientLabReports(patientId);
  const documents = useConsentedPatientDocuments(patientId);

  const p = summary.data;

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
      <div className="space-y-6">
        {summary.isLoading ? (
          <Loading />
        ) : summary.isError || !p ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              This patient has not shared their records with you.
            </CardContent>
          </Card>
        ) : (
          <>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold">
                  {p.first_name} {p.last_name}
                </h1>
                <Badge variant="outline">{p.uhid}</Badge>
                {p.is_family_patient && <Badge>Family patient</Badge>}
              </div>
              <p className="text-muted-foreground capitalize">
                {p.gender} · DOB {p.date_of_birth}
                {p.blood_group ? ` · ${p.blood_group}` : ''}
              </p>
              {(p.medical_allergies || p.chronic_conditions) && (
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {p.medical_allergies && (
                    <Badge variant="destructive">Allergies: {p.medical_allergies}</Badge>
                  )}
                  {p.chronic_conditions && (
                    <Badge variant="secondary">Chronic: {p.chronic_conditions}</Badge>
                  )}
                </div>
              )}
            </div>

            <Tabs defaultValue="records" className="space-y-4">
              <TabsList>
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                <TabsTrigger value="labs">Lab reports</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="records">
                {records.isLoading ? (
                  <Loading />
                ) : records.isError ? (
                  <NotShared />
                ) : (records.data ?? []).length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No records.</p>
                ) : (
                  <div className="space-y-3">
                    {(records.data ?? []).map((r: any) => (
                      <Card key={r.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{r.chief_complaint}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Diagnosis: </span>{r.diagnosis}</p>
                          {r.treatment_plan && (
                            <p><span className="text-muted-foreground">Plan: </span>{r.treatment_plan}</p>
                          )}
                          <p className="text-muted-foreground">
                            {r.visit_date ? new Date(r.visit_date).toLocaleDateString() : ''}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="prescriptions">
                {prescriptions.isLoading ? (
                  <Loading />
                ) : prescriptions.isError ? (
                  <NotShared />
                ) : (prescriptions.data ?? []).length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No prescriptions.</p>
                ) : (
                  <div className="space-y-3">
                    {(prescriptions.data ?? []).map((rx: any) => (
                      <Card key={rx.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {new Date(rx.prescription_date).toLocaleDateString()} ·{' '}
                            <span className="font-normal text-muted-foreground">
                              {rx.status}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          {(rx.medicines ?? []).map((m: any) => (
                            <p key={m.id}>
                              {m.medicine?.name ?? m.medicine_name} — {m.dosage}, {m.duration}
                            </p>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="labs">
                {labs.isLoading ? (
                  <Loading />
                ) : labs.isError ? (
                  <NotShared />
                ) : (labs.data ?? []).length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No lab reports.</p>
                ) : (
                  <div className="space-y-3">
                    {(labs.data ?? []).map((l: any) => (
                      <Card key={l.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            {l.test_name}
                            <Badge variant="outline">{String(l.status).replace('_', ' ')}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          {l.results && <p><span className="text-muted-foreground">Results: </span>{l.results}</p>}
                          {l.interpretation && (
                            <p><span className="text-muted-foreground">Interpretation: </span>{l.interpretation}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents">
                {documents.isLoading ? (
                  <Loading />
                ) : documents.isError ? (
                  <NotShared />
                ) : (documents.data ?? []).length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No documents.</p>
                ) : (
                  <div className="space-y-2">
                    {(documents.data ?? []).map((d: any) => (
                      <Card key={d.id}>
                        <CardContent className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{d.file_name}</span>
                            <Badge variant="outline">{documentTypeLabel(d.document_type)}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await doctorApi.downloadConsentedDocument(patientId, d.id, d.file_name);
                              } catch {
                                toast.error('Could not download that document.');
                              }
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
