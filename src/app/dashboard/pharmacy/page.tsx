'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { QrScanner } from '@/components/pharmacy/qr-scanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Camera,
  CheckCircle,
  AlertCircle,
  User,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  usePrescriptionsByUhid,
  usePrescriptionsByQR,
  usePatientInfoByQR,
  useDispensePrescription,
  useDispensedMedicines,
  usePharmacyStats,
} from '@/hooks/use-api';
import { PrescriptionResponse } from '@/types/api';

type Method = 'uhid' | 'qr';

export default function PharmacyDashboard() {
  const [method, setMethod] = useState<Method>('qr');
  const [inputValue, setInputValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState<{ method: Method; value: string } | null>(null);

  const dispense = useDispensePrescription();
  const { data: stats } = usePharmacyStats();
  const { data: dispensed = [], isLoading: dispensedLoading } = useDispensedMedicines() as {
    data: PrescriptionResponse[];
    isLoading: boolean;
  };

  const uhidQ = usePrescriptionsByUhid(query?.method === 'uhid' ? query.value : '');
  const qrQ = usePrescriptionsByQR(query?.method === 'qr' ? query.value : '');
  const patientQ = usePatientInfoByQR(query?.method === 'qr' ? query.value : '');

  const active = query?.method === 'uhid' ? uhidQ : qrQ;
  const prescriptions: PrescriptionResponse[] = active.data ?? [];
  const searching = active.isFetching;
  const searchError = active.error as { response?: { data?: { detail?: string } } } | null;

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/pharmacy' },
    { title: 'Overview' },
  ];

  const runSearch = (m: Method, v: string) => {
    const value = v.trim();
    if (!value) {
      toast.error(m === 'uhid' ? 'Enter a UHID.' : 'Scan a QR code or paste an access token.');
      return;
    }
    setQuery({ method: m, value });
  };

  React.useEffect(() => {
    if (searchError) {
      toast.error(
        searchError.response?.data?.detail ?? 'Could not read that code. It may be expired or revoked.'
      );
    }
  }, [searchError]);

  React.useEffect(() => {
    if (query && !searching && !searchError && prescriptions.length === 0) {
      toast.info('No prescriptions found for this patient.');
    }
  }, [query, searching, searchError, prescriptions.length]);

  const handleDispense = async (p: PrescriptionResponse) => {
    const names = p.medicines.map((m) => m.medicine.name).join(', ');
    if (!window.confirm(`Dispense ${p.medicines.length} item(s) to ${p.patient_name ?? 'this patient'}?\n\n${names}`)) {
      return;
    }
    try {
      await dispense.mutateAsync(p.id);
      toast.success(`Dispensed: ${names}`);
      if (query) setQuery({ ...query });
    } catch {
      /* mutation shows its own error toast */
    }
  };

  const patient = query?.method === 'qr' ? patientQ.data : undefined;

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['pharmacy']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pharmacy</h1>
          <p className="text-muted-foreground">
            Scan a patient&rsquo;s QR code, verify who they are, and dispense.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Dispensed today</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats?.today_dispensed ?? '—'}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Dispensed all-time</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats?.total_prescriptions ?? '—'}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats ? stats.total_revenue.toLocaleString() : '—'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active patient</CardTitle></CardHeader>
            <CardContent>
              <div className="text-lg font-semibold truncate">
                {patient ? `${patient.first_name} ${patient.last_name}` : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList>
            <TabsTrigger value="search" id="search">Find prescriptions</TabsTrigger>
            <TabsTrigger value="dispensed" id="dispensed">Dispensed history</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" /> Look up a patient
                </CardTitle>
                <CardDescription>By patient-issued QR code, or by UHID for a walk-in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={method === 'qr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMethod('qr')}
                  >
                    QR token
                  </Button>
                  <Button
                    type="button"
                    variant={method === 'uhid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setMethod('uhid'); setScanning(false); }}
                  >
                    UHID
                  </Button>
                </div>

                {scanning && method === 'qr' && (
                  <QrScanner
                    onClose={() => setScanning(false)}
                    onDecoded={(text) => {
                      setScanning(false);
                      setInputValue(text);
                      runSearch('qr', text);
                    }}
                  />
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex-1">
                    <Label htmlFor="lookup" className="sr-only">
                      {method === 'uhid' ? 'UHID' : 'Access token'}
                    </Label>
                    <Input
                      id="lookup"
                      placeholder={method === 'uhid' ? 'UHID, e.g. ML2500000003' : 'Paste access token'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && runSearch(method, inputValue)}
                    />
                  </div>
                  <div className="flex gap-2">
                    {method === 'qr' && (
                      <Button type="button" variant="outline" onClick={() => setScanning((s) => !s)}>
                        <Camera className="mr-2 h-4 w-4" />
                        {scanning ? 'Stop' : 'Scan'}
                      </Button>
                    )}
                    <Button onClick={() => runSearch(method, inputValue)} disabled={searching}>
                      <Search className="mr-2 h-4 w-4" />
                      {searching ? 'Searching…' : 'Search'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {patient && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Verify patient identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                  <Field label="Name" value={`${patient.first_name} ${patient.last_name}`} />
                  <Field label="UHID" value={patient.uhid} mono />
                  <Field label="Date of birth" value={patient.date_of_birth} />
                  <Field label="Blood group" value={patient.blood_group || '—'} />
                  <Field label="Allergies" value={patient.medical_allergies || 'None recorded'} />
                  <Field label="Chronic conditions" value={patient.chronic_conditions || 'None recorded'} />
                </CardContent>
              </Card>
            )}

            {prescriptions.length > 0 && (
              <div className="space-y-4">
                {prescriptions.map((p) => (
                  <Card key={p.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 font-semibold">
                              <User className="h-4 w-4" /> {p.patient_name ?? 'Unknown patient'}
                            </span>
                            {p.patient_uhid && <Badge variant="outline">{p.patient_uhid}</Badge>}
                            <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                              {p.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Dr. {p.doctor_name ?? 'Unknown'} · {new Date(p.prescription_date).toLocaleDateString()}
                          </p>
                        </div>
                        {p.status === 'active' && (
                          <Button onClick={() => handleDispense(p)} disabled={dispense.isPending}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {dispense.isPending ? 'Dispensing…' : 'Dispense'}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <MedicineList prescription={p} />
                      {p.notes && (
                        <p className="mt-3 rounded-md bg-muted p-3 text-sm">
                          <span className="font-medium">Doctor&rsquo;s notes: </span>{p.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dispensed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" /> Dispensed history
                </CardTitle>
                <CardDescription>Prescriptions this pharmacy has handed over.</CardDescription>
              </CardHeader>
              <CardContent>
                {dispensedLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                ) : dispensed.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">Nothing dispensed yet.</p>
                ) : (
                  <div className="space-y-4">
                    {dispensed.map((p) => (
                      <div key={p.id} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">
                            {p.patient_name ?? 'Unknown'}{' '}
                            <span className="font-normal text-muted-foreground">{p.patient_uhid}</span>
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {p.dispensed_at ? new Date(p.dispensed_at).toLocaleString() : '—'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Dr. {p.doctor_name ?? 'Unknown'}</p>
                        <MedicineList prescription={p} compact />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5" /> Before you dispense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              <li>Confirm the patient&rsquo;s name and UHID against a photo ID.</li>
              <li>Check the prescription is still <code>ACTIVE</code> — dispensing burns it.</li>
              <li>Counsel the patient on dosage and instructions before they leave.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}

function MedicineList({ prescription, compact }: { prescription: PrescriptionResponse; compact?: boolean }) {
  return (
    <div className={compact ? 'mt-2 space-y-1' : 'mt-1 space-y-2'}>
      {prescription.medicines.map((m) => (
        <div
          key={m.id}
          className={
            compact
              ? 'text-sm'
              : 'grid gap-1 rounded-md bg-muted p-3 text-sm md:grid-cols-4'
          }
        >
          <div>
            <span className="font-medium">{m.medicine.name}</span>
            <span className="text-muted-foreground"> · qty {m.quantity_prescribed}</span>
          </div>
          {!compact && (
            <>
              <div><span className="text-muted-foreground">Dosage: </span>{m.dosage}</div>
              <div><span className="text-muted-foreground">Duration: </span>{m.duration}</div>
              <div><span className="text-muted-foreground">Notes: </span>{m.instructions || '—'}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
