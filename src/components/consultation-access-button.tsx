"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { patientApi } from "@/lib/api-client"
import { QueueStatus } from "@/types/api"

interface ConsultationAccessButtonProps {
  queueId: number
  doctorId?: number
  doctorName?: string
  status: QueueStatus
  className?: string
}

// The three categories the family-doctor (ongoing-care) consent cannot carry --
// FamilyDoctorRequest only has the four below. Kept in sync with the backend.
const CATEGORIES = [
  { key: "allow_medical_history", label: "Medical history & records", standing: true },
  { key: "allow_lab_reports", label: "Lab reports & test results", standing: true },
  { key: "allow_prescriptions", label: "Prescriptions & medications", standing: true },
  { key: "allow_uploaded_documents", label: "Uploaded documents", standing: true },
  { key: "allow_allergies", label: "Allergies", standing: false },
  { key: "allow_chronic_conditions", label: "Chronic conditions", standing: false },
  { key: "allow_emergency_contact", label: "Emergency contact", standing: false },
] as const

type CategoryKey = (typeof CATEGORIES)[number]["key"]

const allChecked = () =>
  CATEGORIES.reduce((acc, c) => ({ ...acc, [c.key]: true }), {} as Record<CategoryKey, boolean>)

export function ConsultationAccessButton({
  queueId,
  doctorId,
  doctorName,
  status,
  className,
}: ConsultationAccessButtonProps) {
  const [isFamilyDoctor, setIsFamilyDoctor] = useState(false)
  const [liveGrant, setLiveGrant] = useState<any | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [makePermanent, setMakePermanent] = useState(false)
  const [flags, setFlags] = useState<Record<CategoryKey, boolean>>(allChecked)
  const [submitting, setSubmitting] = useState(false)
  const [working, setWorking] = useState(false)

  const active = status === "waiting" || status === "in_consultation"

  const refresh = useCallback(async () => {
    if (!active) return
    try {
      const [profile, consents] = await Promise.all([
        patientApi.getMyProfile(),
        patientApi.getMyConsents(),
      ])
      setIsFamilyDoctor(
        profile.family_doctor_id != null && profile.family_doctor_id === doctorId,
      )
      const grant = (consents || []).find(
        (c: any) =>
          String(c.status).toUpperCase() === "GRANTED" &&
          (c.consultation_id === queueId ||
            (c.consent_type === "ongoing_care" && c.doctor_id === doctorId)),
      )
      setLiveGrant(grant ?? null)
    } catch {
      // Non-fatal: the button just stays in its default state.
    }
  }, [active, doctorId, queueId])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!active) return null

  const doctorLabel = doctorName ? `Dr. ${doctorName}` : "this doctor"

  const openDialog = () => {
    setMakePermanent(false)
    setFlags(allChecked())
    setDialogOpen(true)
  }

  const handleStopSharing = async () => {
    if (!liveGrant) return
    setWorking(true)
    try {
      if (liveGrant.consent_type === "ongoing_care" || isFamilyDoctor) {
        await patientApi.clearFamilyDoctor()
      } else {
        await patientApi.revokeConsent(liveGrant.id)
      }
      toast.success("Access to your records has been withdrawn")
      await refresh()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Could not withdraw access")
    } finally {
      setWorking(false)
    }
  }

  const handleConfirm = async () => {
    const chosen = CATEGORIES.filter((c) => flags[c.key] && (!makePermanent || c.standing))
    if (chosen.length === 0) {
      toast.error("Select at least one thing to share")
      return
    }
    setSubmitting(true)
    try {
      if (makePermanent) {
        await patientApi.setFamilyDoctor({
          doctor_id: doctorId as number,
          allow_medical_history: flags.allow_medical_history,
          allow_lab_reports: flags.allow_lab_reports,
          allow_prescriptions: flags.allow_prescriptions,
          allow_uploaded_documents: flags.allow_uploaded_documents,
        })
        toast.success(`${doctorLabel} is now your family doctor with standing access`)
      } else {
        await patientApi.createConsent({
          consent_type: "specific_consultation",
          consultation_id: queueId,
          doctor_id: doctorId,
          purpose: "Consultation access",
          allow_medical_history: flags.allow_medical_history,
          allow_lab_reports: flags.allow_lab_reports,
          allow_prescriptions: flags.allow_prescriptions,
          allow_uploaded_documents: flags.allow_uploaded_documents,
          allow_allergies: flags.allow_allergies,
          allow_chronic_conditions: flags.allow_chronic_conditions,
          allow_emergency_contact: flags.allow_emergency_contact,
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        })
        toast.success(`${doctorLabel} can now see your records for this visit`)
      }
      setDialogOpen(false)
      await refresh()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Could not share your records")
    } finally {
      setSubmitting(false)
    }
  }

  if (isFamilyDoctor) {
    return (
      <div className={`flex items-center gap-1 ${className ?? ""}`}>
        <span className="flex items-center gap-1 text-sm font-medium text-green-600">
          <ShieldCheck className="h-4 w-4" />
          Family doctor · permanent access
        </span>
        <Button variant="link" size="sm" asChild>
          <a href="/dashboard/patient/consent-management">Manage</a>
        </Button>
      </div>
    )
  }

  if (liveGrant) {
    return (
      <div className={`flex items-center gap-2 ${className ?? ""}`}>
        <span className="flex items-center gap-1 text-sm font-medium text-green-600">
          <ShieldCheck className="h-4 w-4" />
          Access shared
        </span>
        <Button variant="ghost" size="sm" onClick={handleStopSharing} disabled={working}>
          {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Stop sharing
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button size="sm" className={className} onClick={openDialog}>
        <ShieldCheck className="mr-2 h-4 w-4" />
        Give doctor access
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share records with {doctorLabel}</DialogTitle>
            <DialogDescription>
              Choose what to share. Access ends when this consultation finishes unless you make
              them your family doctor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                id="cab-make-permanent"
                checked={makePermanent}
                onCheckedChange={(v) => setMakePermanent(v as boolean)}
              />
              <Label htmlFor="cab-make-permanent" className="text-sm font-normal">
                <span className="font-medium">Make my family doctor</span>
                <span className="block text-muted-foreground">
                  Keep access after this visit. Allergies, chronic conditions and emergency
                  contact are not available for family-doctor access.
                </span>
              </Label>
            </div>

            <div className="space-y-3">
              {CATEGORIES.map((c) => {
                const disabled = makePermanent && !c.standing
                return (
                  <div key={c.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cab-${c.key}`}
                      checked={flags[c.key] && !disabled}
                      disabled={disabled}
                      onCheckedChange={(v) =>
                        setFlags((prev) => ({ ...prev, [c.key]: v as boolean }))
                      }
                    />
                    <Label
                      htmlFor={`cab-${c.key}`}
                      className={disabled ? "text-muted-foreground" : undefined}
                    >
                      {c.label}
                      {disabled && " — not available for family-doctor access"}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {makePermanent ? "Grant standing access" : "Share for this visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
