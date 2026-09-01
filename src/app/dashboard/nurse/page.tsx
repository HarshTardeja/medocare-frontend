"use client"

import { useEffect, useState } from "react"
import { Search, User, Stethoscope, Loader2, AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { patientApi, queueApi } from "@/lib/api-client"
import { useNurseStats } from "@/hooks/use-api"
import {
  PatientResponse,
  HospitalResponse,
  AvailableDoctorResponse,
  PatientQueueInfo,
} from "@/types/api"
import { toast } from "sonner"

const breadcrumbs = [{ title: "Dashboard", href: "/dashboard/nurse" }]

export default function NurseDashboardPage() {
  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["nurse"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Nurse Station</h1>
          <p className="text-muted-foreground">
            Your hospital at a glance &mdash; look patients up and watch the doctor queues.
          </p>
        </div>
        <HospitalStats />
        <PatientLookup />
        <DoctorQueues />
      </div>
    </DashboardLayout>
  )
}

function HospitalStats() {
  const { data: s } = useNurseStats()
  const cards: [string, number | undefined][] = [
    ["Waiting", s?.patients_waiting],
    ["In consultation", s?.in_consultation],
    ["Emergencies waiting", s?.emergency_waiting],
    ["Doctors on duty", s?.doctors_on_duty],
    ["Completed today", s?.completed_today],
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(([label, value]) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value ?? "—"}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PatientLookup() {
  const [uhid, setUhid] = useState("")
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookup = async () => {
    if (!uhid.trim()) return
    setLoading(true)
    setError(null)
    setPatient(null)
    try {
      setPatient(await patientApi.getPatientByUhid(uhid.trim().toUpperCase()))
    } catch (err: any) {
      setError(err.response?.data?.detail || "No patient found with that UHID")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card id="patient-lookup">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Patient lookup
        </CardTitle>
        <CardDescription>Search by Universal Health ID (UHID).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="ML2500000001"
            value={uhid}
            onChange={(e) => setUhid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
          />
          <Button onClick={lookup} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {patient && (
          <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <Detail label="Name" value={`${patient.first_name} ${patient.last_name}`} />
            <Detail label="UHID" value={patient.uhid} mono />
            <Detail label="Date of birth" value={patient.date_of_birth} />
            <Detail label="Gender" value={patient.gender} />
            <Detail label="Phone" value={patient.phone} />
            <Detail label="Blood group" value={patient.blood_group || "—"} />
            <Detail label="Allergies" value={patient.medical_allergies || "None recorded"} />
            <Detail
              label="Chronic conditions"
              value={patient.chronic_conditions || "None recorded"}
            />
            <Detail
              label="Emergency contact"
              value={
                patient.emergency_contact_name
                  ? `${patient.emergency_contact_name} · ${patient.emergency_contact_phone ?? ""}`
                  : "—"
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DoctorQueues() {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([])
  const [hospitalId, setHospitalId] = useState<string>("")
  const [doctors, setDoctors] = useState<AvailableDoctorResponse[]>([])
  const [doctorId, setDoctorId] = useState<string>("")
  const [queue, setQueue] = useState<PatientQueueInfo[]>([])
  const [loadingQueue, setLoadingQueue] = useState(false)

  useEffect(() => {
    queueApi
      .getHospitals()
      .then(setHospitals)
      .catch(() => toast.error("Could not load hospitals"))
  }, [])

  useEffect(() => {
    if (!hospitalId) return
    setDoctors([])
    setDoctorId("")
    setQueue([])
    queueApi
      .getAvailableDoctors(Number(hospitalId), undefined, "hospital_specific", undefined, true)
      .then((res) => setDoctors(res.doctors))
      .catch(() => toast.error("Could not load doctors"))
  }, [hospitalId])

  useEffect(() => {
    if (!doctorId) return
    setLoadingQueue(true)
    queueApi
      .getDoctorQueue(Number(doctorId), Number(hospitalId) || undefined)
      .then((res) => setQueue(res.queue))
      .catch(() => toast.error("Could not load that queue"))
      .finally(() => setLoadingQueue(false))
  }, [doctorId, hospitalId])

  return (
    <Card id="doctor-queues">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Doctor queues
        </CardTitle>
        <CardDescription>Pick a hospital, then a doctor, to see the waiting list.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Hospital</Label>
            <Select value={hospitalId} onValueChange={setHospitalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={String(h.id)}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Doctor</Label>
            <Select value={doctorId} onValueChange={setDoctorId} disabled={!doctors.length}>
              <SelectTrigger>
                <SelectValue placeholder={doctors.length ? "Select doctor" : "Pick a hospital first"} />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.doctor_id} value={String(d.doctor_id)}>
                    {d.name} — {d.specialization} ({d.current_queue_size} waiting)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {doctorId && (
          <div className="overflow-x-auto">
            {loadingQueue ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : queue.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No one is waiting for this doctor right now.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>UHID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((entry) => (
                    <TableRow key={entry.queue_id}>
                      <TableCell>{entry.queue_number}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {entry.patient_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{entry.patient_uhid}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {String(entry.status).replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.is_emergency ? (
                          <Badge variant="destructive">emergency</Badge>
                        ) : (
                          String(entry.priority)
                        )}
                      </TableCell>
                      <TableCell>{new Date(entry.joined_at).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value?: string
  mono?: boolean
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm" : "text-sm capitalize"}>{value}</span>
    </div>
  )
}
