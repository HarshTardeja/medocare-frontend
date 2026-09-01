"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, User, Plus } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { queueApi } from "@/lib/api-client"
import { QueueStatusResponse } from "@/types/api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/patient" },
  { title: "Appointments" },
]

export default function PatientAppointmentsPage() {
  const [queues, setQueues] = useState<QueueStatusResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queueApi
      .getMyQueues()
      .then((res) => setQueues(res.queues || []))
      .catch(() => setQueues([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">
              MediLink consultations run as a live queue &mdash; book one and get
              told when to leave.
            </p>
          </div>
          <Button asChild>
            <a href="/dashboard/patient/book-consultation">
              <Plus className="h-4 w-4 mr-2" />
              Book consultation
            </a>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : queues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                You have no active appointments.
              </p>
              <Button asChild variant="outline">
                <a href="/dashboard/patient/book-consultation">Book your first one</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {queues.map((q) => (
              <Card key={q.queue_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Queue #{q.queue_number}
                    </CardTitle>
                    <Badge variant="outline">
                      {q.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>Position #{q.current_position}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {q.doctor_name} · {q.doctor_specialization}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {q.hospital_name}
                  </span>
                  {q.estimated_wait_time != null && (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      ~{q.estimated_wait_time} min wait
                    </span>
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button asChild variant="outline" size="sm">
                    <a href="/dashboard/patient/my-queues">Live status →</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
