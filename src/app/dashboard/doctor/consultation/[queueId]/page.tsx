'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  FileText, 
  TestTube, 
  Pill, 
  Upload, 
  Heart, 
  Phone, 
  AlertTriangle, 
  Shield, 
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Stethoscope,
  FileImage,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { consultationApi, queueApi } from '@/lib/api-client';
import { documentTypeLabel, isImageDocType } from '@/lib/document-types';

// Mock interfaces - replace with actual API types
interface PatientConsent {
  id: number;
  consent_type: string;
  status: string;
  allow_medical_history: boolean;
  allow_lab_reports: boolean;
  allow_prescriptions: boolean;
  allow_uploaded_documents: boolean;
  allow_allergies: boolean;
  allow_chronic_conditions: boolean;
  allow_emergency_contact: boolean;
  allowed_document_types?: string[];
  purpose?: string;
  granted_at: string;
  expires_at?: string;
}

interface PatientInfo {
  id: number;
  uhid: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group?: string;
  phone: string;
  medical_allergies?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface MedicalRecord {
  id: number;
  visit_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan?: string;
  notes?: string;
  doctor_name: string;
}

interface MedicalDocument {
  id: number;
  file_name: string;
  document_type: string;
  description?: string;
  document_date?: string;
  doctor_name?: string;
  hospital_name?: string;
  status: string;
  created_at: string;
}

interface Prescription {
  id: number;
  prescription_date: string;
  status: string;
  notes?: string;
  medicines: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
}

interface LabReport {
  id: number;
  test_name: string;
  test_type: string;
  requested_date: string;
  completed_date?: string;
  status: string;
  results?: string;
  interpretation?: string;
}

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const queueId = params.queueId as string;

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [consents, setConsents] = useState<PatientConsent[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConsent, setActiveConsent] = useState<PatientConsent | null>(null);
  const [queueStatus, setQueueStatus] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/doctor' },
    { title: 'Queue Management', href: '/dashboard/doctor/queue-management' },
    { title: 'Consultation' }
  ];

  useEffect(() => {
    loadConsultationData();
  }, [queueId]);

  const loadConsultationData = async () => {
    try {
      setLoading(true);
      
      // Load patient data by queue ID
      const patientData = await consultationApi.getPatientByQueue(parseInt(queueId));
      setPatient(patientData);

      // Opening the chart means the doctor is now seeing this patient: promote a
      // still-waiting entry so timing, prescribing and End Session all behave.
      try {
        const qs = await queueApi.getQueueStatus(parseInt(queueId));
        let status = qs.status;
        if (status === 'waiting') {
          try {
            await queueApi.updateQueueStatus(parseInt(queueId), 'in_consultation');
            status = 'in_consultation';
          } catch (error) {
            console.warn('Could not start consultation:', error);
          }
        }
        setQueueStatus(status);
      } catch (error) {
        console.warn('Could not load queue status:', error);
      }

      // Load consent data
      const consentResponse = await consultationApi.getPatientConsent(parseInt(queueId));
      const consents = consentResponse.consents || [];
      setConsents(consents);
      
      // Set active consent (most recent granted consent)
      const activeConsent = consents.find((consent: PatientConsent) => 
        consent.status.toLowerCase() === 'granted'
      ) || null;
      setActiveConsent(activeConsent);

      // Load data based on consent permissions
      if (activeConsent?.allow_medical_history) {
        try {
          const medicalHistoryResponse = await consultationApi.getMedicalHistory(parseInt(queueId));
          setMedicalRecords(medicalHistoryResponse.medical_records || []);
        } catch (error) {
          console.warn('Could not load medical history:', error);
          setMedicalRecords([]);
        }
      }

      if (activeConsent?.allow_prescriptions) {
        try {
          const prescriptionsResponse = await consultationApi.getPrescriptions(parseInt(queueId));
          setPrescriptions(prescriptionsResponse.prescriptions || []);
        } catch (error) {
          console.warn('Could not load prescriptions:', error);
          setPrescriptions([]);
        }
      }

      if (activeConsent?.allow_lab_reports) {
        try {
          const labReportsResponse = await consultationApi.getLabReports(parseInt(queueId));
          setLabReports(labReportsResponse.lab_reports || []);
        } catch (error) {
          console.warn('Could not load lab reports:', error);
          setLabReports([]);
        }
      }

      if (activeConsent?.allow_uploaded_documents) {
        try {
          const documentsResponse = await consultationApi.getMedicalDocuments(parseInt(queueId));
          setDocuments(documentsResponse.documents || []);
        } catch (error) {
          console.warn('Could not load medical documents:', error);
          setDocuments([]);
        }
      }
    } catch (error) {
      console.error('Error loading consultation data:', error);
      toast.error("Error loading consultation data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getConsentIcon = (allowed: boolean) => {
    return allowed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getDocumentIcon = (fileType: string) => {
    return isImageDocType(fileType) ? (
      <FileImage className="h-4 w-4 text-blue-500" />
    ) : (
      <FileText className="h-4 w-4 text-green-500" />
    );
  };

  const handleAddPrescription = () => {
    router.push(`/dashboard/doctor/consultation/${queueId}/prescription`);
  };

  const handleEndSession = async () => {
    if (!window.confirm('End this consultation? The patient will be marked completed and removed from the queue.')) {
      return;
    }
    try {
      setEnding(true);
      // Promote a still-waiting entry first — a queue only allows
      // waiting → in_consultation → completed.
      if (queueStatus === 'waiting') {
        await queueApi.updateQueueStatus(parseInt(queueId), 'in_consultation');
      }
      await queueApi.updateQueueStatus(parseInt(queueId), 'completed');
      toast.success('Consultation completed');
      router.push('/dashboard/doctor/queue-management');
    } catch {
      // The axios interceptor already surfaces the server's reason (e.g. a 409
      // if the entry is not in consultation).
    } finally {
      setEnding(false);
    }
  };

  // Patient-uploaded files are routed to the tab that matches their type; the
  // rest are grouped by type under Documents. An upload whose "home" tab is not
  // available falls back to Documents so nothing is ever hidden.
  const labUploads = documents.filter((d) => d.document_type === 'lab_report');
  const rxUploads = documents.filter((d) => d.document_type === 'prescription');
  const showLabUploads = (activeConsent?.allow_lab_reports ?? false) && labUploads.length > 0;
  const showRxUploads = (activeConsent?.allow_prescriptions ?? false) && rxUploads.length > 0;
  const otherUploads = documents.filter(
    (d) =>
      (d.document_type !== 'lab_report' || !showLabUploads) &&
      (d.document_type !== 'prescription' || !showRxUploads),
  );
  const groupedOtherUploads = otherUploads.reduce<Record<string, MedicalDocument[]>>((acc, d) => {
    (acc[d.document_type] ||= []).push(d);
    return acc;
  }, {});

  const renderDocumentCard = (document: MedicalDocument) => (
    <Card key={document.id}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            {getDocumentIcon(document.document_type)}
          </div>
          <div>
            <p className="font-medium">{document.file_name}</p>
            <p className="text-sm text-muted-foreground">
              {documentTypeLabel(document.document_type)} • {document.status}
            </p>
            {document.description && (
              <p className="text-sm text-muted-foreground">{document.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              {document.document_date && (
                <span>Date: {new Date(document.document_date).toLocaleDateString()}</span>
              )}
              {document.doctor_name && <span>• Dr: {document.doctor_name}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Patient information not found.</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
      <div className="space-y-6">
        {/* Patient Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {patient.first_name} {patient.last_name}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>UHID: {patient.uhid}</span>
              <span>•</span>
              <span>{patient.gender} • {patient.blood_group}</span>
              <span>•</span>
              <span>Age: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleAddPrescription}>
              <Plus className="mr-2 h-4 w-4" />
              Add Prescription
            </Button>
            {queueStatus === 'completed' ? (
              <Badge variant="secondary" className="gap-1 px-3 py-2">
                <CheckCircle className="h-4 w-4" />
                Consultation completed
              </Badge>
            ) : (
              <Button onClick={handleEndSession} disabled={ending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {ending ? 'Ending…' : 'End Session'}
              </Button>
            )}
          </div>
        </div>

        {/* Consent Status Alert */}
        {activeConsent && (
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Active Consent:</strong> {activeConsent.consent_type.replace('_', ' ')} 
                  {activeConsent.purpose && ` - ${activeConsent.purpose}`}
                </div>
                <div className="text-sm">
                  Expires: {activeConsent.expires_at ? new Date(activeConsent.expires_at).toLocaleString() : 'No expiry'}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Consent Permissions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Data Access Permissions
                </CardTitle>
                <CardDescription>
                  What you can access for this consultation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medical History</span>
                    {getConsentIcon(activeConsent?.allow_medical_history || false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lab Reports</span>
                    {getConsentIcon(activeConsent?.allow_lab_reports || false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prescriptions</span>
                    {getConsentIcon(activeConsent?.allow_prescriptions || false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uploaded Documents</span>
                    {getConsentIcon(activeConsent?.allow_uploaded_documents || false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Allergies</span>
                    {getConsentIcon(activeConsent?.allow_allergies || false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Chronic Conditions</span>
                    {getConsentIcon(activeConsent?.allow_chronic_conditions || false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emergency Contact</span>
                    {getConsentIcon(activeConsent?.allow_emergency_contact || false)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Critical Information */}
            {(activeConsent?.allow_allergies || activeConsent?.allow_chronic_conditions) && (
              <Card className="mt-4 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeConsent?.allow_allergies && patient.medical_allergies && (
                      <div>
                        <p className="font-medium text-orange-800">Allergies:</p>
                        <p className="text-sm text-orange-700">{patient.medical_allergies}</p>
                      </div>
                    )}
                    {activeConsent?.allow_chronic_conditions && patient.chronic_conditions && (
                      <div>
                        <p className="font-medium text-orange-800">Chronic Conditions:</p>
                        <p className="text-sm text-orange-700">{patient.chronic_conditions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="history" disabled={!activeConsent?.allow_medical_history}>
                  Medical History
                </TabsTrigger>
                <TabsTrigger value="prescriptions" disabled={!activeConsent?.allow_prescriptions}>
                  Prescriptions
                </TabsTrigger>
                <TabsTrigger value="labs" disabled={!activeConsent?.allow_lab_reports}>
                  Lab Reports
                </TabsTrigger>
                <TabsTrigger value="documents" disabled={!activeConsent?.allow_uploaded_documents}>
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Patient Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Patient Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Date of Birth</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(patient.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Blood Group</p>
                          <p className="text-sm text-muted-foreground">{patient.blood_group || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">{patient.phone}</p>
                        </div>
                        {activeConsent?.allow_emergency_contact && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium">Emergency Contact</p>
                              <p className="text-sm text-muted-foreground">
                                {patient.emergency_contact_name} - {patient.emergency_contact_phone}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Quick Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {activeConsent?.allow_medical_history ? medicalRecords.length : '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">Medical Records</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {activeConsent?.allow_prescriptions ? prescriptions.length : '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">Prescriptions</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">
                              {activeConsent?.allow_lab_reports ? labReports.length : '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">Lab Reports</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">
                              {activeConsent?.allow_uploaded_documents ? documents.length : '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">Documents</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {medicalRecords.length > 0 ? (
                  <div className="space-y-4">
                    {medicalRecords.map((record) => (
                      <Card key={record.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{record.diagnosis}</CardTitle>
                            <Badge variant="outline">
                              {new Date(record.visit_date).toLocaleDateString()}
                            </Badge>
                          </div>
                          <CardDescription>Dr. {record.doctor_name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium">Chief Complaint:</p>
                              <p className="text-sm text-muted-foreground">{record.chief_complaint}</p>
                            </div>
                            {record.treatment_plan && (
                              <div>
                                <p className="font-medium">Treatment Plan:</p>
                                <p className="text-sm text-muted-foreground">{record.treatment_plan}</p>
                              </div>
                            )}
                            {record.notes && (
                              <div>
                                <p className="font-medium">Notes:</p>
                                <p className="text-sm text-muted-foreground">{record.notes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No medical records available</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="prescriptions" className="space-y-4">
                {prescriptions.length === 0 && !showRxUploads ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No prescriptions available</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <Card key={prescription.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Prescription</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant={prescription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {prescription.status}
                              </Badge>
                              <Badge variant="outline">
                                {new Date(prescription.prescription_date).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {prescription.medicines.map((medicine, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  <div>
                                    <p className="font-medium">{medicine.medicine_name}</p>
                                    <p className="text-muted-foreground">{medicine.dosage}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Frequency</p>
                                    <p className="text-muted-foreground">{medicine.frequency}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Duration</p>
                                    <p className="text-muted-foreground">{medicine.duration}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Instructions</p>
                                    <p className="text-muted-foreground">{medicine.instructions || 'None'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {prescription.notes && (
                              <div>
                                <p className="font-medium">Notes:</p>
                                <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {showRxUploads && (
                      <div className="space-y-3">
                        <Separator />
                        <p className="text-sm font-medium text-muted-foreground">
                          Patient-uploaded documents
                        </p>
                        {rxUploads.map(renderDocumentCard)}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="labs" className="space-y-4">
                {labReports.length === 0 && !showLabUploads ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <TestTube className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No lab reports available</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {labReports.map((report) => (
                      <Card key={report.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{report.test_name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant={report.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {report.status}
                              </Badge>
                              <Badge variant="outline">
                                {new Date(report.requested_date).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                          <CardDescription>Type: {report.test_type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {report.results && (
                              <div>
                                <p className="font-medium">Results:</p>
                                <p className="text-sm text-muted-foreground">{report.results}</p>
                              </div>
                            )}
                            {report.interpretation && (
                              <div>
                                <p className="font-medium">Interpretation:</p>
                                <p className="text-sm text-muted-foreground">{report.interpretation}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {showLabUploads && (
                      <div className="space-y-3">
                        <Separator />
                        <p className="text-sm font-medium text-muted-foreground">
                          Patient-uploaded documents
                        </p>
                        {labUploads.map(renderDocumentCard)}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                {otherUploads.length > 0 ? (
                  Object.entries(groupedOtherUploads).map(([type, docs]) => (
                    <div key={type} className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {documentTypeLabel(type)}
                      </p>
                      {docs.map(renderDocumentCard)}
                    </div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {showLabUploads || showRxUploads
                          ? 'All uploaded documents are shown under their matching tab.'
                          : 'No documents available'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}