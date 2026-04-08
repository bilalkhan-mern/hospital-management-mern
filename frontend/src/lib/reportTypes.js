export const reportTypeOptions = [
  { value: 'lab', label: 'Lab Report' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'mri', label: 'MRI' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'other', label: 'Other' },
];

export const getReportTypeLabel = (value) =>
  reportTypeOptions.find((option) => option.value === value)?.label || 'Other';
