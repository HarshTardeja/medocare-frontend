"use client"

import { useState, useEffect } from "react"
import { Clock, User, MapPin, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import { QueueStatusComponent } from "@/components/queue-status"
import { queueApi } from "@/lib/api-client"
import { QueueStatusResponse } from "@/types/api"

export default function MyQueuesPage() {
  const [queues, setQueues] = useState<QueueStatusResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQueue, setSelectedQueue] = useState<number | null>(null)

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/patient' },
    { title: 'My Queues' }
  ]

  useEffect(() => {
    loadQueues()
  }, [])

  const loadQueues = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await queueApi.getMyQueues()
      setQueues(response.queues || [])
    } catch (err: any) {
      setError(err.message || "Failed to load queues")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "in_consultation":
        return <User className="h-4 w-4 text-green-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "blue"
      case "in_consultation":
        return "green"
      case "completed":
        return "green"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  if (selectedQueue) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['patient']}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedQueue(null)}>
              ← Back to All Queues
            </Button>
            <h1 className="text-2xl font-bold">Queue Details</h1>
          </div>
          <QueueStatusComponent
            queueId={selectedQueue}
            onCancel={() => {
              setSelectedQueue(null)
              loadQueues()
            }}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['patient']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Queues</h1>
            <p className="text-muted-foreground">
              Track your consultation queue status
            </p>
          </div>
          <Button variant="outline" onClick={loadQueues} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Queue List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Loading your queues...</p>
            </div>
          </div>
        ) : queues.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No Active Queues</h3>
                  <p className="text-muted-foreground">
                    You don't have any active consultation queues
                  </p>
                </div>
                <Button asChild>
                  <a href="/dashboard/patient/book-consultation">
                    Book New Consultation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {queues.map((queue) => (
              <Card 
                key={queue.queue_id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedQueue(queue.queue_id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(queue.status)}
                      Queue #{queue.queue_number}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={getStatusColor(queue.status)}>
                        {queue.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {queue.is_emergency && (
                        <Badge variant="destructive">EMERGENCY</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Current Position: #{queue.current_position}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Doctor Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Doctor</h4>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{queue.doctor_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {queue.doctor_specialization}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Hospital</h4>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{queue.hospital_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-xs text-muted-foreground mb-1">
                        JOINED QUEUE
                      </h5>
                      <p className="text-sm">{formatDateTime(queue.joined_at)}</p>
                    </div>
                    
                    {queue.estimated_wait_time && (
                      <div>
                        <h5 className="font-medium text-xs text-muted-foreground mb-1">
                          ESTIMATED WAIT
                        </h5>
                        <p className="text-sm">
                          ~{queue.estimated_wait_time} minutes
                        </p>
                      </div>
                    )}
                    
                    {queue.consultation_started_at && (
                      <div>
                        <h5 className="font-medium text-xs text-muted-foreground mb-1">
                          CONSULTATION STARTED
                        </h5>
                        <p className="text-sm">
                          {formatDateTime(queue.consultation_started_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status-specific information */}
                  {queue.status === "waiting" && queue.current_position <= 3 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You're next! Please be ready to arrive at the hospital.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {queues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button asChild>
                  <a href="/dashboard/patient/book-consultation">
                    Book Another Consultation
                  </a>
                </Button>
                <Button variant="outline" onClick={loadQueues}>
                  Refresh All Statuses
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-refresh info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Queue statuses update automatically. Click on any queue for live updates.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}