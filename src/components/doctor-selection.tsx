"use client"

import { useState, useEffect } from "react"
import { Check, Clock, Users, MapPin, Star, Search, Filter, Activity, CheckCircle, Loader2, AlertTriangle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { queueApi } from "@/lib/api-client"
import { AvailableDoctorResponse, SymptomsAnalysisResponse, HospitalResponse, QueueType } from "@/types/api"

interface DoctorSelectionProps {
  aiAnalysis: SymptomsAnalysisResponse
  onDoctorsSelected: (doctorIds: number[], hospitalId?: number, queueType?: QueueType) => void
  className?: string
}

interface DoctorWithMetadata extends AvailableDoctorResponse {
  relevanceScore: number
  isRecommended: boolean
  urgencyTag?: string
  hospitalInfo?: string
}

export function DoctorSelection({ aiAnalysis, onDoctorsSelected, className }: DoctorSelectionProps) {
  const [doctors, setDoctors] = useState<DoctorWithMetadata[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorWithMetadata[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAllDoctors, setShowAllDoctors] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showingFallback, setShowingFallback] = useState(false)

  // Load doctors when component mounts or AI analysis changes
  useEffect(() => {
    if (aiAnalysis && aiAnalysis.recommended_specializations.length > 0) {
      loadDoctors()
    }
  }, [aiAnalysis])

  // Filter and sort doctors
  useEffect(() => {
    let filtered = doctors

    // First, show only recommended doctors unless "show all" is enabled
    if (!showAllDoctors) {
      filtered = filtered.filter(d => d.isRecommended)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.hospitalInfo && doctor.hospitalInfo.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Sort by relevance score (urgency-aware)
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore)

    setFilteredDoctors(filtered)
  }, [doctors, searchTerm, showAllDoctors])

  const loadDoctors = async () => {
    setLoading(true)
    setError(null)
    try {
      // Extract specializations from AI recommendations
      const recommendedSpecs = aiAnalysis.recommended_specializations.map(rec => rec.specialization)
      
      // Get doctors filtered by AI recommendations
      const doctorData = await queueApi.getAvailableDoctors(
        undefined, // hospitalId
        undefined, // single specialization
        "cross_hospital",
        recommendedSpecs,
        false // don't include general medicine unless AI recommends it
      )
      
      // Process doctors with urgency-aware metadata
      const doctorsWithMetadata: DoctorWithMetadata[] = doctorData.doctors.map((doctor) => {
        // Check if doctor matches AI recommendations
        const matchingRec = aiAnalysis.recommended_specializations.find(rec =>
          rec.specialization.toLowerCase() === doctor.specialization.toLowerCase() ||
          doctor.specialization.toLowerCase().includes(rec.specialization.toLowerCase()) ||
          rec.specialization.toLowerCase().includes(doctor.specialization.toLowerCase())
        )
        
        const isRecommended = !!matchingRec
        
        // Calculate urgency-based relevance score
        let relevanceScore = 0
        let urgencyTag = ""
        
        const urgency = aiAnalysis.urgency_level.toLowerCase()
        
        if (urgency === "emergency" || urgency === "high") {
          // For urgent cases, prioritize wait time
          relevanceScore = 100 - (doctor.estimated_wait_time * 2)
          if (doctor.estimated_wait_time <= 15) {
            urgencyTag = "Fastest Available"
          }
        } else if (urgency === "medium") {
          // Balanced scoring
          const matchBonus = matchingRec ? (4 - matchingRec.priority) * 20 : 0
          const waitPenalty = doctor.estimated_wait_time
          relevanceScore = 50 + matchBonus - waitPenalty
        } else {
          // Low urgency - prioritize match quality
          const matchBonus = matchingRec ? (4 - matchingRec.priority) * 30 : 10
          relevanceScore = matchBonus - (doctor.current_queue_size * 5)
          urgencyTag = "Best Match"
        }
        
        return {
          ...doctor,
          relevanceScore,
          isRecommended,
          urgencyTag,
          hospitalInfo: "Multiple Locations Available"
        }
      })
      
      // If no doctors found with recommended specializations, retry with general medicine
      if (doctorsWithMetadata.length === 0 && !recommendedSpecs.includes("General Medicine")) {
        const fallbackData = await queueApi.getAvailableDoctors(
          undefined,
          undefined,
          "cross_hospital",
          recommendedSpecs,
          true // include general medicine as fallback
        )
        
        const fallbackDoctorsWithMetadata = fallbackData.doctors
          .filter(doctor => doctor.specialization.toLowerCase().includes("general"))
          .map(doctor => ({
            ...doctor,
            relevanceScore: 0, // Lower priority for fallback
            isRecommended: false,
            urgencyTag: "Alternative Option",
            hospitalInfo: "Multiple Locations Available"
          }))
        
        setDoctors(fallbackDoctorsWithMetadata)
        setShowingFallback(true)
      } else {
        setDoctors(doctorsWithMetadata)
        setShowingFallback(false)
      }
    } catch (err: any) {
      setError("Failed to load doctors")
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorSelect = (doctorId: number) => {
    setSelectedDoctor(doctorId)
  }

  const handleProceed = () => {
    if (selectedDoctor) {
      onDoctorsSelected([selectedDoctor], undefined, "cross_hospital")
    }
  }
  
  const handleQuickMatch = () => {
    // Select the top recommended doctor automatically
    if (filteredDoctors.length > 0) {
      const bestDoctor = filteredDoctors[0]
      onDoctorsSelected([bestDoctor.doctor_id], undefined, "cross_hospital")
    }
  }

  const getUrgencyAccentColor = () => {
    const urgency = aiAnalysis.urgency_level.toLowerCase()
    if (urgency === "emergency" || urgency === "high") return "rgb(239 68 68)"
    if (urgency === "medium") return "rgb(251 146 60)"
    return "rgb(34 197 94)"
  }
  
  const getUrgencyStyles = () => {
    const urgency = aiAnalysis.urgency_level.toLowerCase()
    if (urgency === "emergency" || urgency === "high") {
      return {
        backgroundColor: "rgb(254 242 242)", // red-50
      }
    } else if (urgency === "medium") {
      return {
        backgroundColor: "rgb(255 247 237)", // orange-50
      }
    } else {
      return {
        backgroundColor: "rgb(240 253 244)", // green-50
      }
    }
  }

  const getAvailabilityColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "break":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Select Your Doctor</CardTitle>
          <CardDescription>
            {aiAnalysis.urgency_level.toLowerCase() === "emergency" || aiAnalysis.urgency_level.toLowerCase() === "high" 
              ? "Showing doctors with fastest availability for your urgent condition"
              : aiAnalysis.urgency_level.toLowerCase() === "medium"
              ? "Showing best matched doctors with reasonable wait times"
              : "Showing recommended doctors near you for convenient care"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Match Button for Emergency */}
          {(aiAnalysis.urgency_level.toLowerCase() === "emergency" || aiAnalysis.urgency_level.toLowerCase() === "high") && (
            <Alert variant="destructive" className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Urgent Care Needed</p>
                  <p className="text-sm">Get immediate care with our fastest available doctor</p>
                </div>
              </div>
              <Button 
                onClick={handleQuickMatch}
                variant="destructive"
                className="whitespace-nowrap"
                disabled={loading || filteredDoctors.length === 0}
              >
                Quick Match Me
              </Button>
            </Alert>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors, specializations, or hospitals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* AI Recommendations */}
          <div className="p-4 rounded-lg border" style={{ borderColor: getUrgencyAccentColor(), backgroundColor: 'white' }}>
            <h4 className="font-medium mb-2 text-black">AI Recommendations:</h4>
            <div className="space-y-2">
              {aiAnalysis.recommended_specializations.slice(0, 2).map((rec, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-black">{rec.specialization}</span>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: getUrgencyAccentColor(), color: getUrgencyAccentColor() }}
                  >
                    Priority {rec.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Fallback Notice */}
          {showingFallback && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                No specialists matching AI recommendations are currently available. Showing General Medicine doctors who can provide initial consultation.
              </AlertDescription>
            </Alert>
          )}

          {/* Doctor List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {showAllDoctors ? "All Available Doctors" : "Recommended Doctors"} ({filteredDoctors.length})
              </h4>
              {!showAllDoctors && doctors.length > filteredDoctors.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllDoctors(true)}
                >
                  Show All Doctors
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Finding best doctors for you...</p>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {showAllDoctors 
                  ? "No doctors found matching your search"
                  : "No recommended doctors available. Try showing all doctors."}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredDoctors.map((doctor) => (
                  <Card 
                    key={doctor.doctor_id}
                    className={`cursor-pointer transition-all ${
                      selectedDoctor === doctor.doctor_id
                        ? "ring-2 bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    style={{
                      borderColor: selectedDoctor === doctor.doctor_id ? getUrgencyAccentColor() : undefined
                    }}
                    onClick={() => handleDoctorSelect(doctor.doctor_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Check 
                            className={`h-5 w-5 transition-opacity ${
                              selectedDoctor === doctor.doctor_id ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ color: getUrgencyAccentColor() }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-lg">{doctor.name}</h5>
                              <p className="text-sm text-muted-foreground">
                                {doctor.specialization} • {doctor.years_of_experience} years exp
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {doctor.qualification}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {doctor.hospitalInfo}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              {doctor.urgencyTag && (
                                <Badge 
                                  variant="default"
                                  className="mb-2"
                                  style={{ backgroundColor: getUrgencyAccentColor() }}
                                >
                                  {doctor.urgencyTag}
                                </Badge>
                              )}
                              <Badge 
                                variant="outline"
                                className={getAvailabilityColor(doctor.availability_status)}
                              >
                                {doctor.availability_status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{doctor.current_queue_size}</span>
                                <span className="text-muted-foreground">in queue</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">~{doctor.estimated_wait_time}min</span>
                                <span className="text-muted-foreground">wait</span>
                              </div>
                            </div>
                            {doctor.consultation_fee && (
                              <span className="font-semibold">₹{doctor.consultation_fee}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {aiAnalysis.urgency_level.toLowerCase() === "emergency" || aiAnalysis.urgency_level.toLowerCase() === "high"
                ? "Select a doctor to get immediate care"
                : "Select your preferred doctor"
              }
            </p>
            <Button
              onClick={handleProceed}
              disabled={!selectedDoctor}
              style={{ backgroundColor: selectedDoctor ? getUrgencyAccentColor() : undefined }}
            >
              Proceed to Queue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}