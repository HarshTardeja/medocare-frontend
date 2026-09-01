/**
 * Canonical patient-document types. The `value` strings are the wire format the
 * backend `DocumentType` enum uses (lower snake_case) and must match exactly --
 * uploads, consent `allowed_document_types`, and every read are keyed on them.
 */

export interface DocumentTypeOption {
  value: string;
  label: string;
}

export const DOCUMENT_TYPES: DocumentTypeOption[] = [
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
  { value: 'other', label: 'Other' },
];

const LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((t) => [t.value, t.label]),
);

/** Human label for a document type value; falls back to a de-slugged version. */
export function documentTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Document';
  return (
    LABELS[value] ??
    value
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

const IMAGE_DOC_TYPES = new Set(['xray', 'mri_scan', 'ct_scan', 'ultrasound']);

/** True for imaging documents, which get an image icon rather than a file icon. */
export function isImageDocType(value: string | null | undefined): boolean {
  return !!value && IMAGE_DOC_TYPES.has(value);
}
