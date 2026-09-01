"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Stethoscope } from "lucide-react"
import {
  usePatientProfile,
  useUpdatePatientProfile,
  useSetFamilyDoctor,
  useClearFamilyDoctor,
} from "@/hooks/use-api"
import { queueApi } from "@/lib/api-client"
import { PatientResponse, PatientUpdate } from "@/types/api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/patient" },
  { title: "My Profile" },
]

const EDITABLE: (keyof PatientUpdate)[] = [
  "first_name",
  "last_name",
  "phone",
  "address",
  "blood_group",
  "emergency_contact_name",
  "emergency_contact_phone",
  "medical_allergies",
  "chronic_conditions",
]

export default function PatientProfilePage() {
  const { data: profile, isLoading } = usePatientProfile()
  const update = useUpdatePatientProfile()
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!profile) return
    const next: Record<string, string> = {}
    for (const key of EDITABLE) next[key] = (profile as any)[key] ?? ""
    setForm(next)
  }, [profile])

  const set = (name: string, value: string) =>
    setForm((f) => ({ ...f, [name]: value }))

  const onSave = () => {
    const payload: PatientUpdate = {}
    for (const key of EDITABLE) {
      const value = form[key]?.trim() ?? ""
      ;(payload as any)[key] = value === "" ? null : value
    }
    update.mutate(payload)
  }

  if (isLoading || !profile) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["patient"]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["patient"]}>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Keep your contact and medical details up to date.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>These details cannot be changed here.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1">
              <Label className="text-muted-foreground">UHID</Label>
              <span className="font-mono">{profile.uhid}</span>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Date of birth</Label>
              <span>{profile.date_of_birth}</span>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Gender</Label>
              <span className="capitalize">{profile.gender}</span>
            </div>
          </CardContent>
        </Card>

        <FamilyDoctorCard profile={profile} />

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input value={form.first_name ?? ""} onChange={(e) => set("first_name", e.target.value)} />
            </Field>
            <Field label="Last name">
              <Input value={form.last_name ?? ""} onChange={(e) => set("last_name", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Blood group">
              <Input value={form.blood_group ?? ""} onChange={(e) => set("blood_group", e.target.value)} placeholder="O+, A-, …" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Emergency contact name">
              <Input value={form.emergency_contact_name ?? ""} onChange={(e) => set("emergency_contact_name", e.target.value)} />
            </Field>
            <Field label="Emergency contact phone">
              <Input value={form.emergency_contact_phone ?? ""} onChange={(e) => set("emergency_contact_phone", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical</CardTitle>
            <CardDescription>Shared with clinicians you consult.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Allergies">
              <Textarea value={form.medical_allergies ?? ""} onChange={(e) => set("medical_allergies", e.target.value)} placeholder="e.g. Penicillin" />
            </Field>
            <Field label="Chronic conditions">
              <Textarea value={form.chronic_conditions ?? ""} onChange={(e) => set("chronic_conditions", e.target.value)} placeholder="e.g. Type 2 Diabetes, Hypertension" />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

const CATEGORIES = [
  ["allow_medical_history", "Medical history"],
  ["allow_lab_reports", "Lab reports"],
  ["allow_prescriptions", "Prescriptions"],
  ["allow_uploaded_documents", "Uploaded documents"],
] as const

function FamilyDoctorCard({ profile }: { profile: PatientResponse }) {
  const setFamily = useSetFamilyDoctor()
  const clearFamily = useClearFamilyDoctor()
  const [open, setOpen] = useState(false)
  const [doctors, setDoctors] = useState<{ doctor_id: number; name: string; specialization: string }[]>([])
  const [doctorId, setDoctorId] = useState<string>("")
  const [flags, setFlags] = useState<Record<string, boolean>>({
    allow_medical_history: true,
    allow_lab_reports: true,
    allow_prescriptions: true,
    allow_uploaded_documents: false,
  })

  useEffect(() => {
    if (!open) return
    queueApi
      .getAvailableDoctors(undefined, undefined, "cross_hospital", undefined, true)
      .then((res) => setDoctors(res.doctors.map((d) => ({
        doctor_id: d.doctor_id,
        name: d.name,
        specialization: d.specialization,
      }))))
      .catch(() => setDoctors([]))
  }, [open])

  const save = () => {
    if (!doctorId) return
    setFamily.mutate(
      {
        doctor_id: Number(doctorId),
        allow_medical_history: flags.allow_medical_history,
        allow_lab_reports: flags.allow_lab_reports,
        allow_prescriptions: flags.allow_prescriptions,
        allow_uploaded_documents: flags.allow_uploaded_documents,
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  const noneChosen = !Object.values(flags).some(Boolean)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Family doctor
        </CardTitle>
        <CardDescription>
          Your chosen doctor can see the records you tick, any time &mdash; not just during a visit.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {profile.family_doctor_name || "No family doctor set"}
          </p>
          {profile.family_doctor_name && (
            <p className="text-sm text-muted-foreground">Has standing access to your shared records</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(true)}>
            {profile.family_doctor_name ? "Change" : "Choose a doctor"}
          </Button>
          {profile.family_doctor_name && (
            <Button
              variant="ghost"
              onClick={() => clearFamily.mutate()}
              disabled={clearFamily.isPending}
            >
              Remove
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose your family doctor</DialogTitle>
            <DialogDescription>Pick a doctor and what they may see.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.doctor_id} value={String(d.doctor_id)}>
                      {d.name} — {d.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>They can see</Label>
              {CATEGORIES.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={flags[key]}
                    onCheckedChange={(v) => setFlags((f) => ({ ...f, [key]: v === true }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!doctorId || noneChosen || setFamily.isPending}>
              {setFamily.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
