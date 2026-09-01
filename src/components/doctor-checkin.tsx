"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Users, Activity, LogIn, LogOut, Settings, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { doctorApi } from "@/lib/api-client"

interface Hospital {
  hospital_id: number
  hospital_name: string
  hospital_address: string
  is_checked_in: boolean
  presence_status: string
  current_queue_size: number
  estimated_wait_time: number
  active_checkin_id?: number
  schedule_today?: {
    start_time: string
    end_time: string
    break_start_time?: string
    break_end_time?: string
    slot_duration: number
  }
  distance_from_current?: number
}

interface DoctorStatus {
  doctor_id: number
  doctor_name: string
  is_checked_in: boolean
  current_hospital?: {
    hospital_id: number
    hospital_name: string
    check_in_time: string
    duration_minutes: number
  }
  presence_status: string
  last_activity?: string
  availabilities: Array<{
    hospital_id: number
    hospital_name: string
    is_checked_in: boolean
    presence_status: string
    current_queue_size: number
    estimated_wait_time: number
  }>
}

export function DoctorCheckInComponent() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [doctorStatus, setDoctorStatus] = useState<DoctorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [showCheckInDialog, setShowCheckInDialog] = useState(false)
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null)
  const [checkInNotes, setCheckInNotes] = useState("")
  const [checkOutNotes, setCheckOutNotes] = useState("")
  const [nextHospital, setNextHospital] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // API functions using real backend calls
  const fetchHospitals = async (): Promise<Hospital[]> => {
    const data = await doctorApi.getDoctorHospitals()
    return data.map((h) => ({
      hospital_id: h.id,
      hospital_name: h.name,
      hospital_address: h.address,
      is_checked_in: false,
      presence_status: "offline",
      current_queue_size: 0,
      estimated_wait_time: 0,
    }))
  }

  const fetchDoctorStatus = async (): Promise<DoctorStatus> => {
    const data = await doctorApi.getDoctorStatus()
    return data
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [hospitalsData, statusData] = await Promise.all([
        fetchHospitals(),
        fetchDoctorStatus()
      ])
      setHospitals(hospitalsData)
      setDoctorStatus(statusData)
    } catch (err) {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCheckIn = async () => {
    if (!selectedHospital) return
    
    setCheckInLoading(true)
    try {
      await doctorApi.checkInDoctor(selectedHospital)
      
      setShowCheckInDialog(false)
      setSelectedHospital(null)
      setCheckInNotes("")
      
      // Reload data
      await loadData()
    } catch (err) {
      setError("Failed to check in")
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setCheckInLoading(true)
    try {
      await doctorApi.checkOutDoctor(checkOutNotes || undefined, nextHospital || undefined)
      
      setShowCheckOutDialog(false)
      setCheckOutNotes("")
      setNextHospital(null)
      
      // Reload data
      await loadData()
    } catch (err) {
      setError("Failed to check out")
    } finally {
      setCheckInLoading(false)
    }
  }

  const updatePresenceStatus = async (status: 'available' | 'busy' | 'on_break') => {
    try {
      await doctorApi.updatePresenceStatus(status)
      await loadData()
    } catch (err) {
      setError("Failed to update status")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "present": return "default"
      case "busy": return "destructive"
      case "on_break": return "secondary"
      case "offline": return "outline"
      default: return "outline"
    }
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Current Status
          </CardTitle>
          <CardDescription>
            Your current check-in and presence status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctorStatus?.is_checked_in ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{doctorStatus.current_hospital?.hospital_name}</span>
                    <Badge variant={getStatusBadgeVariant(doctorStatus.presence_status)}>
                      {doctorStatus.presence_status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Checked in at {formatTime(doctorStatus.current_hospital?.check_in_time || "")} • 
                    Duration: {formatDuration(doctorStatus.current_hospital?.duration_minutes || 0)}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowCheckOutDialog(true)}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Check Out
                </Button>
              </div>

              {/* Quick Status Controls */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={doctorStatus.presence_status === "available" ? "default" : "outline"}
                  onClick={() => updatePresenceStatus("available")}
                >
                  Available
                </Button>
                <Button 
                  size="sm" 
                  variant={doctorStatus.presence_status === "busy" ? "destructive" : "outline"}
                  onClick={() => updatePresenceStatus("busy")}
                >
                  Busy
                </Button>
                <Button 
                  size="sm" 
                  variant={doctorStatus.presence_status === "on_break" ? "secondary" : "outline"}
                  onClick={() => updatePresenceStatus("on_break")}
                >
                  On Break
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-medium mb-2">Not Checked In</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please check in to a hospital to start seeing patients
              </p>
              <Button onClick={() => setShowCheckInDialog(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                Check In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hospitals Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {hospitals.map((hospital) => (
          <Card key={hospital.hospital_id} className={hospital.is_checked_in ? "border-green-200 bg-green-50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{hospital.hospital_name}</span>
                {hospital.is_checked_in && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Checked In
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{hospital.hospital_address}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={getStatusBadgeVariant(hospital.presence_status)}>
                    {hospital.presence_status}
                  </Badge>
                </div>

                {/* Queue Info */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Queue:</span>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    {hospital.current_queue_size} patients
                  </div>
                </div>

                {/* Wait Time */}
                {hospital.estimated_wait_time > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Est. Wait:</span>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {formatDuration(hospital.estimated_wait_time)}
                    </div>
                  </div>
                )}

                {/* Today's Schedule */}
                {hospital.schedule_today && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Today:</span>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {hospital.schedule_today.start_time} - {hospital.schedule_today.end_time}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                {!hospital.is_checked_in && !doctorStatus?.is_checked_in && (
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedHospital(hospital.hospital_id)
                      setShowCheckInDialog(true)
                    }}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Check In Here
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Check In Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In to Hospital</DialogTitle>
            <DialogDescription>
              Confirm your check-in to start seeing patients at this location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedHospital && (
              <div className="p-3 border rounded-lg">
                <div className="font-medium">
                  {hospitals.find(h => h.hospital_id === selectedHospital)?.hospital_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {hospitals.find(h => h.hospital_id === selectedHospital)?.hospital_address}
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Any notes about your check-in..."
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCheckInDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCheckIn} disabled={checkInLoading}>
                {checkInLoading ? "Checking In..." : "Check In"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check Out Dialog */}
      <Dialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out</DialogTitle>
            <DialogDescription>
              Complete your check-out process and optionally select your next location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Next Hospital (optional)</label>
              <Select value={nextHospital?.toString()} onValueChange={(value) => setNextHospital(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select next hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals
                    .filter(h => h.hospital_id !== doctorStatus?.current_hospital?.hospital_id)
                    .map((hospital) => (
                      <SelectItem key={hospital.hospital_id} value={hospital.hospital_id.toString()}>
                        {hospital.hospital_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Check-out Notes (optional)</label>
              <Textarea
                placeholder="Any notes about your check-out..."
                value={checkOutNotes}
                onChange={(e) => setCheckOutNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCheckOutDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleCheckOut} disabled={checkInLoading}>
                {checkInLoading ? "Checking Out..." : "Check Out"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}