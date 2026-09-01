'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useDoctorPatients } from '@/hooks/use-api';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard/doctor' },
  { title: 'My Patients' },
];

export default function DoctorPatientsPage() {
  const { data: patients = [], isLoading } = useDoctorPatients();
  const [q, setQ] = useState('');

  const filtered = patients.filter((p) => {
    const s = `${p.first_name} ${p.last_name} ${p.uhid}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Patients</h1>
          <p className="text-muted-foreground">
            Everyone you&rsquo;ve treated, plus patients who made you their family doctor.
          </p>
        </div>

        <Input
          placeholder="Search by name or UHID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No patients yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((p) => (
              <Link key={p.id} href={`/dashboard/doctor/patients/${p.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {p.first_name} {p.last_name}
                        </span>
                        <Badge variant="outline">{p.uhid}</Badge>
                        {p.is_family_patient && <Badge>Family patient</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {p.gender} · DOB {p.date_of_birth}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
