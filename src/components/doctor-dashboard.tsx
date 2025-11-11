"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Users, Activity, MapPin, Bell, ArrowRight, Stethoscope, FileText, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { DoctorCheckInComponent } from "@/components/doctor-checkin"

interface QueuePatient {
  queue_id: number
  patient_uhid: string
  patient_name: string
  queue_number: number
  queue_type: string
  status: string
  priority: string
  symptoms_description: string
  estimated_wait_time: number
  joined_at: string
  is_emergency: boolean
  hospital_name?: string
  assigned_hospital_name?: string
}

interface DoctorStats {
  today_consultations: number
  current_queue_size: number
  avg_consultation_time: number
  total_wait_time_saved: number
  patient_satisfaction: number
  upcoming_schedule: Array<{
    hospital_name: string
    start_time: string
    end_time: string
    patient_count: number
  }>
}

interface UpcomingLeave {
  leave_id: number
  leave_type: string
  start_date: string
  end_date: string
  hospital_name?: string
  is_approved: boolean
}

export function DoctorDashboard() {
  const [currentQueue, setCurrentQueue] = useState<QueuePatient[]>([])
  const [doctorStats, setDoctorStats] = useState<DoctorStats | null>(null)
  const [upcomingLeaves, setUpcomingLeaves] = useState<UpcomingLeave[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null)

  // Mock data - replace with actual API calls
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock queue data
      const queueData: QueuePatient[] = [
        {
          queue_id: 1,
          patient_uhid: "MED001234",
          patient_name: "John Doe",
          queue_number: 1,
          queue_type: "hospital_specific",
          status: "waiting",
          priority: "normal",
          symptoms_description: "Fever and headache for 2 days",
          estimated_wait_time: 0,
          joined_at: "2024-01-15T09:00:00Z",
          is_emergency: false,
          hospital_name: "Central Hospital"
        },
        {
          queue_id: 2,
          patient_uhid: "MED001235",
          patient_name: "Jane Smith",
          queue_number: 2,
          queue_type: "hospital_specific",
          status: "waiting",
          priority: "high",
          symptoms_description: "Chest pain and shortness of breath",
          estimated_wait_time: 15,
          joined_at: "2024-01-15T09:15:00Z",
          is_emergency: true,
          hospital_name: "Central Hospital"
        },
        {
          queue_id: 3,
          patient_uhid: "MED001236",
          patient_name: "Bob Johnson",
          queue_number: 3,
          queue_type: "cross_hospital",
          status: "waiting",
          priority: "normal",
          symptoms_description: "Regular checkup",
          estimated_wait_time: 30,
          joined_at: "2024-01-15T09:30:00Z",
          is_emergency: false,
          assigned_hospital_name: "Central Hospital"
        }
      ]

      // Mock stats data
      const statsData: DoctorStats = {
        today_consultations: 8,
        current_queue_size: 3,
        avg_consultation_time: 18,
        total_wait_time_saved: 120,
        patient_satisfaction: 4.8,
        upcoming_schedule: [
          {
            hospital_name: "Central Hospital",
            start_time: "09:00",
            end_time: "17:00",
            patient_count: 12
          },
          {
            hospital_name: "City Hospital",
            start_time: "10:00",
            end_time: "14:00",
            patient_count: 6
          }
        ]
      }

      // Mock leaves data
      const leavesData: UpcomingLeave[] = [
        {
          leave_id: 1,
          leave_type: "vacation",
          start_date: "2024-01-20",
          end_date: "2024-01-22",
          is_approved: true
        },
        {
          leave_id: 2,
          leave_type: "conference",
          start_date: "2024-02-15",
          end_date: "2024-02-15",
          hospital_name: "Central Hospital",
          is_approved: false
        }
      ]

      setCurrentQueue(queueData)
      setDoctorStats(statsData)
      setUpcomingLeaves(leavesData)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const startConsultation = async (queueId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update queue status
      setCurrentQueue(prev => 
        prev.map(patient => 
          patient.queue_id === queueId 
            ? { ...patient, status: "in_consultation" }
            : patient
        )
      )
    } catch (error) {
      console.error("Failed to start consultation:", error)
    }
  }

  const completeConsultation = async (queueId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remove from queue
      setCurrentQueue(prev => prev.filter(patient => patient.queue_id !== queueId))
      
      // Update stats
      if (doctorStats) {
        setDoctorStats(prev => prev ? {
          ...prev,
          today_consultations: prev.today_consultations + 1,
          current_queue_size: prev.current_queue_size - 1
        } : null)
      }
    } catch (error) {
      console.error("Failed to complete consultation:", error)
    }
  }

  const getPriorityColor = (priority: string, isEmergency: boolean) => {
    if (isEmergency) return "destructive"
    switch (priority) {
      case "high": return "destructive"
      case "normal": return "secondary"
      case "low": return "outline"
      default: return "secondary"
    }
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          Loading dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Consultations</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorStats?.today_consultations}</div>
            <p className="text-xs text-muted-foreground">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Queue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorStats?.current_queue_size}</div>
            <p className="text-xs text-muted-foreground">
              patients waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Consultation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorStats?.avg_consultation_time}m</div>
            <p className="text-xs text-muted-foreground">
              -2m from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorStats?.patient_satisfaction}</div>
            <p className="text-xs text-muted-foreground">
              out of 5.0 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue">Patient Queue</TabsTrigger>
          <TabsTrigger value="checkin">Check-in Status</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
        </TabsList>

        {/* Patient Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Queue
              </CardTitle>
              <CardDescription>
                Patients waiting for consultation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentQueue.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients in queue</h3>
                  <p className="text-gray-500">New patients will appear here when they join your queue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentQueue.map((patient, index) => (
                    <Card key={patient.queue_id} className={patient.status === "in_consultation" ? "border-blue-200 bg-blue-50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                              {patient.queue_number}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{patient.patient_name}</h4>
                                <Badge variant={getPriorityColor(patient.priority, patient.is_emergency)}>
                                  {patient.is_emergency ? "EMERGENCY" : patient.priority.toUpperCase()}
                                </Badge>
                                {patient.queue_type === "cross_hospital" && (
                                  <Badge variant="outline">Cross-Hospital</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">UHID: {patient.patient_uhid}</p>
                              <p className="text-sm text-gray-600 mt-1">{patient.symptoms_description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span>Joined: {formatTime(patient.joined_at)}</span>
                                {patient.estimated_wait_time > 0 && (
                                  <span>Wait: {patient.estimated_wait_time}m</span>
                                )}
                                <span>{patient.hospital_name || patient.assigned_hospital_name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {patient.status === "waiting" ? (
                              <Button onClick={() => startConsultation(patient.queue_id)}>
                                Start Consultation
                              </Button>
                            ) : patient.status === "in_consultation" ? (
                              <Button 
                                variant="destructive" 
                                onClick={() => completeConsultation(patient.queue_id)}
                              >
                                Complete
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check-in Status Tab */}
        <TabsContent value="checkin" className="space-y-4">
          <DoctorCheckInComponent />
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                Your schedule across all hospitals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {doctorStats?.upcoming_schedule.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg mb-3 last:mb-0">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{schedule.hospital_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.start_time} - {schedule.end_time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{schedule.patient_count} patients</div>
                    <div className="text-sm text-muted-foreground">scheduled</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Leaves
              </CardTitle>
              <CardDescription>
                Your requested and approved leaves
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingLeaves.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming leaves</h3>
                  <p className="text-gray-500">Your leave requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingLeaves.map((leave) => (
                    <div key={leave.leave_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium capitalize">{leave.leave_type} Leave</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                            {leave.hospital_name && ` • ${leave.hospital_name}`}
                          </div>
                        </div>
                      </div>
                      <Badge variant={leave.is_approved ? "default" : "secondary"}>
                        {leave.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}