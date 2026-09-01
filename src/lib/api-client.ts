import api from './api';
import { 
  LoginRequest, 
  LoginResponse, 
  UserResponse, 
  PatientCreate,
  PatientResponse,
  PatientUpdate,
  FamilyDoctorRequest,
  DoctorStatsResponse,
  AdminStatsResponse,
  NurseStatsResponse,
  PharmacyStatsResponse,
  DoctorResponse,
  MedicalRecordResponse,
  PrescriptionResponse,
  LabReportResponse,
  QRAccessRequest,
  QRAccessResponse,
  HospitalResponse,
  PharmacyResponse,
  DiagnosticCenterResponse,
  NurseResponse,
  MedicalRecordCreate,
  PrescriptionCreate,
  HospitalCreate,
  DoctorCreate,
  PharmacyCreate,
  DiagnosticCenterCreate,
  NurseCreate,
  HealthCheckResponse,
  SymptomsAnalysisRequest,
  SymptomsAnalysisResponse,
  JoinQueueRequest,
  JoinQueueResponse,
  QueueStatusResponse,
  AvailableDoctorsResponse,
  DoctorQueueResponse
} from '@/types/api';

// Authentication API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data;
  },
  
  registerPatient: async (patientData: PatientCreate): Promise<any> => {
    const { data } = await api.post('/api/auth/register/patient', patientData);
    return data;
  },
  
  getCurrentUser: async (): Promise<UserResponse> => {
    const { data } = await api.get('/api/auth/me');
    return data;
  },
};

// Health Check API
export const healthApi = {
  check: async (): Promise<HealthCheckResponse> => {
    const { data } = await api.get('/api/v1/health');
    return data;
  },
};

// User API
export const userApi = {
  getUsers: async (skip: number = 0, limit: number = 100): Promise<UserResponse[]> => {
    const { data } = await api.get('/api/v1/users', { params: { skip, limit } });
    return data;
  },
  
  getUser: async (userId: number): Promise<UserResponse> => {
    const { data } = await api.get(`/api/v1/users/${userId}`);
    return data;
  },
};

// Patient API
export const patientApi = {
  getMyProfile: async (): Promise<PatientResponse> => {
    const { data } = await api.get('/api/patients/me');
    return data;
  },
  
  getPatientByUhid: async (uhid: string): Promise<PatientResponse> => {
    const { data } = await api.get(`/api/patients/${uhid}`);
    return data;
  },

  updateMyProfile: async (body: PatientUpdate): Promise<PatientResponse> => {
    const { data } = await api.patch('/api/patients/me', body);
    return data;
  },

  setFamilyDoctor: async (body: FamilyDoctorRequest): Promise<PatientResponse> => {
    const { data } = await api.put('/api/patients/me/family-doctor', body);
    return data;
  },

  clearFamilyDoctor: async (): Promise<PatientResponse> => {
    const { data } = await api.delete('/api/patients/me/family-doctor');
    return data;
  },
  
  generateQRAccess: async (request: QRAccessRequest): Promise<QRAccessResponse> => {
    const { data } = await api.post('/api/patients/me/qr-access', request);
    return data;
  },
  
  accessPatientByQR: async (accessToken: string): Promise<PatientResponse> => {
    const { data } = await api.post(`/api/patients/qr-access/${accessToken}`);
    return data;
  },
  
  getMyMedicalRecords: async (): Promise<MedicalRecordResponse[]> => {
    const { data } = await api.get('/api/patients/me/medical-records');
    return data;
  },
  
  getMyPrescriptions: async (): Promise<PrescriptionResponse[]> => {
    const { data } = await api.get('/api/patients/me/prescriptions');
    return data;
  },
  
  getMyLabReports: async (): Promise<LabReportResponse[]> => {
    const { data } = await api.get('/api/patients/me/lab-reports');
    return data;
  },
  
  getMyDocuments: async (): Promise<any[]> => {
    const { data } = await api.get('/api/patients/me/documents');
    return data;
  },
  
  uploadMedicalDocument: async (formData: FormData): Promise<any> => {
    const { data } = await api.post('/api/patients/me/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  
  deleteMedicalDocument: async (documentId: number): Promise<void> => {
    await api.delete(`/api/patients/me/documents/${documentId}`);
  },
  
  getMyConsents: async (): Promise<any[]> => {
    const { data } = await api.get('/api/patients/me/consents');
    return data;
  },
  
  createConsent: async (consentData: any): Promise<any> => {
    const { data } = await api.post('/api/patients/me/consents', consentData);
    return data;
  },
  
  revokeConsent: async (consentId: number): Promise<void> => {
    await api.put(`/api/patients/me/consents/${consentId}/revoke`);
  },
};

// Doctor API
export const doctorApi = {
  getDoctorProfile: async (): Promise<DoctorResponse> => {
    const { data } = await api.get('/api/doctor/me');
    return data;
  },

  getPatient: async (uhid: string): Promise<PatientResponse> => {
    const { data } = await api.get(`/api/doctor/patients/${uhid}`);
    return data;
  },
  
  createMedicalRecord: async (record: MedicalRecordCreate): Promise<MedicalRecordResponse> => {
    const { data } = await api.post('/api/doctor/medical-records', record);
    return data;
  },
  
  getPatientMedicalRecords: async (patientId: number): Promise<MedicalRecordResponse[]> => {
    const { data } = await api.get(`/api/doctor/medical-records/patient/${patientId}`);
    return data;
  },
  
  createPrescription: async (prescription: PrescriptionCreate): Promise<PrescriptionResponse> => {
    const { data } = await api.post('/api/doctor/prescriptions', prescription);
    return data;
  },
  
  getPatientPrescriptions: async (patientId: number): Promise<PrescriptionResponse[]> => {
    const { data } = await api.get(`/api/doctor/prescriptions/patient/${patientId}`);
    return data;
  },
  
  getMyPatients: async (): Promise<PatientResponse[]> => {
    const { data } = await api.get('/api/doctor/my-patients');
    return data;
  },

  getStats: async (): Promise<DoctorStatsResponse> => {
    const { data } = await api.get('/api/doctor/stats');
    return data;
  },

  // Standing (consent-gated) access to a patient outside a consultation.
  getConsentedPatientSummary: async (patientId: number): Promise<PatientResponse> => {
    const { data } = await api.get(`/api/doctor/patients/id/${patientId}/summary`);
    return data;
  },
  getConsentedPatientRecords: async (patientId: number): Promise<any[]> => {
    const { data } = await api.get(`/api/doctor/patients/id/${patientId}/medical-records`);
    return data;
  },
  getConsentedPatientPrescriptions: async (patientId: number): Promise<any[]> => {
    const { data } = await api.get(`/api/doctor/patients/id/${patientId}/prescriptions`);
    return data;
  },
  getConsentedPatientLabReports: async (patientId: number): Promise<any[]> => {
    const { data } = await api.get(`/api/doctor/patients/id/${patientId}/lab-reports`);
    return data;
  },
  getConsentedPatientDocuments: async (patientId: number): Promise<any[]> => {
    const { data } = await api.get(`/api/doctor/patients/id/${patientId}/documents`);
    return data;
  },
  downloadConsentedDocument: async (
    patientId: number,
    documentId: number,
    fileName: string
  ): Promise<void> => {
    // Axios sends the bearer token and follows the 302 to the presigned URL.
    const res = await api.get(
      `/api/doctor/patients/id/${patientId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document';
    a.click();
    URL.revokeObjectURL(url);
  },

  // Check-in/Check-out functionality
  getDoctorHospitals: async (): Promise<HospitalResponse[]> => {
    const { data } = await api.get('/api/doctor/hospitals');
    return data;
  },

  checkInDoctor: async (hospitalId: number): Promise<any> => {
    const { data } = await api.post('/api/doctor/check-in', { hospital_id: hospitalId });
    return data;
  },

  checkOutDoctor: async (notes?: string, nextHospitalId?: number): Promise<any> => {
    const { data } = await api.post('/api/doctor/check-out', {
      notes,
      next_hospital_id: nextHospitalId
    });
    return data;
  },

  getDoctorStatus: async (): Promise<any> => {
    const { data } = await api.get('/api/doctor/status');
    return data;
  },

  updatePresenceStatus: async (status: 'available' | 'busy' | 'on_break'): Promise<any> => {
    const { data } = await api.put('/api/doctor/presence-status', { status });
    return data;
  },
};

// Admin API
export const adminApi = {
  // Hospitals
  getHospitals: async (): Promise<HospitalResponse[]> => {
    const { data } = await api.get('/api/admin/hospitals');
    return data;
  },
  
  createHospital: async (hospital: HospitalCreate): Promise<HospitalResponse> => {
    const { data } = await api.post('/api/admin/hospitals', hospital);
    return data;
  },
  
  // Doctors
  getDoctors: async (): Promise<DoctorResponse[]> => {
    const { data } = await api.get('/api/admin/doctors');
    return data;
  },
  
  createDoctor: async (doctor: DoctorCreate): Promise<DoctorResponse> => {
    const { data } = await api.post('/api/admin/doctors', doctor);
    return data;
  },
  
  // Nurses
  getNurses: async (): Promise<NurseResponse[]> => {
    const { data } = await api.get('/api/admin/nurses');
    return data;
  },
  
  createNurse: async (nurse: NurseCreate): Promise<NurseResponse> => {
    const { data } = await api.post('/api/admin/nurses', nurse);
    return data;
  },
  
  // Pharmacies
  getPharmacies: async (): Promise<PharmacyResponse[]> => {
    const { data } = await api.get('/api/admin/pharmacies');
    return data;
  },
  
  createPharmacy: async (pharmacy: PharmacyCreate): Promise<PharmacyResponse> => {
    const { data } = await api.post('/api/admin/pharmacies', pharmacy);
    return data;
  },
  
  // Diagnostic Centers
  getDiagnosticCenters: async (): Promise<DiagnosticCenterResponse[]> => {
    const { data } = await api.get('/api/admin/diagnostic-centers');
    return data;
  },
  
  createDiagnosticCenter: async (center: DiagnosticCenterCreate): Promise<DiagnosticCenterResponse> => {
    const { data } = await api.post('/api/admin/diagnostic-centers', center);
    return data;
  },
  
  getStats: async (): Promise<AdminStatsResponse> => {
    const { data } = await api.get('/api/admin/stats');
    return data;
  },

  // Users
  getAllUsers: async (): Promise<UserResponse[]> => {
    const { data } = await api.get('/api/admin/users');
    return data;
  },
  
  deactivateUser: async (userId: number): Promise<void> => {
    await api.put(`/api/admin/users/${userId}/deactivate`);
  },
  
  activateUser: async (userId: number): Promise<void> => {
    await api.put(`/api/admin/users/${userId}/activate`);
  },
};

// Pharmacy API
export const pharmacyApi = {
  getPrescriptionsByUhid: async (uhid: string): Promise<PrescriptionResponse[]> => {
    const { data } = await api.get(`/api/pharmacy/prescriptions/uhid/${uhid}`);
    return data;
  },
  
  getPrescriptionsByQR: async (accessToken: string): Promise<PrescriptionResponse[]> => {
    const { data } = await api.get(`/api/pharmacy/prescriptions/qr/${accessToken}`);
    return data;
  },
  
  dispensePrescription: async (prescriptionId: number): Promise<void> => {
    await api.post(`/api/pharmacy/dispense/${prescriptionId}`);
  },
  
  getDispensedMedicines: async (): Promise<any[]> => {
    const { data } = await api.get('/api/pharmacy/dispensed-medicines');
    return data;
  },
  
  getPatientInfoByQR: async (accessToken: string): Promise<any> => {
    const { data } = await api.get(`/api/pharmacy/patient-info/qr/${accessToken}`);
    return data;
  },

  getStats: async (): Promise<PharmacyStatsResponse> => {
    const { data } = await api.get('/api/pharmacy/stats');
    return data;
  },
};

// Nurse API
export const nurseApi = {
  getStats: async (): Promise<NurseStatsResponse> => {
    const { data } = await api.get('/api/nurse/stats');
    return data;
  },
};

// AI API
export const aiApi = {
  analyzeSymptoms: async (request: SymptomsAnalysisRequest): Promise<SymptomsAnalysisResponse> => {
    const { data } = await api.post('/api/ai/analyze-symptoms', request);
    return data;
  },
  
  healthCheck: async (): Promise<any> => {
    const { data } = await api.get('/api/ai/health');
    return data;
  },
};

// Queue Management API
export const queueApi = {
  joinQueue: async (request: JoinQueueRequest): Promise<JoinQueueResponse> => {
    const { data } = await api.post('/api/queue/join', request);
    return data;
  },
  
  getQueueStatus: async (queueId: number): Promise<QueueStatusResponse> => {
    const { data } = await api.get(`/api/queue/status/${queueId}`);
    return data;
  },
  
  getMyQueues: async (): Promise<any> => {
    const { data } = await api.get('/api/queue/my-queues');
    return data;
  },
  
  cancelQueue: async (queueId: number): Promise<any> => {
    const { data } = await api.delete(`/api/queue/cancel/${queueId}`);
    return data;
  },
  
  getAvailableDoctors: async (hospitalId?: number, specialization?: string, queueType: string = "hospital_specific", specializations?: string[], includeGeneral: boolean = false): Promise<AvailableDoctorsResponse> => {
    const params: any = { queue_type: queueType };
    if (hospitalId) {
      params.hospital_id = hospitalId;
    }
    if (specialization) {
      params.specialization = specialization;
    }
    if (specializations && specializations.length > 0) {
      params.specializations = specializations.join(',');
    }
    params.include_general = includeGeneral;
    const { data } = await api.get('/api/queue/available-doctors', { params });
    return data;
  },
  
  getDoctorQueue: async (doctorId: number, hospitalId?: number, queueType?: string): Promise<DoctorQueueResponse> => {
    let url = `/api/queue/doctor/${doctorId}`;
    const params = new URLSearchParams();
    
    if (hospitalId) {
      params.append('hospital_id', hospitalId.toString());
    }
    if (queueType && queueType !== 'all') {
      params.append('queue_type', queueType);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const { data } = await api.get(url);
    return data;
  },
  
  updateQueueStatus: async (queueId: number, newStatus: string, notes?: string): Promise<any> => {
    const { data } = await api.patch(`/api/queue/status/${queueId}`, {
      new_status: newStatus,
      notes
    });
    return data;
  },
  
  getHospitals: async (): Promise<HospitalResponse[]> => {
    const { data } = await api.get('/api/queue/hospitals');
    return data;
  },
};

// Diagnostics API
export const diagnosticsApi = {
  getRequests: async (statusFilter?: string): Promise<any[]> => {
    const { data } = await api.get('/api/diagnostics/requests', {
      params: statusFilter ? { status_filter: statusFilter } : undefined,
    });
    return data;
  },

  getStats: async (): Promise<any> => {
    const { data } = await api.get('/api/diagnostics/stats');
    return data;
  },

  getPatientByQR: async (accessToken: string): Promise<PatientResponse> => {
    const { data } = await api.get(`/api/diagnostics/patient/qr/${accessToken}`);
    return data;
  },

  getRequestsByQR: async (accessToken: string): Promise<any[]> => {
    const { data } = await api.get(`/api/diagnostics/requests/qr/${accessToken}`);
    return data;
  },

  updateStatus: async (reportId: number, newStatus: string): Promise<any> => {
    const { data } = await api.patch(`/api/diagnostics/requests/${reportId}/status`, {
      new_status: newStatus,
    });
    return data;
  },

  publishResults: async (
    reportId: number,
    results: {
      results?: string;
      reference_ranges?: string;
      interpretation?: string;
      technician_notes?: string;
    }
  ): Promise<any> => {
    const { data } = await api.put(`/api/diagnostics/requests/${reportId}/results`, results);
    return data;
  },
};

// Live events (SSE)
export const eventsApi = {
  // EventSource cannot send an Authorization header, so we swap the bearer
  // token for a short-lived stream token that rides in the query string.
  getStreamToken: async (): Promise<{ token: string; expires_in: number }> => {
    const { data } = await api.post('/api/events/token');
    return data;
  },
};

// Consultation API
export const consultationApi = {
  getPatientByQueue: async (queueId: number): Promise<any> => {
    const { data } = await api.get(`/api/consultation/patient/${queueId}`);
    return data;
  },
  
  getPatientConsent: async (queueId: number): Promise<any> => {
    const { data } = await api.get(`/api/consultation/${queueId}/consent`);
    return data;
  },
  
  getMedicalHistory: async (queueId: number): Promise<any> => {
    const { data } = await api.get(`/api/consultation/${queueId}/medical-history`);
    return data;
  },
  
  getPrescriptions: async (queueId: number): Promise<any> => {
    const { data } = await api.get(`/api/consultation/${queueId}/prescriptions`);
    return data;
  },
  
  getLabReports: async (queueId: number): Promise<any> => {
    const { data } = await api.get(`/api/consultation/${queueId}/lab-reports`);
    return data;
  },
  
  getMedicalDocuments: async (queueId: number): Promise<any> => {
    const { data } = await api.get(`/api/consultation/${queueId}/documents`);
    return data;
  },
  
  createPrescription: async (queueId: number, prescriptionData: any): Promise<any> => {
    const { data } = await api.post(`/api/consultation/${queueId}/prescription`, prescriptionData);
    return data;
  },
  
  searchMedicines: async (query: string, limit: number = 20): Promise<any> => {
    const { data } = await api.get('/api/consultation/medicines/search', {
      params: { query, limit }
    });
    return data;
  },
};