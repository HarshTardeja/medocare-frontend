"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, User, MapPin, Phone, AlertTriangle, CheckCircle, XCircle, Loader2, Radio, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { queueApi } from "@/lib/api-client"
import { useQueueEvents } from "@/hooks/use-queue-events"
import { QueueStatusResponse, QueueStatus, QueuePriority } from "@/types/api"

interface QueueStatusProps {
  queueId: number
  onCancel?: () => void
  className?: string
}

export function QueueStatusComponent({ queueId, onCancel, className }: QueueStatusProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const [reassignmentNotice, setReassignmentNotice] = useState<string | null>(null)

  const loadQueueStatus = useCallback(async () => {
    try {
      const status = await queueApi.getQueueStatus(queueId)
      setQueueStatus(status)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load queue status")
    } finally {
      setLoading(false)
    }
  }, [queueId])

  // Live updates. The poll below stays as a fallback: SSE can be dropped by a
  // proxy or lost if Redis is unavailable, and a stale queue position is worse
  // than a slightly chatty one.
  const { connected } = useQueueEvents(queueId, {
    onEvent: (event, data) => {
      if (event === "reassigned") {
        const payload = data as { hospital_name?: string }
        setReassignmentNotice(
          payload?.hospital_name
            ? `You have been moved to ${payload.hospital_name}, which can see you sooner.`
            : "You have been moved to a centre that can see you sooner."
        )
      }
      loadQueueStatus()
    },
  })

  useEffect(() => {
    loadQueueStatus()
    // Poll slowly while the stream is healthy, at the original rate when it is not.
    const interval = setInterval(loadQueueStatus, connected ? 120000 : 30000)
    return () => clearInterval(interval)
  }, [loadQueueStatus, connected])

  const handleCancel = async () => {
    if (!queueStatus || queueStatus.status !== "waiting") return
    
    setCancelling(true)
    try {
      await queueApi.cancelQueue(queueId)
      await loadQueueStatus() // Refresh status
      onCancel?.()
    } catch (err: any) {
      setError(err.message || "Failed to cancel queue")
    } finally {
      setCancelling(false)
    }
  }

  const getStatusIcon = (status: QueueStatus) => {
    switch (status) {
      case "waiting":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "in_consultation":
        return <User className="h-5 w-5 text-green-500" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "no_show":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case "waiting":
        return "blue"
      case "in_consultation":
        return "green"
      case "completed":
        return "green"
      case "cancelled":
        return "red"
      case "no_show":
        return "yellow"
      default:
        return "gray"
    }
  }

  const getPriorityColor = (priority: QueuePriority) => {
    switch (priority) {
      case "emergency":
        return "destructive"
      case "high":
        return "destructive"
      case "normal":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const getLeaveBy = () => {
    if (!queueStatus?.leave_at) return null
    const leaveAt = new Date(queueStatus.leave_at)
    const minutesAway = Math.round((leaveAt.getTime() - Date.now()) / 60000)
    return {
      time: leaveAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      minutesAway,
      now: minutesAway <= 0,
    }
  }

  const getEstimatedTime = () => {
    if (!queueStatus?.estimated_wait_time) return "N/A"
    
    const minutes = queueStatus.estimated_wait_time
    if (minutes < 60) {
      return `~${minutes} minutes`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `~${hours}h ${remainingMinutes}m`
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading queue status...
        </CardContent>
      </Card>
    )
  }

  if (error || !queueStatus) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || "Queue not found"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(queueStatus.status)}
            Queue Status
            {connected && (
              <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-green-600">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Your position in the doctor's queue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* The point of the whole product: wait at home, leave when told. */}
          {queueStatus.status === "waiting" && getLeaveBy() && (
            <Alert className={getLeaveBy()!.now ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"}>
              <Navigation className="h-4 w-4" />
              <AlertDescription>
                {getLeaveBy()!.now ? (
                  <p className="font-medium">Leave now to arrive in time for your turn.</p>
                ) : (
                  <>
                    <p className="font-medium">
                      Leave by {getLeaveBy()!.time}
                      <span className="font-normal text-muted-foreground">
                        {" "}({getLeaveBy()!.minutesAway} min from now)
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      You can wait at home until then
                      {queueStatus.travel_time_minutes != null
                        ? ` — the journey takes about ${queueStatus.travel_time_minutes} min.`
                        : "."}
                    </p>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Told, not silently moved: being re-routed without warning is worse
              than a longer wait. */}
          {reassignmentNotice && (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Your appointment moved</p>
                <p className="text-sm">{reassignmentNotice}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* AI Summary if available */}
          {queueStatus.ai_summary && (
            <Alert className="border-l-4" style={{ borderLeftColor: getPriorityColor(queueStatus.priority) === "destructive" ? "rgb(239 68 68)" : "rgb(59 130 246)" }}>
              <AlertDescription>
                <p className="font-medium mb-1">Medical Summary</p>
                <p className="text-sm">{queueStatus.ai_summary}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Status Overview */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold capitalize">
                {queueStatus.status.replace("_", " ")}
              </h3>
              <p className="text-sm text-muted-foreground">
                Queue #{queueStatus.queue_number}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex flex-col gap-1">
                <Badge variant={getPriorityColor(queueStatus.priority)} className="mb-1">
                  {queueStatus.priority.toUpperCase()}
                  {queueStatus.is_emergency && " • EMERGENCY"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Position: {queueStatus.current_position}
              </div>
            </div>
          </div>

          <Separator />

          {/* Doctor Information */}
          <div>
            <h4 className="font-medium mb-3">Doctor Details</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{queueStatus.doctor_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {queueStatus.doctor_specialization}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm">{queueStatus.assigned_hospital_name || queueStatus.hospital_name || "Location TBD"}</span>
                  {queueStatus.priority === "emergency" || queueStatus.priority === "high" ? (
                    <span className="text-xs text-red-600">
                      ⚡ Assigned for fastest care
                    </span>
                  ) : queueStatus.priority === "low" ? (
                    <span className="text-xs text-green-600">
                      🏠 Assigned for convenience
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Optimized for your needs
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Time Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm">Estimated Wait Time</h5>
              <p className="text-lg font-semibold text-blue-600">
                {getEstimatedTime()}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-sm">Joined Queue</h5>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(queueStatus.joined_at)}
              </p>
            </div>
          </div>

          {queueStatus.consultation_started_at && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm">Consultation Started</h5>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(queueStatus.consultation_started_at)}
                </p>
              </div>
              {queueStatus.consultation_completed_at && (
                <div>
                  <h5 className="font-medium text-sm">Consultation Completed</h5>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(queueStatus.consultation_completed_at)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status-specific messages */}
          {queueStatus.status === "waiting" && queueStatus.current_position === 1 && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold">You're next!</p>
                <p className="text-sm">Please be ready at {queueStatus.assigned_hospital_name || queueStatus.hospital_name}.</p>
              </AlertDescription>
            </Alert>
          )}
          
          {queueStatus.status === "waiting" && queueStatus.current_position > 1 && queueStatus.current_position <= 3 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                You're position #{queueStatus.current_position}. Please arrive at{" "}
                {queueStatus.assigned_hospital_name || queueStatus.hospital_name}{" "}
                soon.
              </AlertDescription>
            </Alert>
          )}

          {queueStatus.status === "in_consultation" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your consultation is currently in progress.
              </AlertDescription>
            </Alert>
          )}

          {queueStatus.status === "completed" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your consultation has been completed. Thank you for using MediLink!
              </AlertDescription>
            </Alert>
          )}

          {queueStatus.status === "cancelled" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                This queue has been cancelled.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={loadQueueStatus}
              size="sm"
            >
              Refresh Status
            </Button>

            {queueStatus.status === "waiting" && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling}
                size="sm"
              >
                {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Queue
              </Button>
            )}
          </div>

          {/* Auto-refresh indicator */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Status updates automatically every 30 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}