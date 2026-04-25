import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import StatCard from '../../components/common/StatCard';
import ChartCard from '../../components/charts/ChartCard';
import { AppointmentsLineChart } from '../../components/charts/DashboardCharts';
import ReportCard from '../../components/reports/ReportCard';
import ReportAttachmentList from '../../components/reports/ReportAttachmentList';
import ReportPreviewModal from '../../components/reports/ReportPreviewModal';
import api from '../../api/axios';
import { formatDate } from '../../lib/format';
import { printReportSummaryDocument } from '../../lib/printDocuments';
import { printPrescriptionDocument } from '../../lib/printPrescription';
import { reportTypeOptions } from '../../lib/reportTypes';

const simpleMode = String(import.meta.env.VITE_SIMPLE_MODE || '').toLowerCase() === 'true';

const statusBadgeMap = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const PatientPanelPage = () => {
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm();
  const {
    register: registerBooking,
    handleSubmit: handleSubmitBooking,
    reset: resetBooking,
    setValue: setBookingValue,
    formState: { errors: bookingErrors },
  } = useForm();

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [profileSaving, setProfileSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [appointmentsError, setAppointmentsError] = useState('');
  const [reportsError, setReportsError] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedBookingDate, setSelectedBookingDate] = useState('');
  const [patientProfileId, setPatientProfileId] = useState('');
  const [patientProfile, setPatientProfile] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null });
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ open: false, appointment: null });
  const [paymentMethod, setPaymentMethod] = useState('upi');
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
  const [activeTab, setActiveTab] = useState('book');
  const [patientChartStats, setPatientChartStats] = useState({ visitHistory: [] });
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [prescriptionReportTypeFilter, setPrescriptionReportTypeFilter] = useState('all');

  const loadDoctors = async (currentSearch = search, currentPage = page) => {
    const response = await api.get(`/patients/doctors?search=${encodeURIComponent(currentSearch)}&page=${currentPage}&limit=6`);
    setDoctors(response.data.data.items);
    setPagination(response.data.data.pagination);
  };

  const loadPatientPanel = async (currentSearch = search, currentPage = page) => {
    try {
      setPanelError('');
      setChartLoading(true);
      const [profileResponse, appointmentsResponse, prescriptionsResponse] = await Promise.all([
        api.get('/patients/profile'),
        api.get('/patients/appointments'),
        api.get('/patients/prescriptions'),
      ]);

      const profile = profileResponse.data.data;
      setPatientProfile(profile);
      setPatientProfileId(profile._id || '');
      resetProfile({
        name: profile.user?.name || '',
        phone: profile.user?.phone || '',
        age: profile.age || '',
        gender: profile.gender || '',
        bloodGroup: profile.bloodGroup || '',
        address: profile.address || '',
        medicalHistory: profile.medicalHistory?.join(', ') || '',
      });

      setAppointments(Array.isArray(appointmentsResponse.data.data) ? appointmentsResponse.data.data : []);
      setPrescriptions(Array.isArray(prescriptionsResponse.data.data) ? prescriptionsResponse.data.data : []);
      if (profile._id) {
        const reportsResponse = await api.get(`/reports/patient/${profile._id}`);
        setReports(Array.isArray(reportsResponse.data.data) ? reportsResponse.data.data : []);
        if (simpleMode) {
          setPatientChartStats({ visitHistory: [] });
        } else {
          const statsResponse = await api.get(`/stats/patient/${profile._id}`);
          setPatientChartStats(statsResponse.data.data || { visitHistory: [] });
        }
      } else {
        setReports([]);
        setPatientChartStats({ visitHistory: [] });
      }
      await loadDoctors(currentSearch, currentPage);
    } catch (error) {
      setPanelError(error.response?.data?.message || 'Unable to load patient panel data.');
      setDoctors([]);
      setAppointments([]);
      setPrescriptions([]);
      setReports([]);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  useEffect(() => {
    loadPatientPanel();
  }, []);

  const stats = useMemo(() => ({
    doctors: pagination.total || doctors.length,
    appointments: appointments.length,
    prescriptions: prescriptions.length,
    reports: reports.length,
    cancelled: appointments.filter((item) => item.status === 'cancelled').length,
  }), [appointments, prescriptions, reports.length, pagination.total, doctors.length]);

  const patientTabs = [
    { id: 'book', label: 'Find Doctor', helper: 'Search doctors and book a visit', count: stats.doctors },
    { id: 'appointments', label: 'My Appointments', helper: 'Track bookings and payments', count: stats.appointments },
    { id: 'prescriptions', label: 'My Prescriptions', helper: 'View treatment details', count: stats.prescriptions },
    { id: 'reports', label: 'My Reports', helper: 'Upload and preview files', count: stats.reports },
    { id: 'profile', label: 'My Profile', helper: 'Update personal and medical info', count: stats.cancelled },
  ];

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((item) => {
      const query = prescriptionSearch.trim().toLowerCase();
      const matchesSearch = !query || `${item.doctor?.user?.name || item.doctor?.name || ''} ${item.diagnosis || ''} ${item.advice || ''}`
        .toLowerCase()
        .includes(query);
      const matchesReportType =
        prescriptionReportTypeFilter === 'all' ||
        (item.reports || []).some((report) => report.type === prescriptionReportTypeFilter);
      return matchesSearch && matchesReportType;
    });
  }, [prescriptionReportTypeFilter, prescriptionSearch, prescriptions]);

  const patientNotifications = useMemo(() => ([
    appointments.some((item) => item.status === 'pending') ? { label: `${appointments.filter((item) => item.status === 'pending').length} upcoming appointment(s) scheduled`, tone: 'warning' } : null,
    appointments.some((item) => item.paymentStatus !== 'paid' && item.status !== 'cancelled') ? { label: `${appointments.filter((item) => item.paymentStatus !== 'paid' && item.status !== 'cancelled').length} visit(s) still unpaid`, tone: 'accent' } : null,
    prescriptions.length ? { label: `${prescriptions.length} prescription record(s) available to review or print`, tone: 'dark' } : null,
  ].filter(Boolean)), [appointments, prescriptions.length]);

  const onSearchDoctors = async (event) => {
    event.preventDefault();
    try {
      setPanelError('');
      const nextPage = 1;
      setPage(nextPage);
      await loadDoctors(search, nextPage);
    } catch (error) {
      setPanelError(error.response?.data?.message || 'Unable to search doctors right now.');
    }
  };

  const goToPage = async (nextPage) => {
    try {
      setPanelError('');
      setPage(nextPage);
      await loadDoctors(search, nextPage);
    } catch (error) {
      setPanelError(error.response?.data?.message || 'Unable to change page.');
    }
  };

  const selectDoctor = (doctorId) => {
    setSelectedDoctorId(doctorId);
    setBookingValue('doctorId', doctorId);
    setBookingValue('timeSlot', '');
    setAvailableSlots([]);
    if (selectedBookingDate) {
      loadAvailableSlots(doctorId, selectedBookingDate);
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      return;
    }

    try {
      setSlotsLoading(true);
      setBookingError('');
      const response = await api.get(`/patients/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`);
      setAvailableSlots(response.data.data.slots || []);
    } catch (error) {
      setAvailableSlots([]);
      setBookingError(error.response?.data?.message || 'Unable to load available slots.');
    } finally {
      setSlotsLoading(false);
    }
  };

  const saveProfile = async (values) => {
    try {
      setProfileSaving(true);
      setProfileError('');
      await api.put('/patients/profile', {
        ...values,
        medicalHistory: values.medicalHistory
          ? values.medicalHistory.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      });
      toast.success('Patient profile updated successfully.');
      loadPatientPanel(search, page);
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Unable to update patient profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const bookAppointment = async (values) => {
    try {
      setBookingError('');
      await api.post('/patients/appointments', values);
      resetBooking({ doctorId: '', date: '', timeSlot: '', symptoms: '' });
      setSelectedDoctorId('');
      setSelectedBookingDate('');
      setAvailableSlots([]);
      toast.success('Appointment booked successfully.');
      loadPatientPanel(search, page);
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Unable to book appointment.');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      setAppointmentsError('');
      await api.patch(`/patients/appointments/${appointmentId}/cancel`);
      toast.success('Appointment cancelled successfully.');
      loadPatientPanel(search, page);
    } catch (error) {
      setAppointmentsError(error.response?.data?.message || 'Unable to cancel appointment.');
    }
  };

  const openReschedule = (appointment) => {
    setAppointmentsError('');
    setRescheduleModal({ open: true, appointment });
    setRescheduleDate('');
    setRescheduleSlot('');
    setRescheduleReason('');
    setRescheduleSlots([]);
  };

  const closeReschedule = () => {
    setRescheduleModal({ open: false, appointment: null });
    setRescheduleDate('');
    setRescheduleSlot('');
    setRescheduleReason('');
    setRescheduleSlots([]);
  };

  const loadPatientRescheduleSlots = async (appointment, date) => {
    const doctorId = appointment?.doctor?._id;
    if (!doctorId || !date) {
      setRescheduleSlots([]);
      return;
    }

    try {
      setRescheduleLoading(true);
      const response = await api.get(`/patients/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`);
      setRescheduleSlots(response.data.data.slots || []);
    } catch (error) {
      setAppointmentsError(error.response?.data?.message || 'Unable to load reschedule slots.');
      setRescheduleSlots([]);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleModal.appointment?._id || !rescheduleDate || !rescheduleSlot) {
      setAppointmentsError('Select a new date and slot to reschedule.');
      return;
    }

    try {
      setAppointmentsError('');
      await api.patch(`/patients/appointments/${rescheduleModal.appointment._id}/reschedule`, {
        date: rescheduleDate,
        timeSlot: rescheduleSlot,
        reason: rescheduleReason,
      });
      toast.success('Appointment rescheduled successfully.');
      closeReschedule();
      loadPatientPanel(search, page);
    } catch (error) {
      setAppointmentsError(error.response?.data?.message || 'Unable to reschedule appointment.');
    }
  };

  const openPaymentModal = (appointment) => {
    setAppointmentsError('');
    setPaymentModal({ open: true, appointment });
    setPaymentMethod(appointment.paymentMethod || 'upi');
  };

  const closePaymentModal = () => {
    setPaymentModal({ open: false, appointment: null });
    setPaymentMethod('upi');
  };

  const submitPayment = async () => {
    if (!paymentModal.appointment?._id) {
      return;
    }

    try {
      setAppointmentsError('');
      await api.patch(`/patients/appointments/${paymentModal.appointment._id}/payment`, {
        paymentStatus: 'paid',
        paymentMethod,
      });
      toast.success('Payment marked successfully.');
      closePaymentModal();
      loadPatientPanel(search, page);
    } catch (error) {
      setAppointmentsError(error.response?.data?.message || 'Unable to update payment.');
    }
  };

  const uploadReport = async (event) => {
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
      setReportForm({
        appointmentId: '',
        title: '',
        description: '',
        type: 'lab',
        reportDate: new Date().toISOString().slice(0, 10),
        file: null,
      });
      await loadPatientPanel(search, page);
    } catch (error) {
      setReportsError(error.response?.data?.message || 'Unable to upload report.');
    } finally {
      setUploadingReport(false);
    }
  };

  const handlePrintPrescription = (prescription) => {
    const didOpen = printPrescriptionDocument({
      prescription,
      patient: patientProfile,
      doctorName: prescription.doctor?.user?.name || prescription.doctor?.name || 'Assigned Doctor',
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
      title="Patient Panel"
      description="Manage your profile, explore doctors by specialization, book appointments, review appointment history, cancel bookings, and track prescriptions from one patient workspace."
      sidebarSections={patientTabs}
      activeSection={activeTab}
      onSectionChange={setActiveTab}
    >
      {panelError && <div className="error-banner">{panelError}</div>}

        <div className={`panel-content-shell ${activeTab === 'book' ? 'grid gap-6 xl:grid-cols-[1.05fr_0.95fr]' : 'space-y-6'}`}>
        <section className="xl:col-span-2 grid min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard title="Available Doctors" value={stats.doctors} />
          <StatCard title="Appointments" value={stats.appointments} tone="accent" />
          <StatCard title="Prescriptions" value={stats.prescriptions} tone="dark" />
          <StatCard title="Reports" value={stats.reports} />
        </section>

        <section className="xl:col-span-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {patientNotifications.length ? patientNotifications.map((item) => (
            <div key={item.label} className={`notification-card ${item.tone === 'warning' ? 'notification-warning' : item.tone === 'accent' ? 'notification-accent' : 'notification-dark'}`}>
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            </div>
          )) : (
            <div className="notification-card">
              <p className="text-sm font-semibold text-slate-900">No urgent patient notifications right now.</p>
            </div>
          )}
        </section>

        <div className={activeTab === 'book' ? 'space-y-6' : 'xl:col-span-2 space-y-6'}>
          {activeTab === 'profile' && (
          <form className="card grid gap-4 md:grid-cols-2" onSubmit={handleSubmitProfile(saveProfile)}>
            <div className="md:col-span-2">
              <h2 className="section-title">Patient Profile</h2>
              <p className="section-copy">Keep your account and medical background updated so doctors have the right context.</p>
            </div>
            {profileError && <p className="error-banner md:col-span-2">{profileError}</p>}

            <div>
              <input className="input" placeholder="Name" {...registerProfile('name', { required: 'Name is required' })} />
              {profileErrors.name && <p className="mt-1 text-xs text-rose-500">{profileErrors.name.message}</p>}
            </div>
            <div>
              <input className="input" placeholder="Phone" {...registerProfile('phone', { required: 'Phone is required' })} />
              {profileErrors.phone && <p className="mt-1 text-xs text-rose-500">{profileErrors.phone.message}</p>}
            </div>
            <div>
              <input type="number" className="input" placeholder="Age" {...registerProfile('age', { min: { value: 0, message: 'Age cannot be negative' } })} />
              {profileErrors.age && <p className="mt-1 text-xs text-rose-500">{profileErrors.age.message}</p>}
            </div>
            <div>
              <select className="input" {...registerProfile('gender')}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <input className="input" placeholder="Blood Group" {...registerProfile('bloodGroup')} />
            </div>
            <div>
              <input className="input" placeholder="Medical History (comma separated)" {...registerProfile('medicalHistory')} />
            </div>
            <div className="md:col-span-2">
              <textarea className="input min-h-28" placeholder="Address" {...registerProfile('address')} />
            </div>
            <button className="btn-primary md:col-span-2 w-full md:w-fit" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
          )}

          {activeTab === 'book' && (
          <div className="card">
            <div>
              <h2 className="section-title">Find Doctors</h2>
              <p className="section-copy">Browse approved doctors, compare specializations, and pick a doctor before booking.</p>
            </div>
            <form className="mt-5 flex flex-col gap-3 md:flex-row" onSubmit={onSearchDoctors}>
              <input
                className="input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by doctor name, department, or specialization"
              />
              <button className="btn-primary w-full md:w-40">Search</button>
            </form>

            {!doctors.length ? (
              <div className="mt-5">
                <EmptyState title="No doctors found" description="Try a different search or ask admin to add and approve doctors." />
              </div>
            ) : (
              <>
                <div className="table-shell mt-6">
                  <div className="max-h-[520px] overflow-y-auto">
                    <div className="divide-y divide-slate-100">
                  {doctors.map((doctor) => (
                    <article key={doctor._id} className={`px-4 py-4 transition sm:px-5 ${selectedDoctorId === doctor._id ? 'bg-brand-50/70' : 'bg-white'}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{doctor.user?.name}</p>
                            <span className="data-chip">{doctor.department?.name}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">{doctor.specialization}</p>
                          <p className="mt-2 text-sm text-slate-500">{doctor.scheduleSummary || 'Schedule not configured'}</p>
                          <p className="mt-2 line-clamp-2 text-sm text-slate-700">{doctor.bio || 'Experienced healthcare professional available for consultation.'}</p>
                        </div>
                        <button type="button" className="btn-secondary w-full lg:w-auto" onClick={() => selectDoctor(doctor._id)}>
                        {selectedDoctorId === doctor._id ? 'Selected' : 'Select for Booking'}
                        </button>
                      </div>
                    </article>
                  ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button type="button" className="btn-secondary w-full sm:w-auto" disabled={page <= 1} onClick={() => goToPage(page - 1)}>Previous</button>
                  <span className="text-center text-sm text-slate-500">Page {pagination.page || 1} of {pagination.pages || 1}</span>
                  <button type="button" className="btn-secondary w-full sm:w-auto" disabled={page >= (pagination.pages || 1)} onClick={() => goToPage(page + 1)}>Next</button>
                </div>
              </>
            )}
          </div>
          )}
        </div>

        {activeTab === 'book' && (
        <div className="space-y-6">
          <form className="card grid gap-4" onSubmit={handleSubmitBooking(bookAppointment)}>
            <div>
              <h2 className="section-title">Book Appointment</h2>
              <p className="section-copy">Select a doctor, choose a date and time slot, and submit symptoms for the visit.</p>
            </div>
            {bookingError && <p className="error-banner">{bookingError}</p>}

            <div>
              <select
                className="input"
                {...registerBooking('doctorId', {
                  required: 'Please select a doctor',
                  onChange: (event) => {
                    const nextDoctorId = event.target.value;
                    setSelectedDoctorId(nextDoctorId);
                    setBookingValue('timeSlot', '');
                    loadAvailableSlots(nextDoctorId, selectedBookingDate);
                  },
                })}
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.user?.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              {bookingErrors.doctorId && <p className="mt-1 text-xs text-rose-500">{bookingErrors.doctorId.message}</p>}
            </div>
            <div>
              <input
                type="date"
                className="input"
                {...registerBooking('date', {
                  required: 'Appointment date is required',
                  onChange: (event) => {
                    const nextDate = event.target.value;
                    setSelectedBookingDate(nextDate);
                    setBookingValue('timeSlot', '');
                    loadAvailableSlots(selectedDoctorId, nextDate);
                  },
                })}
              />
              {bookingErrors.date && <p className="mt-1 text-xs text-rose-500">{bookingErrors.date.message}</p>}
            </div>
            <div>
              <select className="input" {...registerBooking('timeSlot', { required: 'Time slot is required' })}>
                <option value="">{slotsLoading ? 'Loading slots...' : 'Select Time Slot'}</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {bookingErrors.timeSlot && <p className="mt-1 text-xs text-rose-500">{bookingErrors.timeSlot.message}</p>}
              {!slotsLoading && selectedDoctorId && selectedBookingDate && !availableSlots.length && (
                <p className="mt-1 text-xs text-slate-500">No slots available for the selected doctor on this date.</p>
              )}
            </div>
            <div>
              <textarea className="input min-h-24" placeholder="Symptoms or notes" {...registerBooking('symptoms')} />
            </div>
            <button className="btn-primary w-full md:w-fit">Confirm Appointment</button>
          </form>
        </div>
        )}

        {activeTab === 'appointments' && (
        <div className="xl:col-span-2">
          <div className="space-y-6">
          {!simpleMode && (
            <ChartCard
              title="Visit History Trend"
              description="Last 7 days of your appointment activity."
              loading={chartLoading}
              empty={!patientChartStats.visitHistory?.some((item) => item.count)}
            >
              <AppointmentsLineChart data={patientChartStats.visitHistory} />
            </ChartCard>
          )}
          <div className="card">
            <div>
              <h2 className="section-title">Appointment History</h2>
              <p className="section-copy">Review your booking history and cancel pending appointments when needed.</p>
            </div>
            {appointmentsError && <p className="error-banner mt-4">{appointmentsError}</p>}
            {!appointments.length ? (
              <div className="mt-5">
                <EmptyState title="No appointments yet" description="Book your first appointment using the form above." />
              </div>
            ) : (
              <div className="table-shell mt-5">
                <div className="max-h-[520px] overflow-y-auto">
                  <div className="divide-y divide-slate-100">
                {appointments.map((appointment) => (
                  <article key={appointment._id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">{appointment.doctor?.user?.name}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeMap[appointment.status] || 'bg-slate-100 text-slate-600'}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="record-grid">
                          <div className="record-meta">
                            <p className="record-label">Visit Slot</p>
                            <p className="record-value">{formatDate(appointment.date)} at {appointment.timeSlot}</p>
                          </div>
                          <div className="record-meta">
                            <p className="record-label">Department / Specialization</p>
                            <p className="record-value">{appointment.doctor?.department?.name || appointment.doctor?.specialization}</p>
                          </div>
                          <div className="record-meta">
                            <p className="record-label">Billing</p>
                            <p className="record-value">Rs. {appointment.amount ?? 0}</p>
                            <p className="record-subvalue uppercase">{appointment.paymentStatus || 'unpaid'}{appointment.paymentMethod ? ` • ${appointment.paymentMethod}` : ''}</p>
                          </div>
                        </div>
                      </div>
                      {appointment.status === 'pending' && (
                        <div className="grid w-full gap-2 sm:flex sm:w-auto">
                          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => openReschedule(appointment)}>
                            Reschedule
                          </button>
                          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => cancelAppointment(appointment._id)}>
                            Cancel Appointment
                          </button>
                          {appointment.paymentStatus !== 'paid' && (
                            <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => openPaymentModal(appointment)}>
                              Pay Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {appointment.rescheduleHistory?.length > 0 && (
                      <p className="mt-3 text-xs text-slate-500">Rescheduled {appointment.rescheduleHistory.length} time(s)</p>
                    )}
                  </article>
                ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
        )}

        {activeTab === 'prescriptions' && (
        <div className="xl:col-span-2">
          <div className="card">
            <div>
              <h2 className="section-title">Prescriptions</h2>
              <p className="section-copy">Review medicines, diagnosis notes, and doctor advice from your completed visits.</p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
              <input
                className="input"
                placeholder="Search doctor name, diagnosis, or advice"
                value={prescriptionSearch}
                onChange={(event) => setPrescriptionSearch(event.target.value)}
              />
              <select className="input" value={prescriptionReportTypeFilter} onChange={(event) => setPrescriptionReportTypeFilter(event.target.value)}>
                <option value="all">All Report Types</option>
                <option value="lab">Lab</option>
                <option value="xray">X-Ray</option>
                <option value="mri">MRI</option>
                <option value="prescription">Prescription</option>
                <option value="other">Other</option>
              </select>
            </div>
            {!filteredPrescriptions.length ? (
              <div className="mt-5">
                <EmptyState title="No prescriptions yet" description="Prescriptions will appear here after your doctor adds them." />
              </div>
            ) : (
              <div className="table-shell mt-5">
                <div className="max-h-[520px] overflow-y-auto">
                  <div className="divide-y divide-slate-100">
                {filteredPrescriptions.map((item) => (
                  <article key={item._id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs uppercase tracking-[0.25em] text-brand-500">{formatDate(item.createdAt)}</p>
                      <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => handlePrintPrescription(item)}>
                        Print Prescription
                      </button>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      Dr. {item.doctor?.user?.name || item.doctor?.name || 'Assigned Doctor'}
                    </h3>
                    <div className="record-grid">
                      <div className="record-meta">
                        <p className="record-label">Specialization</p>
                        <p className="record-value">{item.doctor?.specialization || 'General Consultation'}</p>
                      </div>
                      <div className="record-meta">
                        <p className="record-label">Appointment</p>
                        <p className="record-value">
                          {item.appointment?.date ? `${formatDate(item.appointment.date)} at ${item.appointment?.timeSlot || ''}` : 'Linked appointment'}
                        </p>
                      </div>
                      <div className="record-meta">
                        <p className="record-label">Status</p>
                        <p className="record-value capitalize">{item.appointment?.status || 'completed'}</p>
                      </div>
                      <div className="record-meta sm:col-span-2 2xl:col-span-4">
                        <p className="record-label">Diagnosis</p>
                        <p className="record-value">{item.diagnosis}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
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
                      <p className="record-value">{item.advice || 'Follow doctor instructions.'}</p>
                    </div>
                    <ReportAttachmentList
                      reports={item.reports || []}
                      onPreview={setPreviewReport}
                      title="Attached Reports"
                      emptyMessage="No report is attached to this prescription yet."
                    />
                  </article>
                ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {activeTab === 'reports' && (
        <div className="xl:col-span-2 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
          <form className="card space-y-4" onSubmit={uploadReport}>
            <div>
              <h2 className="section-title">Upload Medical Report</h2>
              <p className="section-copy">Upload PDF scans or image reports and keep them attached to the correct appointment.</p>
            </div>
            {reportsError && <p className="error-banner">{reportsError}</p>}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Appointment</label>
              <select
                className="input"
                value={reportForm.appointmentId}
                onChange={(event) => setReportForm((current) => ({ ...current, appointmentId: event.target.value }))}
              >
                <option value="">Select Appointment</option>
                {appointments.filter((item) => item.status !== 'cancelled').map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>
                    {appointment.doctor?.user?.name} - {formatDate(appointment.date)} - {appointment.timeSlot}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Report Title</label>
              <input
                className="input"
                placeholder="CBC Report, MRI Scan, Blood Sugar Summary..."
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
              <label className="mb-1 block text-sm font-semibold text-slate-700">Description / Tags</label>
              <textarea
                className="input min-h-24"
                placeholder="Short note about the file, key findings, or internal tag..."
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
            <button className="btn-primary w-full sm:w-auto" disabled={uploadingReport}>
              {uploadingReport ? 'Uploading...' : 'Upload Report'}
            </button>
          </form>

          <div className="card">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="section-title">Report History</h2>
                <p className="section-copy">Preview or download the reports linked to your care journey.</p>
              </div>
              <span className="data-chip">{reports.length}</span>
            </div>

            {!reports.length ? (
              <div className="mt-5">
                <EmptyState title="No reports uploaded yet" description="Upload your first report to share documents with your doctor." />
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
        </div>

      {rescheduleModal.open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="card w-full max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="section-title">Reschedule Appointment</h3>
                <p className="section-copy">Choose a new date and slot for your appointment.</p>
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
                    loadPatientRescheduleSlots(rescheduleModal.appointment, nextDate);
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

      {paymentModal.open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="section-title">Pay Appointment Fee</h3>
                <p className="section-copy">{paymentModal.appointment?.doctor?.user?.name}</p>
              </div>
              <button type="button" className="btn-secondary" onClick={closePaymentModal}>Close</button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Amount: Rs. {paymentModal.appointment?.amount ?? 0}</p>
                <p className="mt-1">Status: {paymentModal.appointment?.paymentStatus || 'unpaid'}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Payment Method</label>
                <select className="input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <button type="button" className="btn-primary w-full sm:w-auto" onClick={submitPayment}>
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportPreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
    </DashboardLayout>
  );
};

export default PatientPanelPage;
