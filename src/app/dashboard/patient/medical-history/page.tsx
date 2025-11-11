'use client';

import { useState } from 'react';
import { usePatientDocuments, useUploadMedicalDocument, useDeleteMedicalDocument } from '@/hooks/use-api';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileImage, 
  FileText, 
  X, 
  Calendar,
  User,
  Building2,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const documentTypes = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'mri_scan', label: 'MRI Scan' },
  { value: 'ct_scan', label: 'CT Scan' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'medical_certificate', label: 'Medical Certificate' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'vaccination_record', label: 'Vaccination Record' },
  { value: 'allergy_report', label: 'Allergy Report' },
  { value: 'surgical_report', label: 'Surgical Report' },
  { value: 'other', label: 'Other' }
];

interface MedicalDocument {
  id: number;
  file_name: string;
  document_type: string;
  description?: string;
  document_date?: string;
  doctor_name?: string;
  hospital_name?: string;
  status: string;
  file_size: number;
  created_at: string;
}

export default function MedicalHistoryPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadData, setUploadData] = useState({
    document_type: '',
    description: '',
    document_date: '',
    doctor_name: '',
    hospital_name: ''
  });
  // Using sonner toast directly
  
  // API hooks
  const { data: documents = [], isLoading: isLoadingDocuments } = usePatientDocuments();
  const uploadMutation = useUploadMedicalDocument();
  const deleteMutation = useDeleteMedicalDocument();

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard/patient' },
    { title: 'Medical History' }
  ];


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type. Please use JPEG, PNG, or PDF.`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name} is larger than 10MB. Please choose a smaller file.`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find(dt => dt.value === type)?.label || type;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'default';
      case 'UPLOADED': return 'secondary';
      case 'PROCESSING': return 'outline';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    if (!uploadData.document_type) {
      toast.error("Please select a document type.");
      return;
    }

    try {
      // Upload each file separately
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', uploadData.document_type);
        if (uploadData.description) formData.append('description', uploadData.description);
        if (uploadData.document_date) formData.append('document_date', uploadData.document_date);
        if (uploadData.doctor_name) formData.append('doctor_name', uploadData.doctor_name);
        if (uploadData.hospital_name) formData.append('hospital_name', uploadData.hospital_name);
        
        await uploadMutation.mutateAsync(formData);
      }
      
      // Reset form
      setSelectedFiles([]);
      setUploadData({
        document_type: '',
        description: '',
        document_date: '',
        doctor_name: '',
        hospital_name: ''
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const deleteDocument = async (documentId: number) => {
    try {
      await deleteMutation.mutateAsync(documentId);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={['patient']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Medical History</h1>
          <p className="text-muted-foreground">
            Upload and manage your medical documents, lab reports, and other health records
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Medical Documents
            </CardTitle>
            <CardDescription>
              Upload your medical documents, lab reports, X-rays, and other health records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select Files</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
                />
                <div className="text-sm text-muted-foreground">
                  Supports: JPEG, PNG, PDF (max 10MB each)
                </div>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <FileImage className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="document-type">Document Type *</Label>
                <Select
                  value={uploadData.document_type}
                  onValueChange={(value) => setUploadData(prev => ({ ...prev, document_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-date">Document Date</Label>
                <Input
                  id="document-date"
                  type="date"
                  value={uploadData.document_date}
                  onChange={(e) => setUploadData(prev => ({ ...prev, document_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-name">Doctor Name</Label>
                <Input
                  id="doctor-name"
                  placeholder="e.g., Dr. John Smith"
                  value={uploadData.doctor_name}
                  onChange={(e) => setUploadData(prev => ({ ...prev, doctor_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital-name">Hospital/Clinic Name</Label>
                <Input
                  id="hospital-name"
                  placeholder="e.g., City Medical Center"
                  value={uploadData.hospital_name}
                  onChange={(e) => setUploadData(prev => ({ ...prev, hospital_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any additional notes about these documents..."
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || selectedFiles.length === 0}
              className="w-full md:w-auto"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              View and manage your uploaded medical documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDocuments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          {document.file_name.endsWith('.pdf') ? (
                            <FileText className="h-6 w-6 text-red-500" />
                          ) : (
                            <FileImage className="h-6 w-6 text-blue-500" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{document.file_name}</h3>
                            <Badge variant={getStatusBadgeVariant(document.status)}>
                              {document.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getDocumentTypeLabel(document.document_type)}
                          </p>
                          {document.description && (
                            <p className="text-sm text-muted-foreground">{document.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {document.document_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(document.document_date).toLocaleDateString()}
                              </div>
                            )}
                            {document.doctor_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {document.doctor_name}
                              </div>
                            )}
                            {document.hospital_name && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {document.hospital_name}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Uploaded on {new Date(document.created_at).toLocaleDateString()} • {formatFileSize(document.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Document</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{document.file_name}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-2">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button 
                                variant="destructive"
                                onClick={() => deleteDocument(document.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
                <p className="text-muted-foreground mb-4">
                  Start by uploading your medical documents using the form above
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-5 w-5" />
              Tips for Uploading Medical Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li>• Ensure documents are clear and readable before uploading</li>
              <li>• Include document dates and doctor information when available</li>
              <li>• Organize documents by type for easier management</li>
              <li>• Keep original documents safe even after uploading</li>
              <li>• Only upload documents that belong to you</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}