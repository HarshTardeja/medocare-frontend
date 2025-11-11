"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Brain, AlertTriangle, Clock, User, MapPin, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { aiApi } from "@/lib/api-client"
import { SymptomsAnalysisRequest, SymptomsAnalysisResponse } from "@/types/api"

const symptomsSchema = z.object({
  symptoms_description: z.string()
    .min(10, "Please provide at least 10 characters describing your symptoms")
    .max(2000, "Description too long, please limit to 2000 characters"),
  medical_history: z.string().optional(),
})

type SymptomsFormData = z.infer<typeof symptomsSchema>

interface SymptomsAnalysisProps {
  onAnalysisComplete: (analysis: SymptomsAnalysisResponse) => void
  className?: string
}

export function SymptomsAnalysis({ onAnalysisComplete, className }: SymptomsAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SymptomsAnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied' | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  const form = useForm<SymptomsFormData>({
    resolver: zodResolver(symptomsSchema),
    defaultValues: {
      symptoms_description: "",
      medical_history: "",
    },
  })

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission()
  }, [])

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied')
      return
    }

    setLocationPermission('pending')
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        })
      })
      
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      })
      setLocationPermission('granted')
      
      // Store in session storage for later use
      sessionStorage.setItem('userLocation', JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }))
    } catch (error) {
      setLocationPermission('denied')
      console.warn('Location permission denied or error:', error)
    }
  }

  const onSubmit = async (data: SymptomsFormData) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const request: SymptomsAnalysisRequest = {
        symptoms_description: data.symptoms_description,
        medical_history: data.medical_history || undefined,
      }

      const result = await aiApi.analyzeSymptoms(request)
      setAnalysis(result)
      onAnalysisComplete(result)
    } catch (err: any) {
      setError(err.message || "Failed to analyze symptoms. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "emergency":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "emergency":
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <Clock className="h-4 w-4" />
      case "low":
        return <User className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Symptom Analysis
          </CardTitle>
          <CardDescription>
            Describe your symptoms and get AI-powered doctor recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="symptoms_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe Your Symptoms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe your symptoms in detail. Include when they started, how severe they are, and any other relevant information..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be as specific as possible to get better recommendations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medical_history"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relevant Medical History (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any relevant medical conditions, allergies, or previous treatments..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any relevant medical conditions or allergies
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAnalyzing ? "Analyzing Symptoms..." : "Get AI Analysis"}
              </Button>
            </form>
          </Form>

          {/* Location Permission Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {locationPermission === 'granted' 
                  ? "Location enabled for better hospital matching"
                  : locationPermission === 'pending'
                  ? "Requesting location permission..."
                  : "Location disabled - manual hospital selection required"
                }
              </span>
            </div>
            {locationPermission === 'granted' && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )}
            {locationPermission === 'denied' && (
              <Button
                variant="outline"
                size="sm"
                onClick={requestLocationPermission}
                className="text-xs"
              >
                Enable Location
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysis && (
            <div className="space-y-4">
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Analysis Results</h3>
                  <Badge variant={getUrgencyColor(analysis.urgency_level)} className="flex items-center gap-1">
                    {getUrgencyIcon(analysis.urgency_level)}
                    {analysis.urgency_level.toUpperCase()} PRIORITY
                  </Badge>
                </div>

                {analysis.fallback_used && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      AI analysis is temporarily unavailable. Showing general recommendations.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h4 className="font-medium mb-2">Recommended Specialists:</h4>
                  <div className="space-y-2">
                    {analysis.recommended_specializations.map((rec, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{rec.priority}</Badge>
                              <span className="font-medium">{rec.specialization}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {rec.reason}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">AI Reasoning:</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {analysis.reasoning}
                  </p>
                </div>

                {analysis.red_flags && analysis.red_flags.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning Signs Detected:</strong>
                      <ul className="mt-1 ml-4 list-disc">
                        {analysis.red_flags.map((flag, index) => (
                          <li key={index}>{flag}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {analysis.additional_questions && analysis.additional_questions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Additional Questions for Doctor:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {analysis.additional_questions.map((question, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="h-4 w-4" />
                  <span>Confidence Score: {analysis.confidence_score}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}