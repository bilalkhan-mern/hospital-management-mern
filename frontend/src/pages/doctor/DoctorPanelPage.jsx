import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import StatCard from '../../components/common/StatCard';
import ChartCard from '../../components/charts/ChartCard';
import { AppointmentsBarChart } from '../../components/charts/DashboardCharts';
import ReportCard from '../../components/reports/ReportCard';
import ReportAttachmentList from '../../components/reports/ReportAttachmentList';
import ReportPreviewModal from '../../components/reports/ReportPreviewModal';
import api from '../../api/axios';
import { formatDate } from '../../lib/format';
import { printReportSummaryDocument } from '../../lib/printDocuments';
import { printPrescriptionDocument } from '../../lib/printPrescription';
import { defaultSchedule, weekDayOptions } from '../../lib/schedule';
import { reportTypeOptions } from '../../lib/reportTypes';

const simpleMode = true;

const statusBadgeMap = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const DoctorPanelPage = () => {
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm();
  const {
    register: registerPrescription,
    handleSubmit: handleSubmitPrescription,
    reset: resetPrescription,
    watch: watchPrescription,
    formState: { errors: prescriptionErrors },
    control: prescriptionControl,
  } = useForm({
    defaultValues: {
      appointmentId: '',
      diagnosis: '',
      advice: '',
      medicines: [{ name: '', dosage: '', frequency: '', days: 1, notes: '' }],
    },
  });
  const { fields: medicineFields, append: appendMedicine, remove: removeMedicine } = useFieldArray({
    control: prescriptionControl,
    name: 'medicines',
  });

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [prescriptionError, setPrescriptionError] = useState('');
  const [appointmentActionError, setAppointmentActionError] = useState('');
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [selectedReportAppointmentId, setSelectedReportAppointmentId] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [reportForm, setReportForm] = useState({
    appointmentId: '',
    title: '',
    description: '',
    type: 'lab',
    reportDate: new Date().toISOString().slice(0, 10),
    file: null,
  });
  const [uploadingReport, setUploadingReport] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [prescriptionReports, setPrescriptionReports] = useState([]);
  const [prescriptionReportsLoading, setPrescriptionReportsLoading] = useState(false);
  const [selectedPrescriptionReportIds, setSelectedPrescriptionReportIds] = useState([]);
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null, role: 'doctor' });
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments');
  const [doctorChartStats, setDoctorChartStats] = useState({ appointmentsPerDay: [] });
  const [appointmentSearch, setAppointmentSearch] = useState('');

  const loadDoctorPanel = async () => {
    try {
      setPanelError('');
      setChartLoading(true);
      const [profileResponse, appointmentsResponse, departmentsResponse] = await Promise.all([
        api.get('/doctors/profile'),
        api.get('/doctors/appointments'),
        api.get('/departments'),
      ]);

      const profile = profileResponse.data.data;
      setDoctorProfile(profile);
      setDoctorId(profile._id || '');
      const doctorAppointments = Array.isArray(appointmentsResponse.data.data) ? appointmentsResponse.data.data : [];
      setAppointments(doctorAppointments);
      setDepartments(departmentsResponse.data.data);
      if (simpleMode) {
        setDoctorChartStats({ appointmentsPerDay: [] });
      } else {
        const statsResponse = await api.get(`/stats/doctor/${profile._id}`);
        setDoctorChartStats(statsResponse.data.data || { appointmentsPerDay: [] });
      }

      resetProfile({
        name: profile.user?.name || '',
        phone: profile.user?.phone || '',
        specialization: profile.specialization || '',
        qualification: profile.qualification || '',
        experience: profile.experience || 0,
        consultationFee: profile.consultationFee || 0,
        bio: profile.bio || '',
        schedule: {
          workingDays: profile.schedule?.workingDays || defaultSchedule.workingDays,
          startTime: profile.schedule?.startTime || defaultSchedule.startTime,
          endTime: profile.schedule?.endTime || defaultSchedule.endTime,
          slotDuration: profile.schedule?.slotDuration || defaultSchedule.slotDuration,
        },
        department: profile.department?._id || '',
      });
    } catch (error) {
      setPanelError(error.response?.data?.message || 'Unable to load doctor panel data.');
      setAppointments([]);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorPanel();
  }, []);

  useEffect(() => {
    if (!appointments.length) {
      setSelectedReportAppointmentId('');
      setReports([]);
      return;
    }

    if (!selectedReportAppointmentId) {
      const firstEligibleAppointment =
        appointments.find((item) => item.status === 'completed' && !item.hasDoctorReport) ||
        appointments.find((item) => item.status === 'completed') ||
        appointments[0];
      setSelectedReportAppointmentId(firstEligibleAppointment?._id || '');
      setReportForm((current) => ({ ...current, appointmentId: firstEligibleAppointment?._id || '' }));
    }
  }, [appointments, selectedReportAppointmentId]);

  useEffect(() => {
    if (activeTab === 'reports' && selectedReportAppointmentId) {
      loadAppointmentReports(selectedReportAppointmentId);
    }
  }, [activeTab, selectedReportAppointmentId]);

  const selectedPrescriptionAppointmentId = watchPrescription('appointmentId');

  useEffect(() => {
    if (!selectedPrescriptionAppointmentId) {
      setPrescriptionReports([]);
      setSelectedPrescriptionReportIds([]);
      return;
    }

    const loadPrescriptionReports = async () => {
      try {
        setPrescriptionReportsLoading(true);
        const response = await api.get(`/reports/appointment/${selectedPrescriptionAppointmentId}`);
        const items = Array.isArray(response.data.data) ? response.data.data : [];
        setPrescriptionReports(items);
        setSelectedPrescriptionReportIds(items.map((item) => item._id));
      } catch (_error) {
        setPrescriptionReports([]);
        setSelectedPrescriptionReportIds([]);
      } finally {
        setPrescriptionReportsLoading(false);
      }
    };

    loadPrescriptionReports();
  }, [selectedPrescriptionAppointmentId]);

  const prescriptionAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'completed' && !item.hasPrescription),
    [appointments]
  );
  const doctorReportAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'completed' && !item.hasDoctorReport),
    [appointments]
  );
  const filteredDoctorReportAppointments = useMemo(() => {
    const normalizedSearch = reportSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return doctorReportAppointments;
    }

    return doctorReportAppointments.filter((appointment) =>
      `${appointment.patient?.user?.name || ''} ${appointment.patient?.user?.email || ''} ${appointment.timeSlot || ''}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [doctorReportAppointments, reportSearch]);
  const selectedPrescriptionAppointment = useMemo(
    () => appointments.find((item) => item._id === selectedPrescriptionAppointmentId),
    [appointments, selectedPrescriptionAppointmentId]
  );

  const stats = useMemo(() => {
    const completed = appointments.filter((item) => item.status === 'completed').length;
    const pending = appointments.filter((item) => item.status === 'pending').length;
    const cancelled = appointments.filter((item) => item.status === 'cancelled').length;

    return {
      total: appointments.length,
      completed,
      pending,
      cancelled,
    };
  }, [appointments]);

  const doctorTabs = [
    { id: 'appointments', label: 'Appointments', helper: 'Assigned visits and actions', count: stats.total },
    { id: 'prescriptions', label: 'Prescriptions', helper: 'Create treatment records', count: prescriptionAppointments.length },
    { id: 'reports', label: 'Reports', helper: 'View and upload visit files', count: reports.length },
    { id: 'history', label: 'Patient History', helper: 'Review prior visits', count: selectedHistory?.appointments?.length || 0 },
    { id: 'profile', label: 'Profile', helper: 'Public info and schedule', count: departments.length },
  ];

  const filteredAppointments = useMemo(() => {
    const query = appointmentSearch.trim().toLowerCase();
    if (!query) {
      return appointments;
    }

    return appointments.filter((appointment) =>
      `${appointment.patient?.user?.name || ''} ${appointment.patient?.user?.email || ''} ${appointment.timeSlot || ''} ${appointment.status || ''}`
        .toLowerCase()
        .includes(query)
    );
  }, [appointmentSearch, appointments]);

  const doctorNotifications = useMemo(() => ([
    stats.pending ? { label: `${stats.pending} pending appointment(s) waiting for review`, tone: 'warning' } : null,
    prescriptionAppointments.length ? { label: `${prescriptionAppointments.length} completed visit(s) need prescriptions`, tone: 'accent' } : null,
    doctorReportAppointments.length ? { label: `${doctorReportAppointments.length} completed visit(s) still need doctor reports`, tone: 'dark' } : null,
  ].filter(Boolean)), [doctorReportAppointments.length, prescriptionAppointments.length, stats.pending]);

  const getPatientId = (appointment) => appointment?.patient?._id || appointment?.patient?.id || '';

  const loadPatientHistory = async (patientId) => {
    try {
      setHistoryLoading(true);
      setAppointmentActionError('');
      setActiveTab('history');
      const response = await api.get(`/doctors/patients/${patientId}/history`);
      setSelectedHistory(response.data.data);
    } catch (error) {
      setAppointmentActionError(error.response?.data?.message || 'Unable to load patient history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadAppointmentReports = async (appointmentId) => {
    try {
      setReportsLoading(true);
      setReportsError('');
      const response = await api.get(`/reports/appointment/${appointmentId}`);
      setReports(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      setReportsError(error.response?.data?.message || 'Unable to load reports for this appointment.');
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      setAppointmentActionError('');
      await api.patch(`/doctors/appointments/${appointmentId}/status`, { status, notes: '' });
      toast.success('Appointment status updated.');
      loadDoctorPanel();
    } catch (error) {
      setAppointmentActionError(error.response?.data?.message || 'Unable to update appointment status.');
    }
  };

  const saveProfile = async (values) => {
    try {
      setSubmittingProfile(true);
      setProfileError('');
      await api.put('/doctors/profile', {
        ...values,
        schedule: {
          ...values.schedule,
          slotDuration: Number(values.schedule.slotDuration),
        },
      });

      toast.success('Doctor profile updated successfully.');
      loadDoctorPanel();
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Unable to update doctor profile.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const savePrescription = async (values) => {
    try {
      setPrescriptionError('');
      await api.post('/doctors/prescriptions', {
        appointmentId: values.appointmentId,
        reports: selectedPrescriptionReportIds,
        medicines: values.medicines.map((medicine) => ({
          ...medicine,
          days: Number(medicine.days),
        })),
        diagnosis: values.diagnosis,
        advice: values.advice,
      });

      resetPrescription({
        appointmentId: '',
        diagnosis: '',
        advice: '',
        medicines: [{ name: '', dosage: '', frequency: '', days: 1, notes: '' }],
      });
      setSelectedPrescriptionReportIds([]);
      setPrescriptionReports([]);

      toast.success('Prescription added successfully.');
      loadDoctorPanel();
    } catch (error) {
      setPrescriptionError(error.response?.data?.message || 'Unable to save prescription.');
    }
  };

  const openReschedule = (appointment) => {
    setAppointmentActionError('');
    setRescheduleModal({ open: true, appointment, role: 'doctor' });
    setRescheduleDate('');
    setRescheduleReason('');
    setRescheduleSlots([]);
    setRescheduleSlot('');
  };

  const openAppointmentReports = (appointment) => {
    setActiveTab('reports');
    setSelectedReportAppointmentId(appointment._id);
    setReportForm((current) => ({ ...current, appointmentId: appointment._id }));
    loadAppointmentReports(appointment._id);
  };

  const closeReschedule = () => {
    setRescheduleModal({ open: false, appointment: null, role: 'doctor' });
    setRescheduleDate('');
    setRescheduleReason('');
    setRescheduleSlots([]);
    setRescheduleSlot('');
  };

  const loadRescheduleSlots = async (appointment, date) => {
    if (!doctorId) {
      return;
    }

    if (!date) {
      setRescheduleSlots([]);
      return;
    }

    try {
      setRescheduleLoading(true);
      const response = await api.get(`/patients/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`);
      setRescheduleSlots(response.data.data.slots || []);
    } catch (error) {
      setAppointmentActionError(error.response?.data?.message || 'Unable to load reschedule slots.');
      setRescheduleSlots([]);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleModal.appointment?._id || !rescheduleDate || !rescheduleSlot) {
      setAppointmentActionError('Select a new date and slot to reschedule.');
      return;
    }

    try {
      setAppointmentActionError('');
      await api.patch(`/doctors/appointments/${rescheduleModal.appointment._id}/reschedule`, {
        date: rescheduleDate,
        timeSlot: rescheduleSlot,
        reason: rescheduleReason,
      });
      toast.success('Appointment rescheduled successfully.');
      closeReschedule();
      loadDoctorPanel();
    } catch (error) {
      setAppointmentActionError(error.response?.data?.message || 'Unable to reschedule appointment.');
    }
  };

  const uploadDoctorReport = async (event) => {
    event.preventDefault();

    if (!reportForm.file) {
      setReportsError('Please choose a PDF or image file.');
      return;
    }

    try {
      setUploadingReport(true);
      setReportsError('');
      const formData = new FormData();
      formData.append('appointmentId', reportForm.appointmentId);
      formData.append('title', reportForm.title);
      formData.append('description', reportForm.description);
      formData.append('type', reportForm.type);
      formData.append('reportDate', reportForm.reportDate);
      formData.append('file', reportForm.file);

      await api.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Report uploaded successfully.');
      setReportForm((current) => ({
        ...current,
        title: '',
        description: '',
        type: 'lab',
        reportDate: new Date().toISOString().slice(0, 10),
        file: null,
      }));
      await loadDoctorPanel();
      await loadAppointmentReports(reportForm.appointmentId);
    } catch (error) {
      setReportsError(error.response?.data?.message || 'Unable to upload report.');
    } finally {
      setUploadingReport(false);
    }
  };

  const handlePrintPrescription = (prescription) => {
    const didOpen = printPrescriptionDocument({
      prescription,
      patient: selectedHistory?.patient,
      doctorName: prescription.doctor?.user?.name || doctorProfile?.user?.name || 'Assigned Doctor',
    });

    if (!didOpen) {
      toast.error('Allow pop-ups once to print the prescription.');
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <DashboardLayout
      title="Doctor Panel"
      description="Manage your doctor profile, handle assigned appointments, update visit outcomes, issue prescriptions, and review patient history from one workspace."
      sidebarSections={doctorTabs}
      activeSection={activeTab}
      onSectionChange={setActiveTab}
    >
      {panelError && <div className="error-banner">{panelError}</div>}

        <div className={`panel-content-shell ${activeTab === 'prescriptions' ? 'space-y-6' : 'space-y-6'}`}>
        <section className="xl:col-span-2 grid min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard title="Assigned Appointments" value={stats.total} />
          <StatCard title="Pending Visits" value={stats.pending} tone="accent" />
          <StatCard title="Completed Visits" value={stats.completed} tone="dark" />
          <StatCard title="Cancelled Visits" value={stats.cancelled} />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {doctorNotifications.length ? doctorNotifications.map((item) => (
            <div key={item.label} className={`notification-card ${item.tone === 'warning' ? 'notification-warning' : item.tone === 'accent' ? 'notification-accent' : 'notification-dark'}`}>
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            </div>
          )) : (
            <div className="notification-card">
              <p className="text-sm font-semibold text-slate-900">No urgent doctor notifications right now.</p>
            </div>
          )}
        </section>

        {activeTab !== 'prescriptions' && (
        <div className="space-y-6">
          {activeTab === 'profile' && (
          <form className="card grid gap-4 md:grid-cols-2" onSubmit={handleSubmitProfile(saveProfile)}>
            <div className="md:col-span-2">
              <h2 className="section-title">Doctor Profile Management</h2>
              <p className="section-copy">Update your public profile, consultation details, and availability shown to patients.</p>
            </div>
            {profileError && <p className="error-banner md:col-span-2">{profileError}</p>}

            <div>
              <input className="input" placeholder="Full Name" {...registerProfile('name', { required: 'Name is required' })} />
              {profileErrors.name && <p className="mt-1 text-xs text-rose-500">{profileErrors.name.message}</p>}
            </div>
            <div>
              <input className="input" placeholder="Phone" {...registerProfile('phone', { required: 'Phone is required' })} />
              {profileErrors.phone && <p className="mt-1 text-xs text-rose-500">{profileErrors.phone.message}</p>}
            </div>
            <div>
              <input className="input" placeholder="Specialization" {...registerProfile('specialization', { required: 'Specialization is required' })} />
              {profileErrors.specialization && <p className="mt-1 text-xs text-rose-500">{profileErrors.specialization.message}</p>}
            </div>
            <div>
              <input className="input" placeholder="Qualification" {...registerProfile('qualification', { required: 'Qualification is required' })} />
              {profileErrors.qualification && <p className="mt-1 text-xs text-rose-500">{profileErrors.qualification.message}</p>}
            </div>
            <div>
              <input type="number" className="input" placeholder="Experience" {...registerProfile('experience', { required: 'Experience is required', min: { value: 0, message: 'Experience cannot be negative' } })} />
              {profileErrors.experience && <p className="mt-1 text-xs text-rose-500">{profileErrors.experience.message}</p>}
            </div>
            <div>
              <input type="number" className="input" placeholder="Consultation Fee" {...registerProfile('consultationFee', { required: 'Consultation fee is required', min: { value: 0, message: 'Fee cannot be negative' } })} />
              {profileErrors.consultationFee && <p className="mt-1 text-xs text-rose-500">{profileErrors.consultationFee.message}</p>}
            </div>
            <div>
              <select className="input" {...registerProfile('department', { required: 'Department is required' })}>
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {profileErrors.department && <p className="mt-1 text-xs text-rose-500">{profileErrors.department.message}</p>}
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-slate-700">Working Days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weekDayOptions.map((day) => (
                  <label key={day.value} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    <input type="checkbox" value={day.value} {...registerProfile('schedule.workingDays', { required: 'Select at least one working day' })} />
                    {day.label}
                  </label>
                ))}
              </div>
              {profileErrors.schedule?.workingDays && <p className="mt-1 text-xs text-rose-500">{profileErrors.schedule.workingDays.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Start Time</label>
              <input type="time" className="input" {...registerProfile('schedule.startTime', { required: 'Start time is required' })} />
              {profileErrors.schedule?.startTime && <p className="mt-1 text-xs text-rose-500">{profileErrors.schedule.startTime.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">End Time</label>
              <input type="time" className="input" {...registerProfile('schedule.endTime', { required: 'End time is required' })} />
              {profileErrors.schedule?.endTime && <p className="mt-1 text-xs text-rose-500">{profileErrors.schedule.endTime.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Slot Duration (minutes)</label>
              <input type="number" className="input" {...registerProfile('schedule.slotDuration', { required: 'Slot duration is required', min: { value: 5, message: 'Minimum duration is 5 minutes' } })} />
              {profileErrors.schedule?.slotDuration && <p className="mt-1 text-xs text-rose-500">{profileErrors.schedule.slotDuration.message}</p>}
            </div>
            <div className="md:col-span-2">
              <textarea className="input min-h-28" placeholder="Professional Bio" {...registerProfile('bio', { required: 'Bio is required' })} />
              {profileErrors.bio && <p className="mt-1 text-xs text-rose-500">{profileErrors.bio.message}</p>}
            </div>
            <button className="btn-primary md:col-span-2 w-full md:w-fit" disabled={submittingProfile}>
              {submittingProfile ? 'Saving...' : 'Save Doctor Profile'}
            </button>
          </form>
          )}

          {activeTab === 'appointments' && (
          <div className="space-y-6">
          {!simpleMode && (
            <ChartCard
              title="My Appointment Trend"
              description="Last 7 days of appointment load for your schedule."
              loading={chartLoading}
              empty={!doctorChartStats.appointmentsPerDay?.some((item) => item.count)}
            >
              <AppointmentsBarChart data={doctorChartStats.appointmentsPerDay} />
            </ChartCard>
          )}
          <div className="card">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="section-title">Assigned Appointments</h2>
                <p className="section-copy">Update status, select a patient, and jump directly into treatment workflow.</p>
              </div>
            </div>
            <div className="mt-5">
              <input
                className="input"
                placeholder="Search patient, email, slot, or status"
                value={appointmentSearch}
                onChange={(event) => setAppointmentSearch(event.target.value)}
              />
            </div>
            {appointmentActionError && <p className="error-banner mt-4">{appointmentActionError}</p>}

            {!filteredAppointments.length ? (
              <div className="mt-4">
                <EmptyState title="No appointments assigned" description="Appointments will appear here once patients book with you." />
              </div>
            ) : (
              <div className="table-shell mt-6">
                <div className="max-h-[520px] overflow-y-auto">
                  <div className="divide-y divide-slate-100">
                {filteredAppointments.map((appointment) => (
                  <article key={appointment._id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-semibold text-slate-900">{appointment.patient?.user?.name}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeMap[appointment.status] || 'bg-slate-100 text-slate-600'}`}>
                            {appointment.status}
                          </span>
                          {appointment.hasPrescription && (
                            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                              Prescription Added
                            </span>
                          )}
                        </div>
                        <div className="record-grid">
                          <div className="record-meta">
                            <p className="record-label">Visit Slot</p>
                            <p className="record-value">{formatDate(appointment.date)} at {appointment.timeSlot}</p>
                          </div>
                          <div className="record-meta">
                            <p className="record-label">Patient Email</p>
                            <p className="record-value">{appointment.patient?.user?.email || 'No email available'}</p>
                          </div>
                          <div className="record-meta">
                            <p className="record-label">Billing</p>
                            <p className="record-value">Rs. {appointment.amount ?? 0}</p>
                            <p className="record-subvalue uppercase">{appointment.paymentStatus || 'unpaid'}{appointment.paymentMethod ? ` • ${appointment.paymentMethod}` : ''}</p>
                          </div>
                          <div className="record-meta sm:col-span-2 xl:col-span-3">
                            <p className="record-label">Symptoms / Notes</p>
                            <p className="record-value">{appointment.symptoms || 'No symptoms added by patient.'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
                        {appointment.status !== 'completed' && (
                          <>
                            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => updateAppointmentStatus(appointment._id, 'pending')}>
                              Mark Pending
                            </button>
                            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => updateAppointmentStatus(appointment._id, 'completed')}>
                              Mark Completed
                            </button>
                            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}>
                              Cancel
                            </button>
                        {!simpleMode && (
                          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => openReschedule(appointment)}>
                            Reschedule
                          </button>
                        )}
                          </>
                        )}
                        <button
                          type="button"
                          className="btn-primary w-full sm:w-auto"
                          disabled={!getPatientId(appointment)}
                          onClick={() => loadPatientHistory(getPatientId(appointment))}
                        >
                          View History
                        </button>
                        <button
                          type="button"
                          className="btn-secondary w-full sm:w-auto"
                          onClick={() => openAppointmentReports(appointment)}
                        >
                          Reports
                        </button>
                        {appointment.rescheduleHistory?.length > 0 && (
                          <p className="mt-3 text-xs font-medium text-slate-500">
                            Rescheduled {appointment.rescheduleHistory.length} time(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
          )}
        </div>
        )}

        {activeTab === 'prescriptions' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
          <form className="rx-shell space-y-5" onSubmit={handleSubmitPrescription(savePrescription)}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="section-title">Prescription Studio</h2>
                <p className="section-copy">Write structured prescriptions with diagnosis, advice, and medicine plans from one clean clinical workspace.</p>
              </div>
              <div className="rx-summary-grid lg:max-w-xl">
                <div className="rx-summary-card">
                  <p className="rx-summary-label">Queue</p>
                  <p className="rx-summary-value">{prescriptionAppointments.length}</p>
                </div>
                <div className="rx-summary-card">
                  <p className="rx-summary-label">Completed Visits</p>
                  <p className="rx-summary-value">{stats.completed}</p>
                </div>
                <div className="rx-summary-card">
                  <p className="rx-summary-label">Ready To Issue</p>
                  <p className="rx-summary-value">{prescriptionAppointments.length ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            {prescriptionError && <p className="error-banner">{prescriptionError}</p>}

            {!prescriptionAppointments.length && (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No completed appointment is waiting for prescription. Complete an appointment first, and once a prescription is added it will disappear from this list.
              </p>
            )}

            <div>
              <select className="input" {...registerPrescription('appointmentId', { required: 'Appointment selection is required' })}>
                <option value="">Select Appointment</option>
                {prescriptionAppointments.map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>
                    {appointment.patient?.user?.name || 'Patient'} - {formatDate(appointment.date)} - {appointment.timeSlot}
                  </option>
                ))}
              </select>
              {prescriptionErrors.appointmentId && <p className="mt-1 text-xs text-rose-500">{prescriptionErrors.appointmentId.message}</p>}
              {selectedPrescriptionAppointment && (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedPrescriptionAppointment.reportCount
                    ? `${selectedPrescriptionAppointment.reportCount} report(s) linked to this visit will attach to the prescription automatically.`
                    : 'No report is linked to this visit yet. You can still issue the prescription now.'}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Link Reports To Prescription</p>
                <span className="data-chip">{selectedPrescriptionReportIds.length} selected</span>
              </div>
              {prescriptionReportsLoading ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Loading appointment reports...</p>
              ) : !selectedPrescriptionAppointmentId ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Select an appointment first to choose reports.</p>
              ) : !prescriptionReports.length ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No active reports are attached to this appointment.</p>
              ) : (
                <div className="space-y-3">
                  {prescriptionReports.map((report) => (
                    <label key={report._id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedPrescriptionReportIds.includes(report._id)}
                        onChange={(event) => {
                          setSelectedPrescriptionReportIds((current) =>
                            event.target.checked ? [...current, report._id] : current.filter((item) => item !== report._id)
                          );
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{report.title}</p>
                          <span className="data-chip uppercase">{report.type}</span>
                          <span className="data-chip">{formatDate(report.reportDate || report.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{report.description || 'No extra description added.'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <input className="input" placeholder="Diagnosis" {...registerPrescription('diagnosis', { required: 'Diagnosis is required' })} />
              {prescriptionErrors.diagnosis && <p className="mt-1 text-xs text-rose-500">{prescriptionErrors.diagnosis.message}</p>}
            </div>
            <div>
              <textarea className="input min-h-24" placeholder="Advice" {...registerPrescription('advice')} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Medicines</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => appendMedicine({ name: '', dosage: '', frequency: '', days: 1, notes: '' })}
                >
                  Add Medicine
                </button>
              </div>
              {medicineFields.map((field, index) => (
                <div key={field.id} className="rx-medicine-card">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Medicine {index + 1}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Dosage plan</p>
                    </div>
                    {medicineFields.length > 1 && (
                      <button type="button" className="btn-secondary" onClick={() => removeMedicine(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <input className="input" placeholder="Medicine Name" {...registerPrescription(`medicines.${index}.name`, { required: 'Medicine name is required' })} />
                    </div>
                    <div>
                      <input className="input" placeholder="Dosage" {...registerPrescription(`medicines.${index}.dosage`, { required: 'Dosage is required' })} />
                    </div>
                    <div>
                      <input className="input" placeholder="Frequency" {...registerPrescription(`medicines.${index}.frequency`, { required: 'Frequency is required' })} />
                    </div>
                    <div>
                      <input type="number" className="input" placeholder="Days" {...registerPrescription(`medicines.${index}.days`, { required: 'Days are required', min: { value: 1, message: 'Minimum is 1 day' } })} />
                    </div>
                    <div className="md:col-span-2">
                      <textarea className="input min-h-20" placeholder="Notes" {...registerPrescription(`medicines.${index}.notes`)} />
                    </div>
                  </div>
                </div>
              ))}
              {prescriptionErrors.medicines && <p className="mt-1 text-xs text-rose-500">At least one complete medicine row is required.</p>}
            </div>
            <button className="btn-primary w-full sm:w-auto" disabled={!prescriptionAppointments.length}>Save Prescription</button>
          </form>

          <div className="rx-shell">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="section-title">Prescription Queue</h2>
                <p className="section-copy">Choose a completed visit, prefill the studio, and issue the prescription without hunting through appointments.</p>
              </div>
              <span className="data-chip">{prescriptionAppointments.length} pending</span>
            </div>
            <div className="table-shell mt-5">
              <div className="max-h-[520px] overflow-y-auto">
                {!prescriptionAppointments.length ? (
                  <p className="p-4 text-sm text-slate-500">No completed appointment is waiting for prescription.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {prescriptionAppointments.map((appointment) => (
                      <article key={appointment._id} className="rx-queue-item">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">{appointment.patient?.user?.name || 'Patient'}</p>
                              <span className="data-chip">{formatDate(appointment.date)}</span>
                              <span className="data-chip">{appointment.timeSlot}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">{appointment.patient?.user?.email || 'No email available'}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="data-chip">Rs. {appointment.amount ?? 0}</span>
                              <span className={`data-chip ${appointment.paymentStatus === 'paid' ? '!bg-emerald-100 !text-emerald-700' : '!bg-amber-100 !text-amber-700'}`}>
                                {appointment.paymentStatus || 'unpaid'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-secondary w-full xl:w-auto"
                            onClick={() => {
                              resetPrescription({
                                appointmentId: appointment._id,
                                diagnosis: '',
                                advice: '',
                                medicines: [{ name: '', dosage: '', frequency: '', days: 1, notes: '' }],
                              });
                              setSelectedPrescriptionReportIds([]);
                              document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                          >
                            Start Prescription
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'reports' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(340px,1.1fr)]">
          <form className="card space-y-4" onSubmit={uploadDoctorReport}>
            <div>
              <h2 className="section-title">Upload Consultation Report</h2>
              <p className="section-copy">Attach scanned prescriptions, images, discharge summaries, and consultation documents to the correct visit.</p>
            </div>
            {reportsError && <p className="error-banner">{reportsError}</p>}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Search Pending Patient</label>
              <input
                className="input"
                placeholder="Search patient name, email, or slot..."
                value={reportSearch}
                onChange={(event) => setReportSearch(event.target.value)}
              />
              <p className="mt-2 text-xs text-slate-500">Only completed visits that do not yet have a doctor-uploaded report appear in this list.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Appointment</label>
              <select
                className="input"
                value={reportForm.appointmentId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedReportAppointmentId(nextId);
                  setReportForm((current) => ({ ...current, appointmentId: nextId }));
                }}
              >
                <option value="">Select Appointment</option>
                {filteredDoctorReportAppointments.map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>
                    {appointment.patient?.user?.name} - {formatDate(appointment.date)} - {appointment.timeSlot}
                  </option>
                ))}
              </select>
              {!filteredDoctorReportAppointments.length ? (
                <p className="mt-2 text-xs text-slate-500">No patient is waiting for a doctor report right now, or nothing matches your search.</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Doctors can upload reports only for completed consultations that still need a doctor report.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Report Title</label>
              <input
                className="input"
                placeholder="Follow-up Summary, X-Ray Review, Lab Interpretation..."
                value={reportForm.title}
                onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Report Type</label>
                <select
                  className="input"
                  value={reportForm.type}
                  onChange={(event) => setReportForm((current) => ({ ...current, type: event.target.value }))}
                >
                  {reportTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Report Date</label>
                <input
                  type="date"
                  className="input"
                  value={reportForm.reportDate}
                  onChange={(event) => setReportForm((current) => ({ ...current, reportDate: event.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                className="input min-h-24"
                placeholder="Add context for the patient and admin team..."
                value={reportForm.description}
                onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">File</label>
              <input
                type="file"
                accept=".pdf,image/*"
                className="input"
                onChange={(event) => setReportForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
              />
              <p className="mt-2 text-xs text-slate-500">Accepted: PDF, JPG, PNG, WEBP. Max size 5MB.</p>
            </div>
            <button className="btn-primary w-full sm:w-auto" disabled={uploadingReport || !reportForm.appointmentId}>
              {uploadingReport ? 'Uploading...' : 'Upload Report'}
            </button>
          </form>

          <div className="card">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="section-title">Appointment Reports</h2>
                <p className="section-copy">Preview all files attached to the selected appointment.</p>
              </div>
              <span className="data-chip">{reports.length}</span>
            </div>

            {reportsLoading ? (
              <div className="mt-5">
                <Loader />
              </div>
            ) : !reports.length ? (
              <div className="mt-5">
                <EmptyState title="No reports yet" description="Select an appointment and upload the first report after consultation." />
              </div>
            ) : (
              <div className="mt-5 max-h-[640px] space-y-4 overflow-y-auto pr-1">
                {reports.map((report) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    onPreview={setPreviewReport}
                    actions={[{ label: 'Print Summary', onClick: (current) => printReportSummaryDocument(current) }]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {activeTab === 'history' && (
        <div className="xl:col-span-2">
          <div className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Patient History</h2>
                <p className="section-copy">Select any appointment to inspect prior visits and existing prescriptions.</p>
              </div>
            </div>

            {historyLoading ? (
              <Loader />
            ) : !selectedHistory ? (
              <p className="mt-4 text-sm text-slate-500">No patient selected yet. Use "View History" from the appointments list.</p>
            ) : (
              <div className="mt-5 space-y-5 scroll-panel">
                <div className="record-shell">
                  <h3 className="text-lg font-semibold text-slate-900">{selectedHistory.patient?.user?.name}</h3>
                  <div className="record-grid">
                    <div className="record-meta">
                      <p className="record-label">Email</p>
                      <p className="record-value">{selectedHistory.patient?.user?.email}</p>
                    </div>
                    <div className="record-meta">
                      <p className="record-label">Phone</p>
                      <p className="record-value">{selectedHistory.patient?.user?.phone || 'No phone number available'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Appointment History</p>
                  <div className="table-shell mt-3">
                    <div className="max-h-[220px] overflow-y-auto">
                      <div className="divide-y divide-slate-100">
                    {selectedHistory.appointments.length ? (
                      selectedHistory.appointments.map((item) => (
                        <div key={item._id} className="px-4 py-4 text-sm text-slate-600">
                          <div className="record-grid">
                            <div className="record-meta">
                              <p className="record-label">Visit</p>
                              <p className="record-value">{formatDate(item.date)} at {item.timeSlot}</p>
                            </div>
                            <div className="record-meta">
                              <p className="record-label">Doctor</p>
                              <p className="record-value">{item.doctor?.user?.name}</p>
                            </div>
                            <div className="record-meta">
                              <p className="record-label">Status</p>
                              <p className="record-value capitalize">{item.status}</p>
                            </div>
                          </div>
                          {item.rescheduleHistory?.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">Reschedules: {item.rescheduleHistory.length}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-slate-500">No previous appointments found.</p>
                    )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Prescription History</p>
                  <div className="table-shell mt-3">
                    <div className="max-h-[260px] overflow-y-auto">
                      <div className="divide-y divide-slate-100">
                    {selectedHistory.prescriptions.length ? (
                      selectedHistory.prescriptions.map((item) => (
                        <div key={item._id} className="px-4 py-4 text-sm text-slate-600">
                          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
                              Issued {formatDate(item.createdAt)}
                            </p>
                            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => handlePrintPrescription(item)}>
                              Print Prescription
                            </button>
                          </div>
                          <div className="record-grid">
                            <div className="record-meta sm:col-span-2 xl:col-span-3">
                              <p className="record-label">Diagnosis</p>
                              <p className="record-value">{item.diagnosis}</p>
                            </div>
                          </div>
                          <div className="mt-2 space-y-2">
                            {item.medicines.map((medicine, index) => (
                              <div key={`${item._id}-${index}`} className="rounded-xl bg-slate-50 p-3">
                                <p className="font-medium text-slate-900">{medicine.name}</p>
                                <p className="mt-1 text-xs text-slate-600">{medicine.dosage} | {medicine.frequency} | {medicine.days} day(s)</p>
                                {medicine.notes && <p className="mt-1 text-xs text-slate-500">{medicine.notes}</p>}
                              </div>
                            ))}
                          </div>
                          <div className="record-meta mt-3">
                            <p className="record-label">Advice</p>
                            <p className="record-value">{item.advice || 'No advice recorded.'}</p>
                          </div>
                          <ReportAttachmentList
                            reports={item.reports || []}
                            onPreview={setPreviewReport}
                            title="Attached Reports"
                            emptyMessage="No report was attached to this prescription."
                          />
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-slate-500">No prescriptions found for this patient.</p>
                    )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
        </div>

      {!simpleMode && rescheduleModal.open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="card w-full max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="section-title">Reschedule Appointment</h3>
                <p className="section-copy">
                  Choose a new slot for {rescheduleModal.appointment?.patient?.user?.name}.
                </p>
              </div>
              <button type="button" className="btn-secondary" onClick={closeReschedule}>Close</button>
            </div>
            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">New Date</label>
                <input
                  type="date"
                  className="input"
                  value={rescheduleDate}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setRescheduleDate(nextDate);
                    setRescheduleSlot('');
                    loadRescheduleSlots(rescheduleModal.appointment, nextDate);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">New Slot</label>
                <select className="input" value={rescheduleSlot} onChange={(event) => setRescheduleSlot(event.target.value)}>
                  <option value="">{rescheduleLoading ? 'Loading slots...' : 'Select slot'}</option>
                  {rescheduleSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Reason</label>
                <textarea className="input min-h-24" value={rescheduleReason} onChange={(event) => setRescheduleReason(event.target.value)} />
              </div>
              <button type="button" className="btn-primary w-full sm:w-auto" onClick={submitReschedule}>
                Save Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportPreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
    </DashboardLayout>
  );
};

export default DoctorPanelPage;
