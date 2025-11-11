'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  FileText,
  TestTube,
  Pill,
  Upload,
  Heart,
  Phone,
  Calendar,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePatientConsents, useCreatePatientConsent, useRevokePatientConsent } from '@/hooks/use-api';
import { queueApi } from '@/lib/api-client';

const documentTypes = [
  { value: 'lab_report', label: 'Lab Reports', icon: TestTube },
  { value: 'xray', label: 'X-Ray', icon: FileText },
  { value: 'mri_scan', label: 'MRI Scan', icon: FileText },
  { value: 'ct_scan', label: 'CT Scan', icon: FileText },
  { value: 'ultrasound', label: 'Ultrasound', icon: FileText },
  { value: 'prescription', label: 'Prescriptions', icon: Pill },
  { value: 'medical_certificate', label: 'Medical Certificates', icon: FileText },
  { value: 'discharge_summary', label: 'Discharge Summaries', icon: FileText },
  { value: 'vaccination_record', label: 'Vaccination Records', icon: Heart },
  { value: 'allergy_report', label: 'Allergy Reports', icon: AlertTriangle },
  { value: 'surgical_report', label: 'Surgical Reports', icon: FileText },
  { value: 'other', label: 'Other Documents', icon: FileText }
];

interface ConsentData {
  doctor_id?: number;
  hospital_id?: number;
  consultation_id?: number;
  consent_type: string;
  purpose?: string;
  allow_medical_history: boolean;
  allow_lab_reports: boolean;
  allow_prescriptions: boolean;
  allow_uploaded_documents: boolean;
  allow_allergies: boolean;
  allow_chronic_conditions: boolean;
  allow_emergency_contact: boolean;
  allowed_document_types?: string[];
  excluded_document_ids?: number[];
  expires_at?: string;
  notes?: string;
}

export default function ConsentManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [consentData, setConsentData] = useState<ConsentData>({
    consent_type: 'specific_consultation',
    purpose: '',
    doctor_id: undefined,
    hospital_id: undefined,
    consultation_id: undefined,
    allow_medical_history: false,
    allow_lab_reports: false,
    allow_prescriptions: false,
    allow_uploaded_documents: false,
    allow_allergies: false,
    allow_chronic_conditions: false,
    allow_emergency_contact: false,
    allowed_document_types: [],
    excluded_document_ids: [],
    notes: ''
  });
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);

  // API hooks
  const { data: consents = [], isLoading: isLoadingConsents } = usePatientConsents();
  const createConsentMutation = useCreatePatientConsent();
  const revokeConsentMutation = useRevokePatientConsent();

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/patient' },
    { title: 'Consent Management' }
  ];

  // Load doctors and hospitals when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      loadDoctorsAndHospitals();
    }
  }, [isCreateDialogOpen]);

  const loadDoctorsAndHospitals = async () => {
    try {
      setIsLoadingDoctors(true);
      setIsLoadingHospitals(true);
      
      const [doctorsResponse, hospitalsResponse] = await Promise.all([
        queueApi.getAvailableDoctors(undefined, undefined, "cross_hospital"),
        queueApi.getHospitals()
      ]);
      
      // Extract doctors from the available doctors response
      setDoctors(doctorsResponse.doctors || []);
      setHospitals(hospitalsResponse);
    } catch (error) {
      console.error('Error loading doctors and hospitals:', error);
      toast.error('Failed to load doctors and hospitals');
    } finally {
      setIsLoadingDoctors(false);
      setIsLoadingHospitals(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'GRANTED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REVOKED': return 'destructive';
      case 'EXPIRED': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GRANTED': return CheckCircle;
      case 'PENDING': return Clock;
      case 'REVOKED': return XCircle;
      case 'EXPIRED': return AlertTriangle;
      default: return Clock;
    }
  };

  const handlePermissionChange = (permission: keyof ConsentData, checked: boolean) => {
    setConsentData(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const handleDocumentTypeToggle = (docType: string) => {
    setSelectedDocumentTypes(prev => {
      const newTypes = prev.includes(docType)
        ? prev.filter(type => type !== docType)
        : [...prev, docType];
      
      setConsentData(prevData => ({
        ...prevData,
        allowed_document_types: newTypes
      }));
      
      return newTypes;
    });
  };

  const handleCreateConsent = async () => {
    if (!consentData.consent_type) {
      toast.error("Please select a consent type.");
      return;
    }

    // Check if at least one permission is granted
    const hasPermissions = 
      consentData.allow_medical_history ||
      consentData.allow_lab_reports ||
      consentData.allow_prescriptions ||
      consentData.allow_uploaded_documents ||
      consentData.allow_allergies ||
      consentData.allow_chronic_conditions ||
      consentData.allow_emergency_contact;

    if (!hasPermissions) {
      toast.error("Please select at least one data sharing permission.");
      return;
    }

    // Check if at least one target (doctor, hospital, or consultation) is specified
    const hasTarget = consentData.doctor_id || consentData.hospital_id || consentData.consultation_id;
    if (!hasTarget) {
      toast.error("Please select at least a doctor or hospital for this consent.");
      return;
    }

    try {
      await createConsentMutation.mutateAsync({
        ...consentData,
        allowed_document_types: selectedDocumentTypes.length > 0 ? selectedDocumentTypes : undefined,
        expires_at: consentData.expires_at ? new Date(consentData.expires_at).toISOString() : undefined
      });

      // Reset form
      setConsentData({
        consent_type: 'specific_consultation',
        purpose: '',
        doctor_id: undefined,
        hospital_id: undefined,
        consultation_id: undefined,
        allow_medical_history: false,
        allow_lab_reports: false,
        allow_prescriptions: false,
        allow_uploaded_documents: false,
        allow_allergies: false,
        allow_chronic_conditions: false,
        allow_emergency_contact: false,
        allowed_document_types: [],
        excluded_document_ids: [],
        notes: ''
      });
      setSelectedDocumentTypes([]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleRevokeConsent = async (consentId: number) => {
    try {
      await revokeConsentMutation.mutateAsync(consentId);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['patient']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Consent Management</h1>
            <p className="text-muted-foreground">
              Manage what medical information you share with healthcare providers
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Consent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Data Sharing Consent</DialogTitle>
                <DialogDescription>
                  Choose what medical information you want to share with healthcare providers
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Consent Type */}
                <div className="space-y-2">
                  <Label>Consent Type</Label>
                  <Select
                    value={consentData.consent_type}
                    onValueChange={(value) => setConsentData(prev => ({ ...prev, consent_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select consent type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="specific_consultation">Specific Consultation</SelectItem>
                      <SelectItem value="ongoing_care">Ongoing Care</SelectItem>
                      <SelectItem value="emergency">Emergency Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose (Optional)</Label>
                  <Input
                    id="purpose"
                    placeholder="e.g., Regular checkup, Surgery consultation"
                    value={consentData.purpose}
                    onChange={(e) => setConsentData(prev => ({ ...prev, purpose: e.target.value }))}
                  />
                </div>

                {/* Doctor Selection */}
                <div className="space-y-2">
                  <Label>Doctor (Optional)</Label>
                  <Select
                    value={consentData.doctor_id?.toString() || 'none'}
                    onValueChange={(value) => setConsentData(prev => ({ 
                      ...prev, 
                      doctor_id: value === "none" ? undefined : parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingDoctors ? "Loading doctors..." : "Select a doctor"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific doctor</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.doctor_id} value={doctor.doctor_id.toString()}>
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Leave empty to allow access to any doctor at the selected hospital
                  </p>
                </div>

                {/* Hospital Selection */}
                <div className="space-y-2">
                  <Label>Hospital (Optional)</Label>
                  <Select
                    value={consentData.hospital_id?.toString() || 'none'}
                    onValueChange={(value) => setConsentData(prev => ({ 
                      ...prev, 
                      hospital_id: value === "none" ? undefined : parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingHospitals ? "Loading hospitals..." : "Select a hospital"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific hospital</SelectItem>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id.toString()}>
                          {hospital.name} - {hospital.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Leave empty to allow access to any hospital
                  </p>
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label htmlFor="expires-at">Expiry Date (Optional)</Label>
                  <Input
                    id="expires-at"
                    type="datetime-local"
                    value={consentData.expires_at}
                    onChange={(e) => setConsentData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>

                <Separator />

                {/* Data Sharing Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Sharing Permissions</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="medical-history"
                        checked={consentData.allow_medical_history}
                        onCheckedChange={(checked) => handlePermissionChange('allow_medical_history', checked as boolean)}
                      />
                      <Label htmlFor="medical-history" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Medical History & Records
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lab-reports"
                        checked={consentData.allow_lab_reports}
                        onCheckedChange={(checked) => handlePermissionChange('allow_lab_reports', checked as boolean)}
                      />
                      <Label htmlFor="lab-reports" className="flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        Lab Reports & Test Results
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prescriptions"
                        checked={consentData.allow_prescriptions}
                        onCheckedChange={(checked) => handlePermissionChange('allow_prescriptions', checked as boolean)}
                      />
                      <Label htmlFor="prescriptions" className="flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        Prescriptions & Medications
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="uploaded-documents"
                        checked={consentData.allow_uploaded_documents}
                        onCheckedChange={(checked) => handlePermissionChange('allow_uploaded_documents', checked as boolean)}
                      />
                      <Label htmlFor="uploaded-documents" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Uploaded Documents
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allergies"
                        checked={consentData.allow_allergies}
                        onCheckedChange={(checked) => handlePermissionChange('allow_allergies', checked as boolean)}
                      />
                      <Label htmlFor="allergies" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Allergies & Adverse Reactions
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="chronic-conditions"
                        checked={consentData.allow_chronic_conditions}
                        onCheckedChange={(checked) => handlePermissionChange('allow_chronic_conditions', checked as boolean)}
                      />
                      <Label htmlFor="chronic-conditions" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Chronic Conditions
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emergency-contact"
                        checked={consentData.allow_emergency_contact}
                        onCheckedChange={(checked) => handlePermissionChange('allow_emergency_contact', checked as boolean)}
                      />
                      <Label htmlFor="emergency-contact" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Emergency Contact Information
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Document Type Filters */}
                {consentData.allow_uploaded_documents && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Document Types (Optional)</h3>
                      <p className="text-sm text-muted-foreground">
                        Select specific document types to share. Leave empty to share all uploaded documents.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {documentTypes.map((docType) => {
                          const IconComponent = docType.icon;
                          return (
                            <div key={docType.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`doc-${docType.value}`}
                                checked={selectedDocumentTypes.includes(docType.value)}
                                onCheckedChange={() => handleDocumentTypeToggle(docType.value)}
                              />
                              <Label htmlFor={`doc-${docType.value}`} className="flex items-center gap-2 text-sm">
                                <IconComponent className="h-3 w-3" />
                                {docType.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or conditions for this consent..."
                    value={consentData.notes}
                    onChange={(e) => setConsentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateConsent}
                    disabled={createConsentMutation.isPending}
                  >
                    {createConsentMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Consent'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Consents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              My Data Sharing Consents
            </CardTitle>
            <CardDescription>
              View and manage your medical data sharing permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingConsents ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : consents.length > 0 ? (
              <div className="space-y-4">
                {consents.map((consent: any) => {
                  const StatusIcon = getStatusIcon(consent.status);
                  return (
                    <div key={consent.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium capitalize">
                              {consent.consent_type.replace('_', ' ')} Consent
                            </h3>
                            <Badge variant={getStatusBadgeVariant(consent.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {consent.status}
                            </Badge>
                          </div>
                          
                          {consent.purpose && (
                            <p className="text-sm text-muted-foreground">
                              Purpose: {consent.purpose}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            {consent.allow_medical_history && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                Medical History
                              </Badge>
                            )}
                            {consent.allow_lab_reports && (
                              <Badge variant="outline" className="text-xs">
                                <TestTube className="h-3 w-3 mr-1" />
                                Lab Reports
                              </Badge>
                            )}
                            {consent.allow_prescriptions && (
                              <Badge variant="outline" className="text-xs">
                                <Pill className="h-3 w-3 mr-1" />
                                Prescriptions
                              </Badge>
                            )}
                            {consent.allow_uploaded_documents && (
                              <Badge variant="outline" className="text-xs">
                                <Upload className="h-3 w-3 mr-1" />
                                Documents
                              </Badge>
                            )}
                            {consent.allow_allergies && (
                              <Badge variant="outline" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Allergies
                              </Badge>
                            )}
                            {consent.allow_chronic_conditions && (
                              <Badge variant="outline" className="text-xs">
                                <Heart className="h-3 w-3 mr-1" />
                                Chronic Conditions
                              </Badge>
                            )}
                            {consent.allow_emergency_contact && (
                              <Badge variant="outline" className="text-xs">
                                <Phone className="h-3 w-3 mr-1" />
                                Emergency Contact
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created: {new Date(consent.created_at).toLocaleDateString()}
                            </div>
                            {consent.expires_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires: {new Date(consent.expires_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          {consent.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              "{consent.notes}"
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {consent.status === 'GRANTED' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Revoke Consent</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to revoke this data sharing consent? 
                                    Healthcare providers will no longer have access to your shared information.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                  <DialogTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogTrigger>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => handleRevokeConsent(consent.id)}
                                    disabled={revokeConsentMutation.isPending}
                                  >
                                    {revokeConsentMutation.isPending ? 'Revoking...' : 'Revoke Consent'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No consents created</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first data sharing consent to control what information you share with healthcare providers
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Consent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Shield className="h-5 w-5" />
              About Data Sharing Consents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li>• <strong>Specific Consultation:</strong> Share data for a single medical appointment</li>
              <li>• <strong>Ongoing Care:</strong> Share data for continuous treatment with a healthcare provider</li>
              <li>• <strong>Emergency Access:</strong> Allow emergency access to critical medical information</li>
              <li>• You can revoke any consent at any time</li>
              <li>• Healthcare providers can only access the specific data you authorize</li>
              <li>• All data access is logged and monitored for your security</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}