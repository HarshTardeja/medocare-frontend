import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  authApi, 
  patientApi, 
  doctorApi, 
  adminApi, 
  pharmacyApi, 
  healthApi 
} from '@/lib/api-client';
import { 
  LoginRequest, 
  PatientCreate, 
  MedicalRecordCreate, 
  PrescriptionCreate,
  QRAccessRequest,
  HospitalCreate,
  DoctorCreate,
  PharmacyCreate,
  DiagnosticCenterCreate,
  NurseCreate
} from '@/types/api';

// Helper function to extract error message from API response
const getErrorMessage = (error: any, defaultMessage: string): string => {
  if (error.response?.data?.detail) {
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((err: any) => err.msg || err.message).join(', ');
    } else if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
  } else if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return defaultMessage;
};

// Health Check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
  });
};

// Authentication hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });
};

export const useRegisterPatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PatientCreate) => authApi.registerPatient(data),
    onSuccess: () => {
      toast.success('Registration successful!');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Registration failed');
      toast.error(message);
    },
  });
};

// Patient hooks
export const usePatientProfile = () => {
  return useQuery({
    queryKey: ['patientProfile'],
    queryFn: patientApi.getMyProfile,
  });
};

export const usePatientByUhid = (uhid: string) => {
  return useQuery({
    queryKey: ['patient', uhid],
    queryFn: () => patientApi.getPatientByUhid(uhid),
    enabled: !!uhid,
  });
};

export const usePatientMedicalRecords = () => {
  return useQuery({
    queryKey: ['patientMedicalRecords'],
    queryFn: patientApi.getMyMedicalRecords,
  });
};

export const usePatientPrescriptions = () => {
  return useQuery({
    queryKey: ['patientPrescriptions'],
    queryFn: patientApi.getMyPrescriptions,
  });
};

export const usePatientLabReports = () => {
  return useQuery({
    queryKey: ['patientLabReports'],
    queryFn: patientApi.getMyLabReports,
  });
};

export const useGenerateQRAccess = () => {
  return useMutation({
    mutationFn: (data: QRAccessRequest) => patientApi.generateQRAccess(data),
    onSuccess: () => {
      toast.success('QR access code generated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to generate QR access';
      toast.error(message);
    },
  });
};

export const usePatientDocuments = () => {
  return useQuery({
    queryKey: ['patientDocuments'],
    queryFn: patientApi.getMyDocuments,
  });
};

export const useUploadMedicalDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FormData) => patientApi.uploadMedicalDocument(data),
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['patientDocuments'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to upload document';
      toast.error(message);
    },
  });
};

export const useDeleteMedicalDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (documentId: number) => patientApi.deleteMedicalDocument(documentId),
    onSuccess: () => {
      toast.success('Document deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['patientDocuments'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete document';
      toast.error(message);
    },
  });
};

export const usePatientConsents = () => {
  return useQuery({
    queryKey: ['patientConsents'],
    queryFn: patientApi.getMyConsents,
  });
};

export const useCreatePatientConsent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => patientApi.createConsent(data),
    onSuccess: () => {
      toast.success('Consent created successfully!');
      queryClient.invalidateQueries({ queryKey: ['patientConsents'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create consent';
      toast.error(message);
    },
  });
};

export const useRevokePatientConsent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (consentId: number) => patientApi.revokeConsent(consentId),
    onSuccess: () => {
      toast.success('Consent revoked successfully!');
      queryClient.invalidateQueries({ queryKey: ['patientConsents'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to revoke consent';
      toast.error(message);
    },
  });
};

// Doctor hooks
export const useDoctorPatients = () => {
  return useQuery({
    queryKey: ['doctorPatients'],
    queryFn: doctorApi.getMyPatients,
  });
};

export const usePatientMedicalRecordsByDoctor = (patientId: number) => {
  return useQuery({
    queryKey: ['patientMedicalRecords', patientId],
    queryFn: () => doctorApi.getPatientMedicalRecords(patientId),
    enabled: !!patientId,
  });
};

export const usePatientPrescriptionsByDoctor = (patientId: number) => {
  return useQuery({
    queryKey: ['patientPrescriptions', patientId],
    queryFn: () => doctorApi.getPatientPrescriptions(patientId),
    enabled: !!patientId,
  });
};

export const useCreateMedicalRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MedicalRecordCreate) => doctorApi.createMedicalRecord(data),
    onSuccess: () => {
      toast.success('Medical record created successfully!');
      queryClient.invalidateQueries({ queryKey: ['patientMedicalRecords'] });
      queryClient.invalidateQueries({ queryKey: ['doctorPatients'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create medical record';
      toast.error(message);
    },
  });
};

export const useCreatePrescription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PrescriptionCreate) => doctorApi.createPrescription(data),
    onSuccess: () => {
      toast.success('Prescription created successfully!');
      queryClient.invalidateQueries({ queryKey: ['patientPrescriptions'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create prescription';
      toast.error(message);
    },
  });
};

// Admin hooks
export const useHospitals = () => {
  return useQuery({
    queryKey: ['hospitals'],
    queryFn: adminApi.getHospitals,
  });
};

export const useDoctors = () => {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: adminApi.getDoctors,
  });
};

export const useNurses = () => {
  return useQuery({
    queryKey: ['nurses'],
    queryFn: adminApi.getNurses,
  });
};

export const usePharmacies = () => {
  return useQuery({
    queryKey: ['pharmacies'],
    queryFn: adminApi.getPharmacies,
  });
};

export const useDiagnosticCenters = () => {
  return useQuery({
    queryKey: ['diagnosticCenters'],
    queryFn: adminApi.getDiagnosticCenters,
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: adminApi.getAllUsers,
  });
};

export const useCreateHospital = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: HospitalCreate) => adminApi.createHospital(data),
    onSuccess: () => {
      toast.success('Hospital created successfully!');
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create hospital';
      toast.error(message);
    },
  });
};

export const useCreateDoctor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: DoctorCreate) => adminApi.createDoctor(data),
    onSuccess: () => {
      toast.success('Doctor created successfully!');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create doctor';
      toast.error(message);
    },
  });
};

export const useCreatePharmacy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PharmacyCreate) => adminApi.createPharmacy(data),
    onSuccess: () => {
      toast.success('Pharmacy created successfully!');
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create pharmacy';
      toast.error(message);
    },
  });
};

export const useCreateDiagnosticCenter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: DiagnosticCenterCreate) => adminApi.createDiagnosticCenter(data),
    onSuccess: () => {
      toast.success('Diagnostic center created successfully!');
      queryClient.invalidateQueries({ queryKey: ['diagnosticCenters'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create diagnostic center';
      toast.error(message);
    },
  });
};

export const useCreateNurse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: NurseCreate) => adminApi.createNurse(data),
    onSuccess: () => {
      toast.success('Nurse created successfully!');
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create nurse';
      toast.error(message);
    },
  });
};

// Pharmacy hooks
export const usePrescriptionsByUhid = (uhid: string) => {
  return useQuery({
    queryKey: ['prescriptions', 'uhid', uhid],
    queryFn: () => pharmacyApi.getPrescriptionsByUhid(uhid),
    enabled: !!uhid,
  });
};

export const usePrescriptionsByQR = (accessToken: string) => {
  return useQuery({
    queryKey: ['prescriptions', 'qr', accessToken],
    queryFn: () => pharmacyApi.getPrescriptionsByQR(accessToken),
    enabled: !!accessToken,
  });
};

export const useDispensePrescription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (prescriptionId: number) => pharmacyApi.dispensePrescription(prescriptionId),
    onSuccess: () => {
      toast.success('Prescription dispensed successfully!');
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dispensedMedicines'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to dispense prescription';
      toast.error(message);
    },
  });
};

export const useDispensedMedicines = () => {
  return useQuery({
    queryKey: ['dispensedMedicines'],
    queryFn: pharmacyApi.getDispensedMedicines,
  });
};