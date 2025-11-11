'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Pill, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  QrCode,
  MapPin,
  Phone,
  Building2,
  User,
  FileText,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { usePatientPrescriptions, useGenerateQRAccess } from '@/hooks/use-api';

import { PrescriptionResponse } from '@/types/api';

export default function PrescriptionsPage() {
  // Using sonner toast directly
  const [qrCodeData, setQRCodeData] = useState<{ qr_code: string; access_token: string; expires_at: string } | null>(null);
  
  // Debug: Log when qrCodeData changes
  console.log('qrCodeData state:', qrCodeData);

  // API hooks
  const { data: prescriptions = [], isLoading, refetch } = usePatientPrescriptions();
  const generateQRMutation = useGenerateQRAccess();

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/patient' },
    { title: 'My Prescriptions' }
  ];

  // Filter prescriptions by status
  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const dispensedPrescriptions = prescriptions.filter(p => p.status === 'dispensed');
  const expiredPrescriptions = prescriptions.filter(p => p.status === 'expired' || p.status === 'cancelled');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'dispensed': return 'secondary';
      case 'expired': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return Clock;
      case 'dispensed': return CheckCircle;
      case 'expired': return AlertTriangle;
      case 'cancelled': return AlertTriangle;
      default: return Clock;
    }
  };

  const handleGenerateQR = async () => {
    try {
      const response = await generateQRMutation.mutateAsync({
        access_type: 'prescription_only',
        duration_hours: 0.5
      });
      console.log('QR Response:', response);
      setQRCodeData(response);
      console.log('QR Data set:', response);
    } catch (error) {
      console.error('QR Generation error:', error);
      // Error handling is done in the mutation
    }
  };

  const handleDownloadPrescription = (prescriptionId: number) => {
    // Mock download functionality
    toast.success("Prescription PDF is being generated and will download shortly.");
  };


  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['patient']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Prescriptions</h1>
            <p className="text-muted-foreground">
              View and manage your medical prescriptions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleGenerateQR} disabled={generateQRMutation.isPending}>
              {generateQRMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR for Pharmacy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? '...' : activePrescriptions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for dispensing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispensed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : dispensedPrescriptions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Already collected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : activePrescriptions.reduce((total, p) => total + p.medicines.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                In active prescriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Follow-ups</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : activePrescriptions.filter(p => p.follow_up_date).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled appointments
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activePrescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="dispensed">
              Dispensed ({dispensedPrescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({expiredPrescriptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading prescriptions...</p>
                </CardContent>
              </Card>
            ) : activePrescriptions.length > 0 ? (
              <div className="space-y-4">
                {activePrescriptions.map((prescription) => {
                  const StatusIcon = getStatusIcon(prescription.status);
                  return (
                    <Card key={prescription.id} className="border-green-200 bg-green-50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-green-800">
                              <StatusIcon className="h-5 w-5" />
                              Prescription #{prescription.id}
                              {prescription.doctor && (
                                <span> from Dr. {prescription.doctor.user.full_name}</span>
                              )}
                            </CardTitle>
                            <CardDescription className="text-green-600">
                              Prescribed on {new Date(prescription.prescription_date).toLocaleDateString()}
                              {prescription.follow_up_date && (
                                <span> • Follow-up: {new Date(prescription.follow_up_date).toLocaleDateString()}</span>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(prescription.status)} className="bg-green-100 text-green-800">
                              {prescription.status}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadPrescription(prescription.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Medicines */}
                          <div>
                            <h4 className="font-medium mb-3">Prescribed Medicines:</h4>
                            <div className="space-y-3">
                              {prescription.medicines.map((medicine, index) => (
                                <div key={medicine.id || index} className="bg-white border border-green-200 rounded-lg p-3">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <p className="font-medium text-green-800">{medicine.medicine.name}</p>
                                      <p className="text-green-600">Qty: {medicine.quantity_prescribed}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-green-800">Dosage</p>
                                      <p className="text-green-600">{medicine.dosage} ({medicine.frequency})</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-green-800">Duration</p>
                                      <p className="text-green-600">{medicine.duration}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-green-800">Instructions</p>
                                      <p className="text-green-600">{medicine.instructions || 'None'}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Notes */}
                          {prescription.notes && (
                            <Alert className="border-green-300 bg-green-100">
                              <FileText className="h-4 w-4" />
                              <AlertDescription className="text-green-800">
                                <strong>Doctor's Notes:</strong> {prescription.notes}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Follow-up reminder */}
                          {prescription.follow_up_date && (
                            <Alert className="border-blue-300 bg-blue-100">
                              <Calendar className="h-4 w-4" />
                              <AlertDescription className="text-blue-800">
                                <strong>Follow-up Scheduled:</strong> {new Date(prescription.follow_up_date).toLocaleDateString()} at {new Date(prescription.follow_up_date).toLocaleTimeString()}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active prescriptions</h3>
                  <p className="text-muted-foreground">
                    You don't have any active prescriptions at the moment.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dispensed" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading prescriptions...</p>
                </CardContent>
              </Card>
            ) : dispensedPrescriptions.length > 0 ? (
              <div className="space-y-4">
                {dispensedPrescriptions.map((prescription) => {
                  const StatusIcon = getStatusIcon(prescription.status);
                  return (
                    <Card key={prescription.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <StatusIcon className="h-5 w-5 text-green-500" />
                              Prescription #{prescription.id}
                              {prescription.doctor && (
                                <span> from Dr. {prescription.doctor.user.full_name}</span>
                              )}
                            </CardTitle>
                            <CardDescription>
                              Prescribed on {new Date(prescription.prescription_date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(prescription.status)}>
                              {prescription.status}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadPrescription(prescription.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Dispensing Information */}
                          {prescription.pharmacy && (
                            <Alert className="border-green-300 bg-green-100">
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription className="text-green-800">
                                <div className="space-y-1">
                                  <p><strong>Dispensed by:</strong> {prescription.pharmacy.name}</p>
                                  <p><strong>Status:</strong> Dispensed</p>
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Medicines */}
                          <div>
                            <h4 className="font-medium mb-3">Dispensed Medicines:</h4>
                            <div className="space-y-3">
                              {prescription.medicines.map((medicine, index) => (
                                <div key={medicine.id || index} className="bg-muted rounded-lg p-3">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <p className="font-medium">{medicine.medicine.name}</p>
                                      <p className="text-muted-foreground">Qty: {medicine.quantity_prescribed}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium">Dosage</p>
                                      <p className="text-muted-foreground">{medicine.dosage}</p>
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
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No dispensed prescriptions</h3>
                  <p className="text-muted-foreground">
                    Prescriptions you've collected from pharmacies will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading prescriptions...</p>
                </CardContent>
              </Card>
            ) : expiredPrescriptions.length > 0 ? (
              <div className="space-y-4">
                {expiredPrescriptions.map((prescription) => {
                  const StatusIcon = getStatusIcon(prescription.status);
                  return (
                    <Card key={prescription.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <StatusIcon className="h-5 w-5 text-muted-foreground" />
                              Prescription #{prescription.id}
                              {prescription.doctor && (
                                <span> from Dr. {prescription.doctor.user.full_name}</span>
                              )}
                            </CardTitle>
                            <CardDescription>
                              Prescribed on {new Date(prescription.prescription_date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(prescription.status)}>
                              {prescription.status}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadPrescription(prescription.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {prescription.medicines.map((medicine, index) => (
                            <div key={medicine.id || index} className="text-sm text-muted-foreground">
                              <span className="font-medium">{medicine.medicine.name}</span> - {medicine.dosage} for {medicine.duration}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No prescription history</h3>
                  <p className="text-muted-foreground">
                    Your expired and completed prescriptions will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <AlertTriangle className="h-5 w-5" />
              How to Use Your Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li>• <strong>Active Prescriptions:</strong> Take your UHID to any authorized pharmacy or generate a QR code for quick access</li>
              <li>• <strong>QR Code:</strong> Show the generated QR code to the pharmacist for instant prescription access</li>
              <li>• <strong>Medicine Instructions:</strong> Follow the dosage format (Morning-Afternoon-Evening) as prescribed</li>
              <li>• <strong>Follow-up Appointments:</strong> Don't miss scheduled follow-up appointments with your doctor</li>
              <li>• <strong>Download:</strong> You can download prescription PDFs for your records</li>
              <li>• <strong>Questions:</strong> Contact your prescribing doctor if you have any questions about your medications</li>
            </ul>
          </CardContent>
        </Card>

        {/* QR Code Dialog */}
        <Dialog open={!!qrCodeData} onOpenChange={(open) => !open && setQRCodeData(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code for Pharmacy Access</DialogTitle>
              <DialogDescription>
                Show this QR code to the pharmacist to access your prescriptions. 
                {qrCodeData && (
                  <span className="block mt-2 text-sm">
                    Expires: {new Date(qrCodeData.expires_at).toLocaleString()}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              {qrCodeData && (
                <>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${qrCodeData.qr_code}`}
                      alt="QR Code for Pharmacy Access"
                      className="max-w-full h-auto"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Access Token (for reference):</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                      {qrCodeData.access_token}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setQRCodeData(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}