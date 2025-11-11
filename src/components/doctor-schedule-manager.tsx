"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Plus, Edit, Trash2, MapPin, AlertCircle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface Hospital {
  hospital_id: number
  hospital_name: string
}

interface Schedule {
  schedule_id: number
  hospital_id: number
  hospital_name: string
  day_of_week: number
  day_name: string
  start_time: string
  end_time: string
  break_start_time?: string
  break_end_time?: string
  slot_duration: number
  max_patients_per_slot: number
  is_available: boolean
  effective_from?: string
  effective_until?: string
  notes?: string
}

interface Leave {
  leave_id: number
  hospital_id?: number
  hospital_name?: string
  leave_type: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  reason?: string
  is_approved: boolean
  approved_by?: number
  created_at: string
}

export function DoctorScheduleManager() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    hospital_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    break_start_time: "",
    break_end_time: "",
    slot_duration: "15",
    max_patients_per_slot: "1",
    effective_from: "",
    effective_until: "",
    notes: ""
  })

  // Leave form state
  const [leaveForm, setLeaveForm] = useState({
    hospital_id: "",
    leave_type: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    reason: ""
  })

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const leaveTypes = ["vacation", "sick", "conference", "emergency"]

  // Mock data loading
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Mock hospitals
      const hospitalsData: Hospital[] = [
        { hospital_id: 1, hospital_name: "Central Hospital" },
        { hospital_id: 2, hospital_name: "City Hospital" },
        { hospital_id: 3, hospital_name: "Metro Medical Center" }
      ]

      // Mock schedules
      const schedulesData: Schedule[] = [
        {
          schedule_id: 1,
          hospital_id: 1,
          hospital_name: "Central Hospital",
          day_of_week: 1,
          day_name: "Tuesday",
          start_time: "09:00",
          end_time: "17:00",
          break_start_time: "13:00",
          break_end_time: "14:00",
          slot_duration: 15,
          max_patients_per_slot: 1,
          is_available: true
        },
        {
          schedule_id: 2,
          hospital_id: 2,
          hospital_name: "City Hospital",
          day_of_week: 3,
          day_name: "Thursday",
          start_time: "10:00",
          end_time: "18:00",
          slot_duration: 20,
          max_patients_per_slot: 1,
          is_available: true
        }
      ]

      // Mock leaves
      const leavesData: Leave[] = [
        {
          leave_id: 1,
          leave_type: "vacation",
          start_date: "2024-01-20",
          end_date: "2024-01-22",
          reason: "Personal vacation",
          is_approved: true,
          created_at: "2024-01-10T10:00:00Z"
        },
        {
          leave_id: 2,
          leave_type: "conference",
          start_date: "2024-02-15",
          end_date: "2024-02-15",
          hospital_id: 1,
          hospital_name: "Central Hospital",
          reason: "Medical conference attendance",
          is_approved: false,
          created_at: "2024-01-15T14:30:00Z"
        }
      ]

      setHospitals(hospitalsData)
      setSchedules(schedulesData)
      setLeaves(leavesData)
    } catch (error) {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setShowScheduleDialog(false)
      setEditingSchedule(null)
      resetScheduleForm()
      loadData()
    } catch (error) {
      setError("Failed to save schedule")
    }
  }

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setShowLeaveDialog(false)
      setEditingLeave(null)
      resetLeaveForm()
      loadData()
    } catch (error) {
      setError("Failed to save leave request")
    }
  }

  const deleteSchedule = async (scheduleId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setSchedules(prev => prev.filter(s => s.schedule_id !== scheduleId))
    } catch (error) {
      setError("Failed to delete schedule")
    }
  }

  const deleteLeave = async (leaveId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setLeaves(prev => prev.filter(l => l.leave_id !== leaveId))
    } catch (error) {
      setError("Failed to delete leave request")
    }
  }

  const resetScheduleForm = () => {
    setScheduleForm({
      hospital_id: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      break_start_time: "",
      break_end_time: "",
      slot_duration: "15",
      max_patients_per_slot: "1",
      effective_from: "",
      effective_until: "",
      notes: ""
    })
  }

  const resetLeaveForm = () => {
    setLeaveForm({
      hospital_id: "",
      leave_type: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      reason: ""
    })
  }

  const editSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setScheduleForm({
      hospital_id: schedule.hospital_id.toString(),
      day_of_week: schedule.day_of_week.toString(),
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      break_start_time: schedule.break_start_time || "",
      break_end_time: schedule.break_end_time || "",
      slot_duration: schedule.slot_duration.toString(),
      max_patients_per_slot: schedule.max_patients_per_slot.toString(),
      effective_from: schedule.effective_from || "",
      effective_until: schedule.effective_until || "",
      notes: schedule.notes || ""
    })
    setShowScheduleDialog(true)
  }

  const editLeave = (leave: Leave) => {
    setEditingLeave(leave)
    setLeaveForm({
      hospital_id: leave.hospital_id?.toString() || "",
      leave_type: leave.leave_type,
      start_date: leave.start_date,
      end_date: leave.end_date,
      start_time: leave.start_time || "",
      end_time: leave.end_time || "",
      reason: leave.reason || ""
    })
    setShowLeaveDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          Loading schedule and leave data...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Schedule Management</TabsTrigger>
          <TabsTrigger value="leaves">Leave Management</TabsTrigger>
        </TabsList>

        {/* Schedule Management Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Schedule
                  </CardTitle>
                  <CardDescription>
                    Manage your weekly schedule across hospitals
                  </CardDescription>
                </div>
                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetScheduleForm(); setEditingSchedule(null) }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
                      </DialogTitle>
                      <DialogDescription>
                        Set your working hours for a specific day and hospital
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleScheduleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hospital">Hospital</Label>
                          <Select value={scheduleForm.hospital_id} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, hospital_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select hospital" />
                            </SelectTrigger>
                            <SelectContent>
                              {hospitals.map((hospital) => (
                                <SelectItem key={hospital.hospital_id} value={hospital.hospital_id.toString()}>
                                  {hospital.hospital_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="day">Day of Week</Label>
                          <Select value={scheduleForm.day_of_week} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, day_of_week: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              {dayNames.map((day, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_time">Start Time</Label>
                          <Input
                            type="time"
                            value={scheduleForm.start_time}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time">End Time</Label>
                          <Input
                            type="time"
                            value={scheduleForm.end_time}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="break_start">Break Start (optional)</Label>
                          <Input
                            type="time"
                            value={scheduleForm.break_start_time}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, break_start_time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="break_end">Break End (optional)</Label>
                          <Input
                            type="time"
                            value={scheduleForm.break_end_time}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, break_end_time: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="slot_duration">Slot Duration (minutes)</Label>
                          <Select value={scheduleForm.slot_duration} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, slot_duration: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="20">20 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">60 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="max_patients">Max Patients per Slot</Label>
                          <Select value={scheduleForm.max_patients_per_slot} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, max_patients_per_slot: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 patient</SelectItem>
                              <SelectItem value="2">2 patients</SelectItem>
                              <SelectItem value="3">3 patients</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                          placeholder="Any special notes about this schedule..."
                          value={scheduleForm.notes}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setShowScheduleDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingSchedule ? "Update Schedule" : "Add Schedule"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules set</h3>
                  <p className="text-gray-500">Add your first schedule to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <Card key={schedule.schedule_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{schedule.day_name}</h4>
                                <Badge variant="outline">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {schedule.hospital_name}
                                </Badge>
                                {schedule.is_available ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {schedule.start_time} - {schedule.end_time}
                                {schedule.break_start_time && schedule.break_end_time && (
                                  <span> • Break: {schedule.break_start_time} - {schedule.break_end_time}</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {schedule.slot_duration}min slots • Max {schedule.max_patients_per_slot} patient(s) per slot
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => editSchedule(schedule)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteSchedule(schedule.schedule_id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {/* Leave Management Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Leave Requests
                  </CardTitle>
                  <CardDescription>
                    Manage your leave requests and time off
                  </CardDescription>
                </div>
                <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetLeaveForm(); setEditingLeave(null) }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Leave
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingLeave ? "Edit Leave Request" : "Request Leave"}
                      </DialogTitle>
                      <DialogDescription>
                        Submit a leave request for approval
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLeaveSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="leave_type">Leave Type</Label>
                          <Select value={leaveForm.leave_type} onValueChange={(value) => setLeaveForm(prev => ({ ...prev, leave_type: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaveTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="hospital">Hospital (optional)</Label>
                          <Select value={leaveForm.hospital_id} onValueChange={(value) => setLeaveForm(prev => ({ ...prev, hospital_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="All hospitals" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All hospitals</SelectItem>
                              {hospitals.map((hospital) => (
                                <SelectItem key={hospital.hospital_id} value={hospital.hospital_id.toString()}>
                                  {hospital.hospital_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_date">Start Date</Label>
                          <Input
                            type="date"
                            value={leaveForm.start_date}
                            onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_date">End Date</Label>
                          <Input
                            type="date"
                            value={leaveForm.end_date}
                            onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_time">Start Time (optional)</Label>
                          <Input
                            type="time"
                            value={leaveForm.start_time}
                            onChange={(e) => setLeaveForm(prev => ({ ...prev, start_time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time">End Time (optional)</Label>
                          <Input
                            type="time"
                            value={leaveForm.end_time}
                            onChange={(e) => setLeaveForm(prev => ({ ...prev, end_time: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                          placeholder="Reason for leave request..."
                          value={leaveForm.reason}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setShowLeaveDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingLeave ? "Update Request" : "Submit Request"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h3>
                  <p className="text-gray-500">Your leave requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.map((leave) => (
                    <Card key={leave.leave_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium capitalize">{leave.leave_type} Leave</h4>
                                {leave.hospital_name && (
                                  <Badge variant="outline">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {leave.hospital_name}
                                  </Badge>
                                )}
                                <Badge variant={leave.is_approved ? "default" : "secondary"}>
                                  {leave.is_approved ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Approved
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pending
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                {leave.start_time && leave.end_time && (
                                  <span> • {leave.start_time} - {leave.end_time}</span>
                                )}
                              </div>
                              {leave.reason && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {leave.reason}
                                </div>
                              )}
                            </div>
                          </div>
                          {!leave.is_approved && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => editLeave(leave)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteLeave(leave.leave_id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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