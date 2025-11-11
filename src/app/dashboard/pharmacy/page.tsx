'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Pill, 
  QrCode, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Package,
  Truck,
  FileText,
  Scan,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import { usePrescriptionsByUhid, usePrescriptionsByQR, useDispensePrescription, useDispensedMedicines } from '@/hooks/use-api';

export default function PharmacyDashboard() {
  const [searchMethod, setSearchMethod] = useState<'uhid' | 'qr'>('uhid');
  const [searchValue, setSearchValue] = useState('');
  const [searchTrigger, setSearchTrigger] = useState<{ method: 'uhid' | 'qr'; value: string } | null>(null);
  // Using sonner toast directly

  // API hooks
  const { data: dispensedMedicines = [], isLoading: isLoadingDispensed } = useDispensedMedicines();
  const dispenseMutation = useDispensePrescription();
  
  // Search hooks - only enabled when we have a search trigger
  const { data: uhidPrescriptions = [], isLoading: isLoadingUhid, error: uhidError } = usePrescriptionsByUhid(
    searchTrigger?.method === 'uhid' ? searchTrigger.value : ''
  );
  const { data: qrPrescriptions = [], isLoading: isLoadingQR, error: qrError } = usePrescriptionsByQR(
    searchTrigger?.method === 'qr' ? searchTrigger.value : ''
  );
  
  // Determine current prescriptions and loading state
  const prescriptions = searchTrigger?.method === 'uhid' ? uhidPrescriptions : qrPrescriptions;
  const isSearching = searchTrigger ? (searchTrigger.method === 'uhid' ? isLoadingUhid : isLoadingQR) : false;
  const searchError = searchTrigger?.method === 'uhid' ? uhidError : qrError;

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/pharmacy' },
    { title: 'Overview' }
  ];

  const handleSearch = () => {
    if (!searchValue.trim()) {
      toast.error("Please enter a UHID or scan a QR code.");
      return;
    }

    // Trigger the search by setting the search trigger
    setSearchTrigger({ method: searchMethod, value: searchValue.trim() });
  };
  
  // Handle search errors
  React.useEffect(() => {
    if (searchError) {
      toast.error("Unable to search for prescriptions. Please try again.");
    }
  }, [searchError]);
  
  // Handle search results
  React.useEffect(() => {
    if (searchTrigger && !isSearching && !searchError) {
      if (prescriptions.length === 0) {
        toast.info("No active prescriptions found for this patient.");
      }
    }
  }, [searchTrigger, isSearching, searchError, prescriptions.length]);

  const handleDispensePrescription = async (prescriptionId: number) => {
    try {
      await dispenseMutation.mutateAsync(prescriptionId);
      
      // Refresh the search results after dispensing
      if (searchTrigger) {
        setSearchTrigger({ ...searchTrigger });
      }
    } catch {
      // Error handling is done in the mutation
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'dispensed': return 'secondary';
      case 'expired': return 'outline';
      default: return 'secondary';
    }
  };

  const mockStats = {
    totalPrescriptions: 45,
    todayDispensed: 12,
    pendingDispensing: 8,
    totalRevenue: 15420
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['pharmacy']}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">
            Manage prescriptions and dispense medications to patients
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalPrescriptions}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today Dispensed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{mockStats.todayDispensed}</div>
              <p className="text-xs text-muted-foreground">
                Completed today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Dispensing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{mockStats.pendingDispensing}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting dispensing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{mockStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList>
            <TabsTrigger value="search">Search Prescriptions</TabsTrigger>
            <TabsTrigger value="dispensed">Dispensed History</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Patient Prescriptions
                </CardTitle>
                <CardDescription>
                  Search for patient prescriptions using UHID or QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="uhid-search"
                      name="search-method"
                      checked={searchMethod === 'uhid'}
                      onChange={() => setSearchMethod('uhid')}
                    />
                    <Label htmlFor="uhid-search">UHID Search</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="qr-search"
                      name="search-method"
                      checked={searchMethod === 'qr'}
                      onChange={() => setSearchMethod('qr')}
                    />
                    <Label htmlFor="qr-search">QR Code</Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder={searchMethod === 'uhid' ? 'Enter UHID (e.g., UH123456)' : 'Scan QR code or enter access token'}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : searchMethod === 'uhid' ? (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    ) : (
                      <>
                        <Scan className="mr-2 h-4 w-4" />
                        Scan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {prescriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Prescriptions Found ({prescriptions.length})
                  </CardTitle>
                  <CardDescription>
                    Active prescriptions for the searched patient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {prescriptions.map((prescription) => (
                      <div key={prescription.id} className="border rounded-lg p-4 space-y-4">
                        {/* Prescription Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {prescription.patient ? 
                                  `${prescription.patient.first_name} ${prescription.patient.last_name}` : 
                                  'Unknown Patient'
                                }
                              </h3>
                              <Badge variant="outline">{prescription.patient?.uhid || 'No UHID'}</Badge>
                              <Badge variant={getStatusColor(prescription.status)}>
                                {prescription.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Dr. {prescription.doctor?.user?.full_name || 'Unknown Doctor'}</span>
                              <span>•</span>
                              <span>{new Date(prescription.prescription_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {prescription.status.toLowerCase() === 'active' && (
                            <Button
                              onClick={() => handleDispensePrescription(prescription.id)}
                              disabled={dispenseMutation.isPending}
                            >
                              {dispenseMutation.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Dispensing...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="mr-2 h-4 w-4" />
                                  Dispense
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Medicines List */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Prescribed Medicines:</h4>
                          {prescription.medicines.map((medicine, index) => (
                            <div key={index} className="bg-muted rounded-lg p-3">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
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

                        {/* Notes */}
                        {prescription.notes && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="font-medium text-blue-800 mb-1">Doctor's Notes:</p>
                            <p className="text-blue-700 text-sm">{prescription.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dispensed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Dispensed Medicines History
                </CardTitle>
                <CardDescription>
                  Recently dispensed medications and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDispensed ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : dispensedMedicines.length > 0 ? (
                  <div className="space-y-4">
                    {dispensedMedicines.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{item.medicine_name}</p>
                              <Badge variant="outline">Qty: {item.quantity_dispensed}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{item.patient_name} ({item.patient_uhid})</span>
                              <span>•</span>
                              <span>{new Date(item.dispensed_date).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{item.total_price}</p>
                            <Badge variant="secondary">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Dispensed
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No dispensed medicines</h3>
                    <p className="text-muted-foreground">
                      Dispensed medications will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Information Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-5 w-5" />
              Pharmacy Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li>• Always verify patient identity before dispensing medications</li>
              <li>• Check prescription validity and doctor's digital signature</li>
              <li>• Ensure proper storage and handling of medications</li>
              <li>• Provide clear instructions to patients about medication usage</li>
              <li>• Report any suspicious prescriptions or activities</li>
              <li>• Maintain accurate records of all dispensed medications</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}