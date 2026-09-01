"use client"

import { TestTube, Calendar } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePatientLabReports } from "@/hooks/use-api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/patient" },
  { title: "Lab Reports" },
]

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  completed: "default",
  in_progress: "secondary",
  requested: "outline",
  cancelled: "destructive",
}

export default function PatientLabReportsPage() {
  const { data: reports = [], isLoading } = usePatientLabReports()

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lab Reports</h1>
          <p className="text-muted-foreground">
            Results from diagnostic centres, newest first.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <TestTube className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No lab reports yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{report.test_name}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 pt-1">
                        <span>{report.test_type}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(report.requested_date).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={STATUS_VARIANT[report.status] ?? "outline"}>
                      {String(report.status).replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Results" value={report.results} />
                  <Row label="Reference ranges" value={report.reference_ranges} />
                  <Row label="Interpretation" value={report.interpretation} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  )
}
