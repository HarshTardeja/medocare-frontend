// Generated TypeScript types from OpenAPI specification

export type AccessType = "full_access" | "prescription_only" | "reports_only" | "emergency_access";
export type Gender = "male" | "female" | "other";
export type TestStatus = "requested" | "in_progress" | "completed" | "cancelled";
export type QueueStatus = "waiting" | "in_consultation" | "completed" | "cancelled" | "no_show";
export type QueuePriority = "low" | "normal" | "high" | "emergency";
export type QueueType = "hospital_specific" | "cross_hospital";
export type DoctorAvailabilityStatus = "available" | "busy" | "break" | "offline" | "emergency";

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

// User Types
export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  role?: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  is_active?: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Patient Types
export interface PatientCreate {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  address: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
}

export interface PatientResponse {
  id: number;
  uhid: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  address: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  medical_allergies?: string;
  chronic_conditions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Doctor Types
export interface DoctorCreate {
  license_number: string;
  specialization: string;
  years_of_experience: number;
  qualification: string;
  consultation_fee?: number;
  email: string;
  full_name: string;
  password: string;
  hospital_id: number;
}

export interface DoctorResponse {
  id: number;
  license_number: string;
  specialization: string;
  years_of_experience: number;
  qualification: string;
  consultation_fee?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: UserResponse;
  hospital: HospitalResponse;
}

// Hospital Types
export interface HospitalCreate {
  name: string;
  address: string;
  phone: string;
  email: string;
  license_number: string;
}

export interface HospitalResponse {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  license_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Nurse Types
export interface NurseCreate {
  license_number: string;
  department: string;
  shift_timing: string;
  years_of_experience: number;
  email: string;
  full_name: string;
  password: string;
  hospital_id: number;
}

export interface NurseResponse {
  id: number;
  license_number: string;
  department: string;
  shift_timing: string;
  years_of_experience: number;
  hospital_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: UserResponse;
  hospital: HospitalResponse;
}

// Pharmacy Types
export interface PharmacyCreate {
  name: string;
  license_number: string;
  address: string;
  phone: string;
  email: string;
  operating_hours?: string;
  password: string;
}

export interface PharmacyResponse {
  id: number;
  name: string;
  license_number: string;
  address: string;
  phone: string;
  email: string;
  operating_hours?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: UserResponse;
}

// Diagnostic Center Types
export interface DiagnosticCenterCreate {
  name: string;
  license_number: string;
  address: string;
  phone: string;
  email: string;
  services_offered?: string;
  password: string;
}

export interface DiagnosticCenterResponse {
  id: number;
  name: string;
  license_number: string;
  address: string;
  phone: string;
  email: string;
  services_offered?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: UserResponse;
}

// Medical Record Types
export interface MedicalRecordCreate {
  patient_id: number;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  notes?: string;
  follow_up_date?: string;
}

export interface MedicalRecordResponse {
  id: number;
  patient_id: number;
  doctor_id: number;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  notes?: string;
  follow_up_date?: string;
  visit_date: string;
  created_at: string;
  updated_at: string;
  patient: PatientResponse;
  doctor: DoctorResponse;
}

// Prescription Types
export interface PrescriptionMedicineCreate {
  medicine_id: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity_prescribed: number;
}

export interface PrescriptionCreate {
  patient_id: number;
  medicines: PrescriptionMedicineCreate[];
  notes?: string;
  follow_up_date?: string;
}

export interface MedicineResponse {
  id: number;
  name: string;
  generic_name: string;
  manufacturer: string;
  strength: string;
  form: string;
  price_per_unit: number;
  is_active: boolean;
  created_at: string;
}

export interface PrescriptionMedicineResponse {
  id: number;
  medicine_id: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity_prescribed: number;
  created_at: string;
  medicine: MedicineResponse;
}

export interface PrescriptionResponse {
  id: number;
  patient_id: number;
  doctor_id: number;
  prescription_date: string;
  status: string;
  notes?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  medicines: PrescriptionMedicineResponse[];
  patient?: PatientResponse;
  doctor?: DoctorResponse;
  pharmacy?: PharmacyResponse;
}

// Lab Report Types
export interface LabReportResponse {
  id: number;
  patient_id: number;
  diagnostic_center_id: number;
  test_name: string;
  test_type: string;
  results?: string;
  reference_ranges?: string;
  interpretation?: string;
  technician_notes?: string;
  requested_date: string;
  completed_date?: string;
  status: TestStatus;
  report_file_path?: string;
  created_at: string;
  updated_at: string;
  patient: PatientResponse;
  diagnostic_center: DiagnosticCenterResponse;
}

// QR Access Types
export interface QRAccessRequest {
  access_type: AccessType;
  duration_hours?: number;
}

export interface QRAccessResponse {
  access_token: string;
  qr_code: string;
  expires_at: string;
  access_type: AccessType;
}

// Health Check Types
export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

// Error Types
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Form Types for frontend
export interface LoginFormData {
  email: string;
  password: string;
}

export interface PatientRegistrationFormData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirmPassword: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  address: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
}

// Queue Management Types
export interface SymptomsAnalysisRequest {
  symptoms_description: string;
  patient_age?: number;
  patient_gender?: string;
  medical_history?: string;
}

export interface DoctorRecommendation {
  specialization: string;
  priority: number;
  reason: string;
}

export interface SymptomsAnalysisResponse {
  recommended_specializations: DoctorRecommendation[];
  urgency_level: string;
  summary: string;
  reasoning: string;
  confidence_score: number;
  additional_questions: string[];
  red_flags?: string[];
  fallback_used?: boolean;
}

export interface JoinQueueRequest {
  doctor_ids: number[];
  hospital_id?: number;
  symptoms_description: string;
  ai_recommendation?: any;
  priority?: QueuePriority;
  queue_type?: QueueType;
  patient_location?: { latitude: number; longitude: number };
}

export interface DoctorQueueInfo {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  match_score?: number;
  queue_size: number;
  estimated_wait_time: number;
}

export interface JoinQueueResponse {
  success: boolean;
  queue_id?: number;
  doctor_id?: number;
  doctor_name?: string;
  doctor_specialization?: string;
  queue_type?: QueueType;
  queue_number?: number;
  estimated_wait_time?: number;
  current_position?: number;
  assigned_hospital_id?: number;
  assigned_hospital_name?: string;
  alternative_options?: DoctorQueueInfo[];
  error?: string;
  suggested_doctors?: DoctorQueueInfo[];
}

export interface QueueStatusResponse {
  queue_id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name: string;
  doctor_specialization: string;
  queue_type: QueueType;
  hospital_id?: number;
  hospital_name?: string;
  assigned_hospital_id?: number;
  assigned_hospital_name?: string;
  queue_number: number;
  current_position: number;
  status: QueueStatus;
  priority: QueuePriority;
  estimated_wait_time?: number;
  joined_at: string;
  consultation_started_at?: string;
  consultation_completed_at?: string;
  patient_notified_at?: string;
  is_emergency: boolean;
  ai_summary?: string;
  symptoms_description?: string;
  /** When the patient should set off, so they can wait at home until then. */
  leave_at?: string;
  travel_time_minutes?: number;
  distance_km?: number;
  /** Once locked in the entry stops floating between hospitals. */
  locked_in?: boolean;
}

export interface AvailableDoctorResponse {
  doctor_id: number;
  name: string;
  specialization: string;
  qualification: string;
  years_of_experience: number;
  consultation_fee?: number;
  current_queue_size: number;
  estimated_wait_time: number;
  availability_status: string;
  match_score?: number;
  distance?: number;
}

export interface AvailableDoctorsResponse {
  hospital_id: number;
  hospital_name: string;
  doctors: AvailableDoctorResponse[];
  total_available: number;
}

export interface PatientQueueInfo {
  queue_id: number;
  patient_uhid: string;
  patient_name: string;
  queue_number: number;
  queue_type: QueueType;
  status: QueueStatus;
  priority: QueuePriority;
  symptoms_description?: string;
  estimated_wait_time?: number;
  joined_at: string;
  is_emergency: boolean;
  hospital_name?: string;
  assigned_hospital_name?: string;
}

export interface DoctorQueueResponse {
  doctor_id: number;
  hospital_id?: number;
  queue_type?: QueueType;
  queue: PatientQueueInfo[];
  total_waiting: number;
  total_in_consultation: number;
}