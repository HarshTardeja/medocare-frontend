'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Save, 
  User, 
  Calendar,
  FileText,
  PenTool,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { consultationApi } from '@/lib/api-client';

interface Medicine {
  id: string;
  medicine_name: string;
  dosage_morning: string;
  dosage_afternoon: string;
  dosage_evening: string;
  duration: string;
  instructions: string;
  quantity: number;
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

interface PrescriptionData {
  patient_id: number;
  medicines: Array<{
    medicine_id: number;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity_prescribed: number;
  }>;
  notes: string;
  follow_up_date?: string;
}

export default function PrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const queueId = params.queueId as string;

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [digitalSignature, setDigitalSignature] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/doctor' },
    { title: 'Queue Management', href: '/dashboard/doctor/queue-management' },
    { title: 'Consultation', href: `/dashboard/doctor/consultation/${queueId}` },
    { title: 'Prescription' }
  ];

  useEffect(() => {
    loadPatientData();
    addMedicine(); // Add first medicine row
  }, [queueId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const patientData = await consultationApi.getPatientByQueue(parseInt(queueId));
      setPatient(patientData);
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = () => {
    const newMedicine: Medicine = {
      id: `med_${Date.now()}`,
      medicine_name: '',
      dosage_morning: '0',
      dosage_afternoon: '0',
      dosage_evening: '0',
      duration: '',
      instructions: '',
      quantity: 0
    };
    setMedicines(prev => [...prev, newMedicine]);
  };

  const removeMedicine = (id: string) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
  };

  const updateMedicine = (id: string, field: keyof Medicine, value: string | number) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const formatDosage = (medicine: Medicine) => {
    return `${medicine.dosage_morning}-${medicine.dosage_afternoon}-${medicine.dosage_evening}`;
  };

  const validatePrescription = () => {
    if (medicines.length === 0) {
      toast.error("No medicines added. Please add at least one medicine to the prescription.");
      return false;
    }

    for (const medicine of medicines) {
      if (!medicine.medicine_name.trim()) {
        toast.error("Medicine name required. Please enter a name for all medicines.");
        return false;
      }
      if (!medicine.duration.trim()) {
        toast.error("Duration required. Please specify duration for all medicines.");
        return false;
      }
      if (medicine.quantity <= 0) {
        toast.error("Invalid quantity. Please specify a valid quantity for all medicines.");
        return false;
      }
    }

    if (!digitalSignature.trim()) {
      toast.error("Digital signature required. Please provide your digital signature to authorize this prescription.");
      return false;
    }

    return true;
  };

  const handleCreatePrescription = async () => {
    if (!validatePrescription() || !patient) return;

    setIsCreating(true);
    try {
      const prescriptionData = {
        medicines: medicines.map(med => ({
          medicine_name: med.medicine_name, // Send medicine name instead of ID
          dosage: formatDosage(med),
          frequency: `${med.dosage_morning || '0'}-${med.dosage_afternoon || '0'}-${med.dosage_evening || '0'}`,
          duration: med.duration,
          instructions: med.instructions,
          quantity_prescribed: med.quantity
        })),
        notes: prescriptionNotes,
        follow_up_date: followUpDate || undefined
      };

      await consultationApi.createPrescription(parseInt(queueId), prescriptionData);

      toast.success("Prescription created successfully. The prescription has been saved and is now available to the patient.");

      // Navigate back to consultation page
      router.push(`/dashboard/doctor/consultation/${queueId}`);
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !patient) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const getPatientAge = () => {
    if (!patient?.date_of_birth) return 'Unknown';
    return new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
      <div className="space-y-6">
        {/* Prescription Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Prescription</h1>
            <p className="text-muted-foreground">
              Create a new prescription for {patient.first_name} {patient.last_name}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Date: {getCurrentDate()}</p>
            <p>Time: {getCurrentTime()}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Patient Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.first_name} {patient.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">UHID</p>
                    <p className="text-sm text-muted-foreground">{patient.uhid}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Age / Gender</p>
                    <p className="text-sm text-muted-foreground">{getPatientAge()} years / {patient.gender}</p>
                  </div>
                  {patient.blood_group && (
                    <div>
                      <p className="text-sm font-medium">Blood Group</p>
                      <p className="text-sm text-muted-foreground">{patient.blood_group}</p>
                    </div>
                  )}
                  {patient.medical_allergies && (
                    <div>
                      <p className="text-sm font-medium text-red-600">Allergies</p>
                      <p className="text-sm text-red-600">{patient.medical_allergies}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prescription Summary */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prescription Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Medicines:</span>
                    <Badge variant="outline">{medicines.length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Follow-up:</span>
                    <span className="text-muted-foreground">
                      {followUpDate ? new Date(followUpDate).toLocaleDateString() : 'Not scheduled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prescription Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Prescription Details
                </CardTitle>
                <CardDescription>
                  Add medicines and dosage instructions for the patient
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Medicines List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Medicines</Label>
                    <Button variant="outline" size="sm" onClick={addMedicine}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Medicine
                    </Button>
                  </div>

                  {medicines.map((medicine, index) => (
                    <div key={medicine.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Medicine {index + 1}</h3>
                        {medicines.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedicine(medicine.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`medicine-name-${medicine.id}`}>Medicine Name *</Label>
                          <Input
                            id={`medicine-name-${medicine.id}`}
                            placeholder="e.g., Paracetamol 500mg"
                            value={medicine.medicine_name}
                            onChange={(e) => updateMedicine(medicine.id, 'medicine_name', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`quantity-${medicine.id}`}>Quantity *</Label>
                          <Input
                            id={`quantity-${medicine.id}`}
                            type="number"
                            placeholder="e.g., 10"
                            value={medicine.quantity || ''}
                            onChange={(e) => updateMedicine(medicine.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Dosage (Morning - Afternoon - Evening) *</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor={`morning-${medicine.id}`} className="text-xs">Morning</Label>
                            <Select
                              value={medicine.dosage_morning}
                              onValueChange={(value) => updateMedicine(medicine.id, 'dosage_morning', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="0.5">½</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="1.5">1½</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`afternoon-${medicine.id}`} className="text-xs">Afternoon</Label>
                            <Select
                              value={medicine.dosage_afternoon}
                              onValueChange={(value) => updateMedicine(medicine.id, 'dosage_afternoon', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="0.5">½</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="1.5">1½</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`evening-${medicine.id}`} className="text-xs">Evening</Label>
                            <Select
                              value={medicine.dosage_evening}
                              onValueChange={(value) => updateMedicine(medicine.id, 'dosage_evening', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="0.5">½</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="1.5">1½</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Preview: {formatDosage(medicine)}
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`duration-${medicine.id}`}>Duration *</Label>
                          <Input
                            id={`duration-${medicine.id}`}
                            placeholder="e.g., 7 days, 2 weeks"
                            value={medicine.duration}
                            onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`instructions-${medicine.id}`}>Instructions</Label>
                          <Input
                            id={`instructions-${medicine.id}`}
                            placeholder="e.g., after meals, before sleep"
                            value={medicine.instructions}
                            onChange={(e) => updateMedicine(medicine.id, 'instructions', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="follow-up-date">Follow-up Date (Optional)</Label>
                    <Input
                      id="follow-up-date"
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prescription-notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="prescription-notes"
                      placeholder="Any additional instructions or notes for the patient..."
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* Digital Signature */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="digital-signature" className="flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Digital Signature *
                    </Label>
                    <Input
                      id="digital-signature"
                      placeholder="Type your full name to digitally sign this prescription"
                      value={digitalSignature}
                      onChange={(e) => setDigitalSignature(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      By typing your name, you are digitally signing this prescription and authorizing its dispensing.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePrescription}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Prescription
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Legal Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Legal Notice</p>
                <p>
                  This prescription is digitally signed and authenticated. It will be available to authorized pharmacies
                  for dispensing. Please ensure all information is accurate before creating the prescription.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}