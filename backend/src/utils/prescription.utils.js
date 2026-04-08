export const normalizeMedicineItem = (medicine) => {
  if (typeof medicine === 'string') {
    return {
      name: medicine,
      dosage: '',
      frequency: '',
      days: 1,
      notes: '',
    };
  }

  return {
    name: medicine?.name || '',
    dosage: medicine?.dosage || '',
    frequency: medicine?.frequency || '',
    days: medicine?.days || 1,
    notes: medicine?.notes || '',
  };
};

export const normalizePrescriptionOutput = (prescription) => ({
  ...prescription.toObject(),
  medicines: Array.isArray(prescription.medicines)
    ? prescription.medicines.map(normalizeMedicineItem)
    : [],
  reports: Array.isArray(prescription.reports)
    ? prescription.reports.map((report) => (report?.toObject ? report.toObject() : report))
    : [],
});
