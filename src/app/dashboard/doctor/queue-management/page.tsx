"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, User, AlertTriangle, CheckCircle, RefreshCw, Users, Stethoscope, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Separator } from "@/components/ui/separator"
import { queueApi, adminApi, doctorApi } from "@/lib/api-client"
import { useDoctorQueueEvents } from "@/hooks/use-queue-events"
import { PatientQueueInfo, DoctorQueueResponse, HospitalResponse, DoctorResponse } from "@/types/api"

export default function DoctorQueueManagementPage() {
  const router = useRouter()
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([])
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null)
  const [queueData, setQueueData] = useState<DoctorQueueResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<DoctorResponse | null>(null)
  const [queueType, setQueueType] = useState<string>('all')

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/doctor' },
    { title: 'Queue Management' }
  ]

  useEffect(() => {
    loadHospitals()
    loadDoctorProfile()
  }, [])

  // Live updates when a patient joins, cancels, or is re-assigned away. The
  // interval below stays as a fallback -- a doctor working from a stale list
  // calls the wrong patient.
  const { connected: liveConnected } = useDoctorQueueEvents(doctorProfile?.id ?? null, {
    onEvent: () => loadQueue(),
  })

  useEffect(() => {
    if (doctorProfile && (selectedHospital || queueType === 'cross_hospital' || queueType === 'all')) {
      loadQueue()
      const interval = setInterval(loadQueue, liveConnected ? 120000 : 30000)
      return () => clearInterval(interval)
    }
  }, [selectedHospital, doctorProfile, queueType, liveConnected])

  const loadHospitals = async () => {
    try {
      const hospitalData = await queueApi.getHospitals()
      setHospitals(hospitalData)
      if (hospitalData.length > 0) {
        setSelectedHospital(hospitalData[0].id)
      }
    } catch (err: any) {
      setError("Failed to load hospitals")
    }
  }

  const loadDoctorProfile = async () => {
    try {
      const profile = await doctorApi.getDoctorProfile()
      setDoctorProfile(profile)
    } catch (err: any) {
      setError("Failed to load doctor profile")
    }
  }

  const loadQueue = async () => {
    if (!doctorProfile) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await queueApi.getDoctorQueue(
        doctorProfile.id,
        selectedHospital ?? undefined,
        queueType === 'all' ? undefined : queueType
      )
      setQueueData(response)
    } catch (err: any) {
      setError(err.message || "Failed to load queue")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (queueId: number, newStatus: string) => {
    try {
      await queueApi.updateQueueStatus(queueId, newStatus)
      await loadQueue() // Refresh the queue
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    }
  }

  const handleStartConsultation = async (queueId: number) => {
    try {
      // Update queue status to in_consultation
      await queueApi.updateQueueStatus(queueId, "in_consultation")
      // Navigate to consultation page
      router.push(`/dashboard/doctor/consultation/${queueId}`)
    } catch (err: any) {
      setError(err.message || "Failed to start consultation")
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

  const getPriorityColor = (priority: string) => {
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

  const getQueueTypeBadge = (queueType: string) => {
    switch (queueType) {
      case "hospital_specific":
        return { label: "Hospital Specific", variant: "secondary" as const }
      case "cross_hospital":
        return { label: "Cross Hospital", variant: "outline" as const }
      default:
        return { label: "Unknown", variant: "secondary" as const }
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const waitingPatients = queueData?.queue.filter(q => q.status === "waiting") || []
  const inConsultation = queueData?.queue.filter(q => q.status === "in_consultation") || []

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['doctor']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Queue Management</h1>
            <p className="text-muted-foreground">
              Manage your patient consultation queue
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={queueType}
              onValueChange={(value) => {
                setQueueType(value)
                if (value === 'all') {
                  setSelectedHospital(null)
                }
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Queue Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Queues</SelectItem>
                <SelectItem value="hospital_specific">Hospital Specific</SelectItem>
                <SelectItem value="cross_hospital">Cross Hospital</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedHospital?.toString()}
              onValueChange={(value) => setSelectedHospital(parseInt(value))}
              disabled={queueType === 'all' || queueType === 'cross_hospital'}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id.toString()}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadQueue} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Queue Statistics */}
        {queueData && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{queueData.queue.length}</div>
                <p className="text-xs text-muted-foreground">In queue today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{queueData.total_waiting}</div>
                <p className="text-xs text-muted-foreground">Patients waiting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Consultation</CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{queueData.total_in_consultation}</div>
                <p className="text-xs text-muted-foreground">Currently consulting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emergency Cases</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {queueData.queue.filter(q => q.is_emergency).length}
                </div>
                <p className="text-xs text-muted-foreground">Urgent patients</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Consultation */}
        {inConsultation.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Stethoscope className="h-5 w-5" />
                Current Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inConsultation.map((patient) => (
                <div key={patient.queue_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">
                      {patient.patient_name} (UHID: {patient.patient_uhid})
                    </p>
                    <p className="text-sm text-green-700">
                      Queue #{patient.queue_number} • Started: {formatDateTime(patient.joined_at)}
                      {patient.hospital_name && (
                        <span> • Hospital: {patient.hospital_name}</span>
                      )}
                      {patient.assigned_hospital_name && (
                        <span> • Assigned to: {patient.assigned_hospital_name}</span>
                      )}
                    </p>
                    {patient.symptoms_description && (
                      <p className="text-sm text-green-600 mt-1">
                        Symptoms: {patient.symptoms_description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(patient.priority)}>
                      {patient.priority.toUpperCase()}
                    </Badge>
                    <Badge variant={getQueueTypeBadge(patient.queue_type).variant}>
                      {getQueueTypeBadge(patient.queue_type).label}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/doctor/consultation/${patient.queue_id}`)}
                    >
                      <Stethoscope className="h-4 w-4 mr-2" />
                      View Consultation
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(patient.queue_id, "completed")}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Waiting Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waiting Queue ({waitingPatients.length})
            </CardTitle>
            <CardDescription>
              Patients waiting for consultation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : waitingPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No patients waiting</p>
              </div>
            ) : (
              <div className="space-y-4">
                {waitingPatients.map((patient, index) => (
                  <div key={patient.queue_id}>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">
                            #{index + 1}
                          </div>
                          <div className="text-xs text-muted-foreground">Position</div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {patient.patient_name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {patient.patient_uhid}
                            </Badge>
                            <Badge variant={getPriorityColor(patient.priority)}>
                              {patient.priority.toUpperCase()}
                            </Badge>
                            <Badge variant={getQueueTypeBadge(patient.queue_type).variant}>
                              {getQueueTypeBadge(patient.queue_type).label}
                            </Badge>
                            {patient.is_emergency && (
                              <Badge variant="destructive">EMERGENCY</Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            Queue #{patient.queue_number} • Joined: {formatDateTime(patient.joined_at)}
                            {patient.hospital_name && (
                              <span> • Hospital: {patient.hospital_name}</span>
                            )}
                            {patient.assigned_hospital_name && (
                              <span> • Assigned to: {patient.assigned_hospital_name}</span>
                            )}
                          </div>
                          
                          {patient.symptoms_description && (
                            <div className="text-sm mt-2 p-2 bg-muted rounded">
                              <strong>Symptoms:</strong> {patient.symptoms_description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStartConsultation(patient.queue_id)}
                        >
                          Start Consultation
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-refresh info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Queue updates automatically every 30 seconds
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}