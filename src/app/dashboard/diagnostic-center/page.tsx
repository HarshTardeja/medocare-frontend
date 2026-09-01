"use client"

import { useState, useEffect, useCallback } from "react"
import { FlaskConical, Clock, CheckCircle, Search, Loader2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { diagnosticsApi } from "@/lib/api-client"
import { toast } from "sonner"

interface LabRequest {
  id: number
  patient_uhid?: string
  patient_name?: string
  requested_by_doctor_name?: string
  test_name: string
  test_type: string
  results?: string
  reference_ranges?: string
  interpretation?: string
  status: "requested" | "in_progress" | "completed" | "cancelled"
  requested_date: string
  completed_date?: string
}

interface Stats {
  pending_requests: number
  in_progress: number
  completed_today: number
  total_completed: number
}

export default function DiagnosticCenterPage() {
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [stats, setStats] = useState<Stats>({
    pending_requests: 0,
    in_progress: 0,
    completed_today: 0,
    total_completed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [qrToken, setQrToken] = useState("")
  const [publishing, setPublishing] = useState<LabRequest | null>(null)
  const [form, setForm] = useState({ results: "", reference_ranges: "", interpretation: "" })
  const [saving, setSaving] = useState(false)

  const breadcrumbs = [{ title: "Dashboard", href: "/dashboard/diagnostic-center" }]

  const load = useCallback(async () => {
    try {
      const [requestData, statsData] = await Promise.all([
        diagnosticsApi.getRequests(),
        diagnosticsApi.getStats(),
      ])
      setRequests(requestData)
      setStats(statsData)
    } catch {
      // The axios interceptor already surfaces the error as a toast.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const lookupByQr = async () => {
    if (!qrToken.trim()) return
    try {
      const [patient, pending] = await Promise.all([
        diagnosticsApi.getPatientByQR(qrToken.trim()),
        diagnosticsApi.getRequestsByQR(qrToken.trim()),
      ])
      setRequests(pending)
      toast.success(
        `${patient.first_name} ${patient.last_name} — ${pending.length} test(s) pending`
      )
    } catch {
      // Interceptor handles the message.
    }
  }

  const startTest = async (request: LabRequest) => {
    try {
      await diagnosticsApi.updateStatus(request.id, "in_progress")
      toast.success(`Started ${request.test_name}`)
      load()
    } catch {
      /* handled by interceptor */
    }
  }

  const publish = async () => {
    if (!publishing) return
    setSaving(true)
    try {
      await diagnosticsApi.publishResults(publishing.id, form)
      toast.success("Results published — the patient and ordering doctor can see them now")
      setPublishing(null)
      setForm({ results: "", reference_ranges: "", interpretation: "" })
      load()
    } catch {
      /* handled by interceptor */
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (status: LabRequest["status"]) => {
    switch (status) {
      case "requested":
        return <Badge variant="secondary">Requested</Badge>
      case "in_progress":
        return <Badge variant="default">In progress</Badge>
      case "completed":
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="destructive">Cancelled</Badge>
    }
  }

  const byStatus = (status: LabRequest["status"] | "all") =>
    status === "all" ? requests : requests.filter((r) => r.status === status)

  const renderList = (items: LabRequest[]) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-8 text-center">No tests to show.</p>
      )
    }
    return (
      <div className="space-y-3">
        {items.map((request) => (
          <Card key={request.id}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{request.test_name}</h4>
                  {statusBadge(request.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {request.patient_name} ({request.patient_uhid}) · {request.test_type}
                </p>
                {request.requested_by_doctor_name && (
                  <p className="text-xs text-muted-foreground">
                    Ordered by {request.requested_by_doctor_name}
                  </p>
                )}
                {request.results && (
                  <p className="text-sm mt-2">
                    <span className="font-medium">Result:</span> {request.results}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {request.status === "requested" && (
                  <Button size="sm" variant="outline" onClick={() => startTest(request)}>
                    Start
                  </Button>
                )}
                {request.status === "in_progress" && (
                  <Button size="sm" onClick={() => setPublishing(request)}>
                    Publish results
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["diagnostic_center"]} breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={["diagnostic_center"]} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Diagnostic Centre</h1>
          <p className="text-muted-foreground">
            Test requests, results, and patient lookup
          </p>
        </div>

        {(
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending_requests}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In progress</CardTitle>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.in_progress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed_today}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_completed}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Patient at the counter
            </CardTitle>
            <CardDescription>
              Enter the code from the patient&apos;s QR to see their pending tests
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Access code"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupByQr()}
            />
            <Button onClick={lookupByQr} disabled={!qrToken.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Look up
            </Button>
            <Button variant="ghost" onClick={() => { setQrToken(""); load() }}>
              Reset
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="requested">
          <TabsList>
            <TabsTrigger value="requested">Pending ({byStatus("requested").length})</TabsTrigger>
            <TabsTrigger value="in_progress">
              In progress ({byStatus("in_progress").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({byStatus("completed").length})
            </TabsTrigger>
            <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="requested" className="mt-4">{renderList(byStatus("requested"))}</TabsContent>
          <TabsContent value="in_progress" className="mt-4">
            {renderList(byStatus("in_progress"))}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">{renderList(byStatus("completed"))}</TabsContent>
          <TabsContent value="all" className="mt-4">{renderList(requests)}</TabsContent>
        </Tabs>
      </div>

      <Dialog open={publishing !== null} onOpenChange={(open) => !open && setPublishing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish results</DialogTitle>
            <DialogDescription>
              {publishing?.test_name} for {publishing?.patient_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                Results become visible to the patient and the ordering doctor immediately, and
                cannot be edited afterwards.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="results">Results</Label>
              <Textarea
                id="results"
                value={form.results}
                onChange={(e) => setForm({ ...form, results: e.target.value })}
                placeholder="e.g. Hb 13.5 g/dL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ranges">Reference ranges</Label>
              <Input
                id="ranges"
                value={form.reference_ranges}
                onChange={(e) => setForm({ ...form, reference_ranges: e.target.value })}
                placeholder="e.g. 13.0 - 17.0 g/dL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interpretation">Interpretation</Label>
              <Textarea
                id="interpretation"
                value={form.interpretation}
                onChange={(e) => setForm({ ...form, interpretation: e.target.value })}
                placeholder="e.g. Within normal limits"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishing(null)}>
              Cancel
            </Button>
            <Button onClick={publish} disabled={saving || !form.results.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
