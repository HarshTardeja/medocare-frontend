"use client"

import { useState } from "react"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SymptomsAnalysis } from "@/components/symptoms-analysis"
import { DoctorSelection } from "@/components/doctor-selection"
import { QueueStatusComponent } from "@/components/queue-status"
import { queueApi } from "@/lib/api-client"
import { SymptomsAnalysisResponse, JoinQueueResponse, QueuePriority, QueueType } from "@/types/api"

type Step = "symptoms" | "doctors" | "queue" | "status"

export default function BookConsultationPage() {
  const [currentStep, setCurrentStep] = useState<Step>("symptoms")
  const [aiAnalysis, setAiAnalysis] = useState<SymptomsAnalysisResponse | null>(null)
  const [queueResult, setQueueResult] = useState<JoinQueueResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSymptomsAnalyzed = (analysis: SymptomsAnalysisResponse) => {
    setAiAnalysis(analysis)
    setCurrentStep("doctors")
  }

  const handleDoctorsSelected = async (doctorIds: number[], hospitalId?: number, queueType?: QueueType) => {
    if (!aiAnalysis) return

    setLoading(true)
    setError(null)

    try {
      // Determine priority based on AI urgency level
      let priority: QueuePriority = "normal"
      if (aiAnalysis.urgency_level === "emergency") {
        priority = "emergency"
      } else if (aiAnalysis.urgency_level === "high") {
        priority = "high"
      } else if (aiAnalysis.urgency_level === "low") {
        priority = "low"
      }

      // Try to get patient location from session storage first
      let patientLocation: { latitude: number; longitude: number } | undefined = undefined
      
      try {
        // Check session storage first
        const storedLocation = sessionStorage.getItem('userLocation')
        if (storedLocation) {
          patientLocation = JSON.parse(storedLocation)
        } else if (navigator.geolocation) {
          // Fallback to requesting location if not stored
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true
            })
          })
          
          patientLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        }
      } catch (geoError) {
        console.warn("Could not get patient location:", geoError)
        // Continue without location if geolocation fails
      }

      const result = await queueApi.joinQueue({
        doctor_ids: doctorIds,
        hospital_id: hospitalId,
        symptoms_description: aiAnalysis.summary || aiAnalysis.recommended_specializations[0]?.reason || "General consultation",
        ai_recommendation: aiAnalysis,
        priority,
        queue_type: queueType,
        patient_location: patientLocation
      })

      setQueueResult(result)

      if (result.success && result.queue_id) {
        setCurrentStep("status")
      } else {
        setCurrentStep("queue")
      }
    } catch (err: any) {
      setError(err.message || "Failed to join queue")
      setCurrentStep("queue")
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    switch (currentStep) {
      case "doctors":
        setCurrentStep("symptoms")
        break
      case "queue":
      case "status":
        setCurrentStep("doctors")
        break
    }
  }

  const handleStartOver = () => {
    setCurrentStep("symptoms")
    setAiAnalysis(null)
    setQueueResult(null)
    setError(null)
  }

  const handleQueueCancelled = () => {
    setCurrentStep("doctors")
    setQueueResult(null)
  }

  const getStepNumber = (step: Step) => {
    switch (step) {
      case "symptoms": return 1
      case "doctors": return 2
      case "queue": return 3
      case "status": return 3
      default: return 1
    }
  }

  const getStepTitle = (step: Step) => {
    switch (step) {
      case "symptoms": return "Describe Symptoms"
      case "doctors": return "Select Doctors"
      case "queue": return "Queue Status"
      case "status": return "Queue Status"
      default: return ""
    }
  }
  
  const getUrgencyStyles = () => {
    if (!aiAnalysis) return {}
    
    const urgency = aiAnalysis.urgency_level.toLowerCase()
    if (urgency === "emergency" || urgency === "high") {
      return {
        borderColor: "rgb(239 68 68)", // red-500
        backgroundColor: "rgb(254 242 242)", // red-50
        accentColor: "rgb(239 68 68)"
      }
    } else if (urgency === "medium") {
      return {
        borderColor: "rgb(251 146 60)", // orange-400
        backgroundColor: "rgb(255 247 237)", // orange-50
        accentColor: "rgb(251 146 60)"
      }
    } else {
      return {
        borderColor: "rgb(34 197 94)", // green-500
        backgroundColor: "rgb(240 253 244)", // green-50
        accentColor: "rgb(34 197 94)"
      }
    }
  }
  
  const getUrgencyBadge = () => {
    if (!aiAnalysis) return null
    
    const urgency = aiAnalysis.urgency_level.toLowerCase()
    const variant = urgency === "emergency" || urgency === "high" ? "destructive" : 
                   urgency === "medium" ? "secondary" : "outline"
                   
    return (
      <Badge variant={variant} className="text-lg px-4 py-1 font-semibold">
        {urgency.toUpperCase()} PRIORITY
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Urgency Banner */}
      {aiAnalysis && currentStep !== "symptoms" && (
        <div 
          className="mb-6 p-4 rounded-lg flex items-center justify-between"
          style={{
            backgroundColor: getUrgencyStyles().backgroundColor,
            borderLeft: `4px solid ${getUrgencyStyles().borderColor}`
          }}
        >
          <div className="flex items-center gap-4">
            {getUrgencyBadge()}
            <div className="text-sm">
              <p className="font-medium">{aiAnalysis.summary}</p>
              {aiAnalysis.urgency_level.toLowerCase() === "emergency" && (
                <p className="text-red-600 font-semibold mt-1">
                  ⚡ Fast-tracking to quickest available care
                </p>
              )}
              {aiAnalysis.urgency_level.toLowerCase() === "low" && (
                <p className="text-green-600 mt-1">
                  🏠 Finding nearest convenient location
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {currentStep !== "symptoms" && (
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Book Consultation</h1>
            <p className="text-muted-foreground">
              AI-powered doctor recommendations and smart queue management
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={currentStep === "symptoms" ? "default" : "secondary"}>
              1
            </Badge>
            <span className={`text-sm ${currentStep === "symptoms" ? "font-medium" : "text-muted-foreground"}`}>
              Symptoms
            </span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentStep === "doctors" ? "default" : 
                       getStepNumber(currentStep) > 2 ? "secondary" : "outline"}
            >
              2
            </Badge>
            <span className={`text-sm ${
              currentStep === "doctors" ? "font-medium" : 
              getStepNumber(currentStep) > 2 ? "text-muted-foreground" : "text-muted-foreground"
            }`}>
              Select Doctors
            </span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2">
            <Badge 
              variant={["queue", "status"].includes(currentStep) ? "default" : "outline"}
            >
              3
            </Badge>
            <span className={`text-sm ${
              ["queue", "status"].includes(currentStep) ? "font-medium" : "text-muted-foreground"
            }`}>
              Queue Status
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Symptoms Analysis */}
        {currentStep === "symptoms" && (
          <SymptomsAnalysis onAnalysisComplete={handleSymptomsAnalyzed} />
        )}

        {/* Step 2: Doctor Selection */}
        {currentStep === "doctors" && aiAnalysis && (
          <DoctorSelection
            aiAnalysis={aiAnalysis}
            onDoctorsSelected={handleDoctorsSelected}
          />
        )}

        {/* Step 3: Queue Results */}
        {currentStep === "queue" && queueResult && (
          <div className="space-y-6">
            {queueResult.success && queueResult.queue_id ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Successfully Joined Queue!
                  </CardTitle>
                  <CardDescription>
                    You've been assigned to the best available doctor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Assigned Doctor</h4>
                      <p className="text-sm text-muted-foreground">
                        {queueResult.doctor_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {queueResult.doctor_specialization}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Queue Position</h4>
                      <p className="text-lg font-semibold text-blue-600">
                        #{queueResult.current_position}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ~{queueResult.estimated_wait_time} min wait
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-center">
                    <Button onClick={() => setCurrentStep("status")}>
                      View Live Queue Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Unable to Join Queue</CardTitle>
                  <CardDescription>
                    {queueResult.error || "No doctors available at the moment"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {queueResult.suggested_doctors && queueResult.suggested_doctors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Alternative Suggestions:</h4>
                      <div className="space-y-2">
                        {queueResult.suggested_doctors.map((doctor, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{doctor.doctor_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {doctor.specialization}
                                </p>
                              </div>
                              <div className="text-right text-sm">
                                <p>{doctor.queue_size} in queue</p>
                                <p className="text-muted-foreground">
                                  ~{doctor.estimated_wait_time}min
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={handleGoBack}>
                      Try Different Doctors
                    </Button>
                    <Button variant="outline" onClick={handleStartOver}>
                      Start Over
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: Live Queue Status */}
        {currentStep === "status" && queueResult?.queue_id && (
          <div className="space-y-6">
            <QueueStatusComponent
              queueId={queueResult.queue_id}
              onCancel={handleQueueCancelled}
            />
            
            <div className="text-center">
              <Button variant="outline" onClick={handleStartOver}>
                Book Another Consultation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-[300px]">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Joining queue...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}