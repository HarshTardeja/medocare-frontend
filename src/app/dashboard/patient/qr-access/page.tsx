"use client"

import { useState } from "react"
import { QrCode, Copy, Check } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGenerateQRAccess } from "@/hooks/use-api"
import { AccessType } from "@/types/api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/patient" },
  { title: "QR Access" },
]

const ACCESS_TYPES: { value: AccessType; label: string; hint: string }[] = [
  { value: "full_access", label: "Full access", hint: "Profile, prescriptions and reports" },
  { value: "prescription_only", label: "Prescriptions only", hint: "For a pharmacy" },
  { value: "reports_only", label: "Reports only", hint: "For a diagnostic centre" },
  { value: "emergency_access", label: "Emergency access", hint: "Critical info for emergencies" },
]

export default function PatientQrAccessPage() {
  const [accessType, setAccessType] = useState<AccessType>("full_access")
  const [hours, setHours] = useState("1")
  const [result, setResult] = useState<
    { qr_code: string; access_token: string; expires_at: string } | null
  >(null)
  const [copied, setCopied] = useState(false)
  const generate = useGenerateQRAccess()

  const onGenerate = async () => {
    const res = await generate.mutateAsync({
      access_type: accessType,
      duration_hours: Math.max(0.1, Number(hours) || 1),
    })
    setResult(res)
    setCopied(false)
  }

  const copyToken = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.access_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">QR Access</h1>
          <p className="text-muted-foreground">
            Generate a time-limited code a provider can scan to view your records.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>New access code</CardTitle>
              <CardDescription>
                The code stops working automatically when it expires.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>What can they see?</Label>
                <Select
                  value={accessType}
                  onValueChange={(v) => setAccessType(v as AccessType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} — {t.hint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hours">Valid for (hours)</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>

              <Button
                onClick={onGenerate}
                disabled={generate.isPending}
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {generate.isPending ? "Generating…" : "Generate QR code"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your code</CardTitle>
              <CardDescription>
                {result
                  ? `Expires ${new Date(result.expires_at).toLocaleString()}`
                  : "Nothing generated yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result ? (
                <>
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${result.qr_code}`}
                      alt="Access QR code"
                      className="h-52 w-52 rounded-lg border bg-white p-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Access token</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={result.access_token} className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={copyToken}>
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A provider can enter this token manually when scanning is not possible.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex h-52 items-center justify-center text-muted-foreground">
                  <QrCode className="h-12 w-12" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
