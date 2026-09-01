"use client"

import { FileText, Calendar, Stethoscope } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePatientMedicalRecords } from "@/hooks/use-api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/patient" },
  { title: "Medical Records" },
]

export default function PatientMedicalRecordsPage() {
  const { data: records = [], isLoading } = usePatientMedicalRecords()

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">
            Consultation notes written by the doctors who have seen you.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No medical records yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {records.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{record.chief_complaint}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(record.visit_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5" />
                          {(record as any).doctor_name ??
                            record.doctor?.full_name ??
                            "Unknown doctor"}
                        </span>
                      </CardDescription>
                    </div>
                    {record.follow_up_date && (
                      <Badge variant="outline">
                        Follow-up {new Date(record.follow_up_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Diagnosis" value={record.diagnosis} />
                  <Row label="Treatment plan" value={record.treatment_plan} />
                  {record.notes && <Row label="Notes" value={record.notes} />}
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
  return (
    <div>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="whitespace-pre-wrap">{value || "—"}</p>
    </div>
  )
}
