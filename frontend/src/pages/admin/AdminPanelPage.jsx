import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import ChartCard from '../../components/charts/ChartCard';
import { AppointmentStatusPieChart, AppointmentsLineChart } from '../../components/charts/DashboardCharts';
import ReportCard from '../../components/reports/ReportCard';
import ReportPreviewModal from '../../components/reports/ReportPreviewModal';
import api from '../../api/axios';
import { printInvoiceDocument, printReportSummaryDocument } from '../../lib/printDocuments';
import { defaultSchedule, weekDayOptions } from '../../lib/schedule';
import { useAuth } from '../../context/AuthContext';

const AdminPanelPage = () => {
  const { user } = useAuth();
  const {
    register: registerDoctor,
    handleSubmit: handleSubmitDoctor,
    reset: resetDoctor,
    formState: { errors: doctorErrors },
  } = useForm();
  const {
    register: registerDepartment,
    handleSubmit: handleSubmitDepartment,
    reset: resetDepartment,
    formState: { errors: departmentErrors },
  } = useForm();
  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    reset: resetAdmin,
    formState: { errors: adminErrors },
  } = useForm({
    defaultValues: {
      adminType: 'admin',
    },
  });

  const [loading, setLoading] = useState(true);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [adminChartStats, setAdminChartStats] = useState({ appointmentsPerDay: [], appointmentStatus: [] });
  const [statsLoading, setStatsLoading] = useState(true);
  const [panelError, setPanelError] = useState('');
  const [doctorFormError, setDoctorFormError] = useState('');
  const [departmentFormError, setDepartmentFormError] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [adminFormError, setAdminFormError] = useState('');
  const [adminActionError, setAdminActionError] = useState('');
  const [reportsError, setReportsError] = useState('');
  const [auditError, setAuditError] = useState('');
  const [paymentModal, setPaymentModal] = useState({ open: false, appointment: null });
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [previewReport, setPreviewReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportFilter, setReportFilter] = useState('all');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [reportSearch, setReportSearch] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [reportUploaderFilter, setReportUploaderFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditDateFilter, setAuditDateFilter] = useState('');
  const doctorFormRef = useRef(null);
  const isSuperAdmin = user?.adminType === 'super_admin';

  const loadData = async () => {
    try {
      setPanelError('');
      setStatsLoading(true);
      const requests = [
        api.get('/admin/dashboard'),
        api.get('/admin/doctors'),
        api.get('/admin/doctors/pending'),
        api.get('/admin/patients'),
        api.get('/admin/appointments'),
        api.get('/departments'),
        api.get('/reports?includeDeleted=true'),
        api.get('/admin/audit-logs?limit=40'),
        api.get('/stats/admin'),
      ];

      if (isSuperAdmin) {
        requests.push(api.get('/admin/admins'));
      }

      const [
        dashboardResponse,
        doctorsResponse,
        pendingDoctorsResponse,
        patientsResponse,
        appointmentsResponse,
        departmentsResponse,
        reportsResponse,
        auditLogsResponse,
        statsResponse,
        adminsResponse,
      ] = await Promise.all(requests);

      setDashboardStats(dashboardResponse.data.data?.stats || null);
      setDoctors(doctorsResponse.data.data);
      setPendingDoctors(pendingDoctorsResponse.data.data);
      setPatients(patientsResponse.data.data);
      setAppointments(appointmentsResponse.data.data);
      setDepartments(departmentsResponse.data.data);
      setReports(reportsResponse.data.data);
      setAuditLogs(auditLogsResponse.data.data || []);
      setAdminChartStats(statsResponse.data.data || { appointmentsPerDay: [], appointmentStatus: [] });
      setAdmins(adminsResponse?.data?.data || []);
    } catch (error) {
      setPanelError(error.response?.data?.message || 'Unable to load admin panel data.');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startEdit = (doctor) => {
    setDoctorFormError('');
    setEditingDoctor(doctor);
    setActiveTab('operations');
    resetDoctor({
      name: doctor.user?.name || '',
      email: doctor.user?.email || '',
      password: '',
      phone: doctor.user?.phone || '',
      department: doctor.department?._id || '',
      specialization: doctor.specialization || '',
      qualification: doctor.qualification || '',
      experience: doctor.experience ?? 0,
      consultationFee: doctor.consultationFee ?? 0,
      schedule: {
        workingDays: doctor.schedule?.workingDays || defaultSchedule.workingDays,
        startTime: doctor.schedule?.startTime || defaultSchedule.startTime,
        endTime: doctor.schedule?.endTime || defaultSchedule.endTime,
        slotDuration: doctor.schedule?.slotDuration || defaultSchedule.slotDuration,
      },
      bio: doctor.bio || '',
    });
    setTimeout(() => {
      doctorFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const resetDoctorForm = () => {
    setEditingDoctor(null);
    setDoctorFormError('');
    resetDoctor({
      name: '',
      email: '',
      password: '',
      phone: '',
      department: '',
      specialization: '',
      qualification: '',
      experience: '',
      consultationFee: '',
      schedule: defaultSchedule,
      bio: '',
    });
  };

  const saveDoctor = async (values) => {
    try {
      setDoctorFormError('');
      const payload = {
        ...values,
        experience: Number(values.experience),
        consultationFee: Number(values.consultationFee),
        schedule: {
          ...values.schedule,
          slotDuration: Number(values.schedule.slotDuration),
        },
      };

      if (editingDoctor) {
        await api.put(`/admin/doctors/${editingDoctor._id}`, payload);
        toast.success('Doctor updated successfully.');
      } else {
        await api.post('/admin/doctors', payload);
        toast.success('Doctor added successfully.');
      }

      resetDoctorForm();
      loadData();
    } catch (error) {
      setDoctorFormError(error.response?.data?.message || 'Unable to save doctor details.');
    }
  };

  const createDepartment = async (values) => {
    try {
      setDepartmentFormError('');
      await api.post('/departments', values);
      resetDepartment({ name: '', description: '' });
      toast.success('Department created.');
      loadData();
    } catch (error) {
      setDepartmentFormError(error.response?.data?.message || 'Unable to create department.');
    }
  };

  const deleteDoctor = async (id) => {
    try {
      setApprovalError('');
      await api.delete(`/admin/doctors/${id}`);
      toast.success('Doctor removed.');
      loadData();
    } catch (error) {
      setApprovalError(error.response?.data?.message || 'Unable to delete doctor.');
    }
  };

  const approveDoctor = async (id) => {
    try {
      setApprovalError('');
      await api.patch(`/admin/doctors/${id}/approve`);
      toast.success('Doctor approved successfully.');
      loadData();
    } catch (error) {
      setApprovalError(error.response?.data?.message || 'Unable to approve doctor request.');
    }
  };

  const rejectDoctor = async (id) => {
    try {
      setApprovalError('');
      await api.delete(`/admin/doctors/${id}/reject`);
      toast.success('Doctor registration rejected.');
      loadData();
    } catch (error) {
      setApprovalError(error.response?.data?.message || 'Unable to reject doctor request.');
    }
  };

  const stats = useMemo(() => ({
    doctors: dashboardStats?.doctors ?? doctors.length,
    patients: dashboardStats?.patients ?? patients.length,
    appointments: dashboardStats?.appointments ?? appointments.length,
    departments: dashboardStats?.departments ?? departments.length,
    pendingDoctors: dashboardStats?.pendingDoctors ?? pendingDoctors.length,
    paidAppointments: dashboardStats?.paidAppointments ?? appointments.filter((item) => item.paymentStatus === 'paid').length,
    unpaidAppointments: dashboardStats?.unpaidAppointments ?? appointments.filter((item) => item.paymentStatus !== 'paid').length,
    reports: reports.filter((item) => !item.isDeleted).length,
    archivedReports: reports.filter((item) => item.isDeleted).length,
  }), [appointments, dashboardStats, departments.length, doctors.length, patients.length, pendingDoctors.length, reports]);

  const adminTabs = [
    { id: 'overview', label: 'Overview', helper: 'Live system summary', count: stats.appointments },
    { id: 'operations', label: 'Operations', helper: 'Create doctors and departments', count: stats.departments },
    { id: 'doctors', label: 'Doctors', helper: 'Approvals and doctor roster', count: stats.doctors },
    { id: 'patients', label: 'Patients', helper: 'Registered patient directory', count: stats.patients },
    { id: 'appointments', label: 'Appointments', helper: 'Visits, billing, and payments', count: stats.appointments },
    { id: 'reports', label: 'Reports', helper: 'Patient and doctor file records', count: stats.reports },
    { id: 'archived-reports', label: 'Archived Reports', helper: 'Restore hidden file records', count: stats.archivedReports },
    { id: 'audit', label: 'Audit Logs', helper: 'Critical system activity trail', count: auditLogs.length },
    ...(isSuperAdmin ? [{ id: 'admins', label: 'Admin Control', helper: 'Secure admin management', count: admins.length }] : []),
  ];

  const openPaymentModal = (appointment) => {
    setApprovalError('');
    setPaymentModal({ open: true, appointment });
    setPaymentMethod(appointment.paymentMethod || 'upi');
  };

  const closePaymentModal = () => {
    setPaymentModal({ open: false, appointment: null });
    setPaymentMethod('upi');
  };

  const updatePayment = async (paymentStatus) => {
    if (!paymentModal.appointment?._id) {
      return;
    }

    try {
      setApprovalError('');
      await api.patch(`/admin/appointments/${paymentModal.appointment._id}/payment`, {
        paymentStatus,
        paymentMethod: paymentStatus === 'paid' ? paymentMethod : '',
      });
      toast.success(`Appointment marked as ${paymentStatus}.`);
      closePaymentModal();
      loadData();
    } catch (error) {
      setApprovalError(error.response?.data?.message || 'Unable to update payment.');
    }
  };

  const createAdmin = async (values) => {
    try {
      setAdminFormError('');
      await api.post('/admin/admins', values);
      toast.success('Admin created successfully.');
      resetAdmin({ name: '', email: '', password: '', phone: '', adminType: 'admin' });
      loadData();
    } catch (error) {
      setAdminFormError(error.response?.data?.message || 'Unable to create admin.');
    }
  };

  const toggleAdminActive = async (admin, nextAction) => {
    try {
      setAdminActionError('');
      await api.patch(`/admin/admins/${admin._id}/${nextAction}`);
      toast.success(`Admin ${nextAction === 'activate' ? 'activated' : 'deactivated'} successfully.`);
      loadData();
    } catch (error) {
      setAdminActionError(error.response?.data?.message || `Unable to ${nextAction} admin.`);
    }
  };

  const deleteAdmin = async (adminId) => {
    try {
      setAdminActionError('');
      await api.delete(`/admin/admins/${adminId}`);
      toast.success('Admin removed successfully.');
      loadData();
    } catch (error) {
      setAdminActionError(error.response?.data?.message || 'Unable to remove admin.');
    }
  };

  const deleteReport = async (reportId) => {
    try {
      setReportsError('');
      await api.delete(`/reports/${reportId}`);
      toast.success('Report deleted successfully.');
      loadData();
    } catch (error) {
      setReportsError(error.response?.data?.message || 'Unable to delete report.');
    }
  };

  const restoreReport = async (reportId) => {
    try {
      setReportsError('');
      await api.patch(`/reports/${reportId}/restore`);
      toast.success('Report restored successfully.');
      loadData();
    } catch (error) {
      setReportsError(error.response?.data?.message || 'Unable to restore report.');
    }
  };

  const visibleReports = useMemo(() => {
    if (reportFilter === 'deleted') {
      return reports.filter((item) => item.isDeleted);
    }

    if (reportFilter === 'all') {
      return reports;
    }

    return reports.filter((item) => !item.isDeleted);
  }, [reportFilter, reports]);

  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    if (!query) {
      return doctors;
    }

    return doctors.filter((doctor) =>
      `${doctor.user?.name || ''} ${doctor.user?.email || ''} ${doctor.specialization || ''} ${doctor.department?.name || ''}`
        .toLowerCase()
        .includes(query)
    );
  }, [doctorSearch, doctors]);

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) {
      return patients;
    }

    return patients.filter((patient) =>
      `${patient.user?.name || ''} ${patient.user?.email || ''} ${patient.user?.phone || ''} ${patient._id || ''}`
        .toLowerCase()
        .includes(query)
    );
  }, [patientSearch, patients]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesStatus = appointmentStatusFilter === 'all' || appointment.status === appointmentStatusFilter;
      const query = appointmentSearch.trim().toLowerCase();
      const matchesSearch = !query || `${appointment.patient?.user?.name || ''} ${appointment.doctor?.user?.name || ''} ${appointment.doctor?.department?.name || ''} ${appointment.timeSlot || ''}`
        .toLowerCase()
        .includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [appointments, appointmentSearch, appointmentStatusFilter]);

  const filteredVisibleReports = useMemo(() => {
    return visibleReports.filter((report) => {
      const query = reportSearch.trim().toLowerCase();
      const matchesSearch = !query || `${report.title || ''} ${report.description || ''} ${report.patientId?.user?.name || ''} ${report.doctorId?.user?.name || ''}`
        .toLowerCase()
        .includes(query);
      const matchesType = reportTypeFilter === 'all' || report.type === reportTypeFilter;
      const matchesUploader = reportUploaderFilter === 'all' || report.uploadedBy === reportUploaderFilter;
      return matchesSearch && matchesType && matchesUploader;
    });
  }, [visibleReports, reportSearch, reportTypeFilter, reportUploaderFilter]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const query = auditSearch.trim().toLowerCase();
      const matchesSearch = !query || `${log.message || ''} ${log.actor?.name || ''} ${log.actor?.email || ''} ${log.action || ''}`
        .toLowerCase()
        .includes(query);
      const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
      const matchesDate = !auditDateFilter || new Date(log.createdAt).toISOString().slice(0, 10) === auditDateFilter;
      return matchesSearch && matchesAction && matchesDate;
    });
  }, [auditActionFilter, auditDateFilter, auditLogs, auditSearch]);

  const adminNotifications = useMemo(() => ([
    stats.pendingDoctors ? { label: `${stats.pendingDoctors} doctor approval request(s) waiting`, tone: 'warning' } : null,
    stats.unpaidAppointments ? { label: `${stats.unpaidAppointments} unpaid appointment(s) need billing follow-up`, tone: 'accent' } : null,
    stats.archivedReports ? { label: `${stats.archivedReports} archived report(s) available to restore`, tone: 'dark' } : null,
    auditLogs[0] ? { label: `Latest activity: ${auditLogs[0].message}`, tone: 'neutral' } : null,
  ].filter(Boolean)), [auditLogs, stats.archivedReports, stats.pendingDoctors, stats.unpaidAppointments]);

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <DashboardLayout
      title="Admin Panel"
      description="Manage doctor records, departments, patient visibility, and doctor approval requests from one reliable control center."
      sidebarSections={adminTabs}
      activeSection={activeTab}
      onSectionChange={setActiveTab}
    >
      {panelError && <div className="error-banner">{panelError}</div>}

        <div className="panel-content-shell">
      <section className="grid min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3">
        <StatCard title="Doctors" value={stats.doctors} />
        <StatCard title="Patients" value={stats.patients} tone="dark" />
        <StatCard title="Appointments" value={stats.appointments} tone="accent" />
        <StatCard title="Departments" value={stats.departments} />
        <StatCard title="Pending Approvals" value={stats.pendingDoctors} tone="dark" />
        <StatCard title="Reports" value={stats.reports} tone="accent" />
        <StatCard title="Archived Reports" value={stats.archivedReports} tone="dark" />
      </section>

      {activeTab === 'operations' && (
      <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.75fr]">
        <form ref={doctorFormRef} className="card grid gap-4 md:grid-cols-2" onSubmit={handleSubmitDoctor(saveDoctor)}>
          <div className="md:col-span-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="section-title">{editingDoctor ? 'Edit Doctor' : 'Add Doctor'}</h2>
              <p className="section-copy">
                {editingDoctor
                  ? `Updating ${editingDoctor.user?.name}. Save changes to refresh the doctor roster immediately.`
                  : 'Create approved doctor accounts with department, specialization, consultation details, and visible availability.'}
              </p>
            </div>
            {editingDoctor && <button type="button" className="btn-secondary" onClick={resetDoctorForm}>Cancel Edit</button>}
          </div>
          {doctorFormError && <p className="error-banner md:col-span-2">{doctorFormError}</p>}

          <div>
            <input className="input" placeholder="Full Name" {...registerDoctor('name', { required: 'Doctor name is required' })} />
            {doctorErrors.name && <p className="mt-1 text-xs text-rose-500">{doctorErrors.name.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Email" disabled={Boolean(editingDoctor)} {...registerDoctor('email', { required: !editingDoctor ? 'Email is required' : false })} />
            {doctorErrors.email && <p className="mt-1 text-xs text-rose-500">{doctorErrors.email.message}</p>}
          </div>
          {!editingDoctor && (
            <div>
              <input type="password" className="input" placeholder="Password" {...registerDoctor('password', { required: 'Password is required' })} />
              {doctorErrors.password && <p className="mt-1 text-xs text-rose-500">{doctorErrors.password.message}</p>}
            </div>
          )}
          <div>
            <input className="input" placeholder="Phone" {...registerDoctor('phone', { required: 'Phone is required' })} />
            {doctorErrors.phone && <p className="mt-1 text-xs text-rose-500">{doctorErrors.phone.message}</p>}
          </div>
          <div>
            <select className="input" {...registerDoctor('department', { required: 'Department is required' })}>
              <option value="">Select Department</option>
              {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
            {doctorErrors.department && <p className="mt-1 text-xs text-rose-500">{doctorErrors.department.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Specialization" {...registerDoctor('specialization', { required: 'Specialization is required' })} />
            {doctorErrors.specialization && <p className="mt-1 text-xs text-rose-500">{doctorErrors.specialization.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Qualification" {...registerDoctor('qualification', { required: 'Qualification is required' })} />
            {doctorErrors.qualification && <p className="mt-1 text-xs text-rose-500">{doctorErrors.qualification.message}</p>}
          </div>
          <div>
            <input type="number" className="input" placeholder="Experience" {...registerDoctor('experience', { required: 'Experience is required', min: { value: 0, message: 'Experience cannot be negative' } })} />
            {doctorErrors.experience && <p className="mt-1 text-xs text-rose-500">{doctorErrors.experience.message}</p>}
          </div>
          <div>
            <input type="number" className="input" placeholder="Consultation Fee" {...registerDoctor('consultationFee', { required: 'Consultation fee is required', min: { value: 0, message: 'Fee cannot be negative' } })} />
            {doctorErrors.consultationFee && <p className="mt-1 text-xs text-rose-500">{doctorErrors.consultationFee.message}</p>}
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-700">Working Days</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {weekDayOptions.map((day) => (
                <label key={day.value} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <input type="checkbox" value={day.value} {...registerDoctor('schedule.workingDays', { required: 'At least one working day is required' })} />
                  {day.label}
                </label>
              ))}
            </div>
            {doctorErrors.schedule?.workingDays && <p className="mt-1 text-xs text-rose-500">{doctorErrors.schedule.workingDays.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Start Time</label>
            <input type="time" className="input" {...registerDoctor('schedule.startTime', { required: 'Start time is required' })} />
            {doctorErrors.schedule?.startTime && <p className="mt-1 text-xs text-rose-500">{doctorErrors.schedule.startTime.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">End Time</label>
            <input type="time" className="input" {...registerDoctor('schedule.endTime', { required: 'End time is required' })} />
            {doctorErrors.schedule?.endTime && <p className="mt-1 text-xs text-rose-500">{doctorErrors.schedule.endTime.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Slot Duration (minutes)</label>
            <input type="number" className="input" {...registerDoctor('schedule.slotDuration', { required: 'Slot duration is required', min: { value: 5, message: 'Minimum duration is 5 minutes' } })} />
            {doctorErrors.schedule?.slotDuration && <p className="mt-1 text-xs text-rose-500">{doctorErrors.schedule.slotDuration.message}</p>}
          </div>
          <div>
            <textarea className="input min-h-24" placeholder="Bio" {...registerDoctor('bio', { required: 'Bio is required' })} />
            {doctorErrors.bio && <p className="mt-1 text-xs text-rose-500">{doctorErrors.bio.message}</p>}
          </div>
          <button className="btn-primary w-full sm:w-auto">{editingDoctor ? 'Update Doctor' : 'Create Doctor'}</button>
        </form>

        <form className="card space-y-4" onSubmit={handleSubmitDepartment(createDepartment)}>
          <div>
            <h2 className="section-title">Add Department</h2>
            <p className="section-copy">Set up hospital departments so doctors, searches, and patient-facing listings stay organized.</p>
          </div>
          {departmentFormError && <p className="error-banner">{departmentFormError}</p>}
          <div>
            <input className="input" placeholder="Department Name" {...registerDepartment('name', { required: 'Department name is required' })} />
            {departmentErrors.name && <p className="mt-1 text-xs text-rose-500">{departmentErrors.name.message}</p>}
          </div>
          <div>
            <textarea className="input min-h-24" placeholder="Description" {...registerDepartment('description', { required: 'Description is required' })} />
            {departmentErrors.description && <p className="mt-1 text-xs text-rose-500">{departmentErrors.description.message}</p>}
          </div>
          <button className="btn-primary w-full sm:w-auto">Create Department</button>
        </form>
      </section>
      )}

      {activeTab === 'overview' && (
      <section className="workspace-grid">
        <div className="workspace-main">
          <div className="grid gap-6">
          <div className="card">
            <div>
              <h2 className="section-title">System Snapshot</h2>
              <p className="section-copy">Quick visibility into approvals, appointments, and operational health.</p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="insight-card">
                <p className="insight-label">Pending Approvals</p>
                <p className="insight-value">{stats.pendingDoctors}</p>
                <p className="mt-2 text-sm text-slate-500">Doctor registrations waiting for review.</p>
              </div>
              <div className="insight-card">
                <p className="insight-label">Paid Appointments</p>
                <p className="insight-value">{stats.paidAppointments}</p>
                <p className="mt-2 text-sm text-slate-500">Visits already closed from the billing side.</p>
              </div>
              <div className="insight-card">
                <p className="insight-label">Unpaid Appointments</p>
                <p className="insight-value">{stats.unpaidAppointments}</p>
                <p className="mt-2 text-sm text-slate-500">Appointments still waiting for payment updates.</p>
              </div>
              <div className="insight-card">
                <p className="insight-label">Departments</p>
                <p className="insight-value">{stats.departments}</p>
                <p className="mt-2 text-sm text-slate-500">Departments available to doctors and patients.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard
              title="Appointments Per Day"
              description="Last 7 days of appointment volume across the hospital."
              loading={statsLoading}
              empty={!adminChartStats.appointmentsPerDay?.some((item) => item.count)}
            >
              <AppointmentsLineChart data={adminChartStats.appointmentsPerDay} />
            </ChartCard>
            <ChartCard
              title="Appointment Status Split"
              description="Current distribution of pending, completed, and cancelled appointments."
              loading={statsLoading}
              empty={!adminChartStats.appointmentStatus?.some((item) => item.value)}
            >
              <AppointmentStatusPieChart data={adminChartStats.appointmentStatus} />
            </ChartCard>
          </div>
          </div>
        </div>

        <aside className="workspace-side">
          <div className="card">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="section-title">Action Center</h2>
                <p className="section-copy">Mock operational notifications so admins can react quickly on mobile and desktop.</p>
              </div>
              <span className="data-chip">{adminNotifications.length}</span>
            </div>
            <div className="mt-5 space-y-3">
              {!adminNotifications.length ? (
                <p className="text-sm text-slate-500">No urgent admin notifications right now.</p>
              ) : (
                adminNotifications.map((item) => (
                  <div key={item.label} className={`notification-card ${item.tone === 'warning' ? 'notification-warning' : item.tone === 'accent' ? 'notification-accent' : item.tone === 'dark' ? 'notification-dark' : ''}`}>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="section-title">Recent Patient Snapshot</h2>
                <p className="section-copy">Compact patient list with scroll for quick scanning.</p>
              </div>
              <span className="data-chip">{patients.length}</span>
            </div>
            <div className="table-shell mt-5">
              <div className="max-h-[420px] overflow-y-auto">
                {!patients.length ? (
                  <p className="p-4 text-sm text-slate-500">No patients registered yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {patients.map((patient) => (
                      <article key={patient._id} className="grid gap-2 px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{patient.user?.name}</p>
                            <p className="mt-1 truncate text-sm text-slate-500">{patient.user?.email}</p>
                          </div>
                          <span className="data-chip shrink-0">{patient._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="data-chip">{patient.user?.phone || 'Phone pending'}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </section>
      )}

      {isSuperAdmin && activeTab === 'admins' && (
        <section className="grid gap-6 2xl:grid-cols-[0.85fr_1.15fr]">
          <form className="card grid gap-4 md:grid-cols-2" onSubmit={handleSubmitAdmin(createAdmin)}>
            <div className="md:col-span-2">
              <h2 className="section-title">Admin Management</h2>
              <p className="section-copy">Create controlled admin accounts. Only super admin can access this section.</p>
            </div>
            {adminFormError && <p className="error-banner md:col-span-2">{adminFormError}</p>}
            <div>
              <input className="input" placeholder="Admin Name" {...registerAdmin('name', { required: 'Admin name is required' })} />
              {adminErrors.name && <p className="mt-1 text-xs text-rose-500">{adminErrors.name.message}</p>}
            </div>
            <div>
              <input className="input" placeholder="Admin Email" {...registerAdmin('email', { required: 'Admin email is required' })} />
              {adminErrors.email && <p className="mt-1 text-xs text-rose-500">{adminErrors.email.message}</p>}
            </div>
            <div>
              <input type="password" className="input" placeholder="Password" {...registerAdmin('password', { required: 'Password is required' })} />
              {adminErrors.password && <p className="mt-1 text-xs text-rose-500">{adminErrors.password.message}</p>}
            </div>
            <div>
              <input className="input" placeholder="Phone" {...registerAdmin('phone')} />
            </div>
            <div>
              <select className="input" {...registerAdmin('adminType', { required: 'Admin type is required' })}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button className="btn-primary w-full sm:w-auto md:col-span-2">Create Admin</button>
          </form>

          <div className="card">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="section-title">System Admins</h2>
                <p className="section-copy">Securely manage admin access, activation state, and super admin coverage.</p>
              </div>
              <p className="text-sm font-semibold text-slate-500">{admins.length} admins</p>
            </div>
            {adminActionError && <p className="error-banner mt-4">{adminActionError}</p>}
            <div className="table-shell mt-5 overflow-x-auto">
              {!admins.length ? (
                <p className="p-4 text-sm text-slate-500">No admins found.</p>
              ) : (
                <table className="min-w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="table-cell">Admin</th>
                      <th className="table-cell">Type</th>
                      <th className="table-cell">Status</th>
                      <th className="table-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin._id} className="border-t border-slate-100">
                        <td className="table-cell">
                          <p className="font-semibold text-slate-900">{admin.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{admin.email}</p>
                        </td>
                        <td className="table-cell">
                          <span className={`data-chip ${admin.adminType === 'super_admin' ? '!bg-slate-950 !text-white' : ''}`}>
                            {admin.adminType === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`data-chip ${admin.isActive ? '!bg-emerald-100 !text-emerald-700' : '!bg-rose-100 !text-rose-700'}`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-wrap gap-2">
                            {admin.isActive ? (
                              <button type="button" className="btn-secondary" onClick={() => toggleAdminActive(admin, 'deactivate')}>
                                Deactivate
                              </button>
                            ) : (
                              <button type="button" className="btn-secondary" onClick={() => toggleAdminActive(admin, 'activate')}>
                                Activate
                              </button>
                            )}
                            <button type="button" className="btn-secondary" onClick={() => deleteAdmin(admin._id)}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'doctors' && (
      <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <div>
            <h2 className="section-title">Pending Doctor Approvals</h2>
            <p className="section-copy">Review doctor applications, approve the ones ready for practice, and reject incomplete requests.</p>
          </div>
          {approvalError && <p className="error-banner mt-4">{approvalError}</p>}
          <div className="mt-5 grid max-h-[620px] gap-4 overflow-y-auto pr-1 xl:grid-cols-2">
            {!pendingDoctors.length ? (
              <p className="text-sm text-slate-500">No pending doctor registrations.</p>
            ) : (
              pendingDoctors.map((doctor) => (
                <div key={doctor._id} className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{doctor.user?.name}</p>
                    <span className="data-chip">{doctor.department?.name || 'No department'}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{doctor.user?.email}</p>
                  <p className="mt-2 text-sm text-slate-600">{doctor.specialization}</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => approveDoctor(doctor._id)}>Approve</button>
                    <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => rejectDoctor(doctor._id)}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="section-title">Doctor Roster</h2>
              <p className="section-copy">Edit or remove doctor records without losing visibility on their department, fees, and live availability.</p>
            </div>
            <p className="text-sm font-semibold text-slate-500">{filteredDoctors.length} visible doctors</p>
          </div>
          <div className="mt-5">
            <input
              className="input"
              placeholder="Search doctor by name, email, specialization, or department"
              value={doctorSearch}
              onChange={(event) => setDoctorSearch(event.target.value)}
            />
          </div>
          <div className="mobile-card-list mt-5">
            {filteredDoctors.map((doctor) => (
              <article key={doctor._id} className="mobile-card">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{doctor.user?.name}</p>
                  <span className="data-chip">{doctor.department?.name || 'Unassigned'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{doctor.user?.email}</p>
                <p className="mt-2 text-sm text-slate-600">{doctor.specialization}</p>
                <p className="mt-2 text-sm text-slate-600">Rs. {doctor.consultationFee ?? 0} | {doctor.experience ?? 0} years</p>
                <p className="mt-2 text-sm text-slate-600">{doctor.scheduleSummary || 'No schedule added'}</p>
                <div className="mt-4 grid gap-2">
                  <button type="button" className="btn-secondary w-full" onClick={() => startEdit(doctor)}>Edit</button>
                  <button type="button" className="btn-secondary w-full" onClick={() => deleteDoctor(doctor._id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
          <div className="table-shell mt-5 hidden md:block">
            <div className="scroll-panel overflow-x-auto">
            {!filteredDoctors.length ? (
              <p className="p-4 text-sm text-slate-500">No doctors found yet.</p>
            ) : (
              <table className="min-w-full">
                <thead className="table-head">
                  <tr>
                    <th className="table-cell">Doctor</th>
                    <th className="table-cell">Department</th>
                    <th className="table-cell">Consultation</th>
                    <th className="table-cell">Availability</th>
                    <th className="table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor._id} className="border-t border-slate-100">
                      <td className="table-cell">
                        <p className="font-semibold text-slate-900">{doctor.user?.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{doctor.user?.email}</p>
                        <p className="mt-1 text-xs text-slate-500">{doctor.specialization}</p>
                      </td>
                      <td className="table-cell">
                        <span className="data-chip">{doctor.department?.name || 'Unassigned'}</span>
                      </td>
                      <td className="table-cell">
                        <p className="font-semibold text-slate-900">Rs. {doctor.consultationFee ?? 0}</p>
                        <p className="mt-1 text-xs text-slate-500">{doctor.experience ?? 0} years experience</p>
                      </td>
                      <td className="table-cell">
                        <p className="line-clamp-2 max-w-xs text-sm text-slate-600">{doctor.scheduleSummary || 'No schedule added'}</p>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn-secondary" onClick={() => startEdit(doctor)}>Edit</button>
                          <button type="button" className="btn-secondary" onClick={() => deleteDoctor(doctor._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </div>
      </section>
      )}

      {activeTab === 'patients' && (
      <section className="grid gap-6">
        <div className="card">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="section-title">Patients</h2>
              <p className="section-copy">Monitor registered patients without scrolling through oversized cards.</p>
            </div>
            <p className="text-sm font-semibold text-slate-500">{filteredPatients.length} visible patients</p>
          </div>
          <div className="mt-5">
            <input
              className="input"
              placeholder="Search patient by name, email, phone, or patient id"
              value={patientSearch}
              onChange={(event) => setPatientSearch(event.target.value)}
            />
          </div>
          <div className="mobile-card-list mt-5">
            {filteredPatients.map((patient) => (
              <article key={patient._id} className="mobile-card">
                <p className="font-semibold text-slate-900">{patient.user?.name}</p>
                <p className="mt-1 text-sm text-slate-500">{patient.user?.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="data-chip">{patient.user?.phone || 'Not added'}</span>
                  <span className="data-chip">{patient._id.slice(-6).toUpperCase()}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="table-shell mt-5 hidden md:block">
            <div className="scroll-panel overflow-x-auto">
            {!filteredPatients.length ? (
              <p className="p-4 text-sm text-slate-500">No patients found yet.</p>
            ) : (
              <table className="min-w-full">
                <thead className="table-head">
                  <tr>
                    <th className="table-cell">Patient</th>
                    <th className="table-cell">Phone</th>
                    <th className="table-cell">Patient ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient._id} className="border-t border-slate-100">
                      <td className="table-cell">
                        <p className="font-semibold text-slate-900">{patient.user?.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{patient.user?.email}</p>
                      </td>
                      <td className="table-cell">{patient.user?.phone || 'Not added'}</td>
                      <td className="table-cell">
                        <span className="data-chip">{patient._id.slice(-6).toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </div>
      </section>
      )}

      {activeTab === 'appointments' && (
      <section className="grid gap-6">
        <div className="card">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="section-title">Recent Appointments</h2>
              <p className="section-copy">Keep track of which patient booked with which doctor, together with department and current status.</p>
            </div>
            <p className="text-sm font-semibold text-slate-500">{filteredAppointments.length} visible appointments</p>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <input
              className="input"
              placeholder="Search patient, doctor, department, or slot"
              value={appointmentSearch}
              onChange={(event) => setAppointmentSearch(event.target.value)}
            />
            <select className="input" value={appointmentStatusFilter} onChange={(event) => setAppointmentStatusFilter(event.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="mobile-card-list mt-5">
            {filteredAppointments.slice(0, 12).map((appointment) => (
              <article key={appointment._id} className="mobile-card">
                <p className="font-semibold text-slate-900">{appointment.patient?.user?.name || 'Patient'}</p>
                <p className="mt-1 text-sm text-slate-500">{appointment.doctor?.user?.name || 'Doctor'}</p>
                <p className="mt-2 text-sm text-slate-600">{new Date(appointment.date).toLocaleDateString()} at {appointment.timeSlot}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="data-chip">{appointment.doctor?.department?.name || appointment.doctor?.specialization || 'No department'}</span>
                  <span className="data-chip capitalize">{appointment.status}</span>
                  <span className="data-chip">Rs. {appointment.amount ?? 0}</span>
                  <span className={`data-chip ${appointment.paymentStatus === 'paid' ? '!bg-emerald-100 !text-emerald-700' : '!bg-amber-100 !text-amber-700'}`}>
                    {appointment.paymentStatus || 'unpaid'}
                  </span>
                </div>
                <button type="button" className="btn-secondary mt-4 w-full" onClick={() => openPaymentModal(appointment)}>
                  Manage Payment
                </button>
                <button type="button" className="btn-secondary mt-2 w-full" onClick={() => printInvoiceDocument(appointment)}>
                  Print Invoice
                </button>
              </article>
            ))}
          </div>
          <div className="table-shell mt-5 hidden md:block">
            <div className="scroll-panel overflow-x-auto">
            {!filteredAppointments.length ? (
              <p className="p-4 text-sm text-slate-500">No appointments found yet.</p>
            ) : (
              <table className="min-w-full">
                <thead className="table-head">
                  <tr>
                    <th className="table-cell">Patient</th>
                    <th className="table-cell">Doctor</th>
                    <th className="table-cell">Visit</th>
                    <th className="table-cell">Status</th>
                    <th className="table-cell">Billing</th>
                    <th className="table-cell">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id} className="border-t border-slate-100">
                      <td className="table-cell">
                        <p className="font-semibold text-slate-900">{appointment.patient?.user?.name || 'Patient'}</p>
                        <p className="mt-1 text-xs text-slate-500">{appointment.patient?.user?.email || 'No email'}</p>
                      </td>
                      <td className="table-cell">
                        <p className="font-semibold text-slate-900">{appointment.doctor?.user?.name || 'Doctor'}</p>
                        <p className="mt-1 text-xs text-slate-500">{appointment.doctor?.department?.name || appointment.doctor?.specialization || 'No department'}</p>
                      </td>
                      <td className="table-cell">
                        <p className="font-semibold text-slate-900">{new Date(appointment.date).toLocaleDateString()}</p>
                        <p className="mt-1 text-xs text-slate-500">{appointment.timeSlot}</p>
                      </td>
                      <td className="table-cell">
                        <span className="data-chip capitalize">{appointment.status}</span>
                      </td>
                      <td className="table-cell">
                        <p className="font-semibold text-slate-900">Rs. {appointment.amount ?? 0}</p>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-2">
                          <span className={`data-chip ${appointment.paymentStatus === 'paid' ? '!bg-emerald-100 !text-emerald-700' : '!bg-amber-100 !text-amber-700'}`}>
                            {appointment.paymentStatus || 'unpaid'}
                          </span>
                          {appointment.paymentMethod && <span className="text-xs text-slate-500 uppercase">{appointment.paymentMethod}</span>}
                          <button type="button" className="btn-secondary" onClick={() => openPaymentModal(appointment)}>
                            Manage
                          </button>
                          <button type="button" className="btn-secondary" onClick={() => printInvoiceDocument(appointment)}>
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </div>
      </section>
      )}

      {activeTab === 'reports' && (
      <section className="grid gap-6">
        <div className="card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="section-title">Active Reports</h2>
              <p className="section-copy">Review current medical files with search, type, and uploader filters.</p>
            </div>
            <span className="data-chip">{filteredVisibleReports.filter((item) => !item.isDeleted).length} visible</span>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            <input className="input" placeholder="Search title, description, patient, or doctor" value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} />
            <select className="input" value={reportTypeFilter} onChange={(event) => setReportTypeFilter(event.target.value)}>
              <option value="all">All Types</option>
              <option value="lab">Lab</option>
              <option value="xray">X-Ray</option>
              <option value="mri">MRI</option>
              <option value="prescription">Prescription</option>
              <option value="other">Other</option>
            </select>
            <select className="input" value={reportUploaderFilter} onChange={(event) => setReportUploaderFilter(event.target.value)}>
              <option value="all">All Uploaders</option>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          {reportsError && <p className="error-banner mt-4">{reportsError}</p>}
          {!filteredVisibleReports.filter((item) => !item.isDeleted).length ? (
            <div className="mt-5">
              <EmptyState title="No reports found" description="Try adjusting the report filters or wait for new uploads." />
            </div>
          ) : (
            <div className="mt-5 max-h-[760px] space-y-4 overflow-y-auto pr-1">
              {filteredVisibleReports.filter((report) => !report.isDeleted).map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onPreview={setPreviewReport}
                  onDelete={(current) => deleteReport(current._id)}
                  actions={[{ label: 'Print Summary', onClick: (current) => printReportSummaryDocument(current) }]}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {activeTab === 'archived-reports' && (
      <section className="grid gap-6">
        <div className="card">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="section-title">Archived Reports</h2>
              <p className="section-copy">Restore soft-deleted reports when a file was hidden by mistake.</p>
            </div>
            <span className="data-chip">{filteredVisibleReports.filter((item) => item.isDeleted).length} visible</span>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            <input className="input" placeholder="Search archived title, patient, or doctor" value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} />
            <select className="input" value={reportTypeFilter} onChange={(event) => setReportTypeFilter(event.target.value)}>
              <option value="all">All Types</option>
              <option value="lab">Lab</option>
              <option value="xray">X-Ray</option>
              <option value="mri">MRI</option>
              <option value="prescription">Prescription</option>
              <option value="other">Other</option>
            </select>
            <select className="input" value={reportUploaderFilter} onChange={(event) => setReportUploaderFilter(event.target.value)}>
              <option value="all">All Uploaders</option>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          {reportsError && <p className="error-banner mt-4">{reportsError}</p>}
          {!filteredVisibleReports.filter((item) => item.isDeleted).length ? (
            <div className="mt-5">
              <EmptyState title="No archived reports" description="Archived reports will appear here with restore controls." />
            </div>
          ) : (
            <div className="mt-5 max-h-[760px] space-y-4 overflow-y-auto pr-1">
              {filteredVisibleReports.filter((report) => report.isDeleted).map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onPreview={setPreviewReport}
                  onRestore={(current) => restoreReport(current._id)}
                  actions={[{ label: 'Print Summary', onClick: (current) => printReportSummaryDocument(current) }]}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {activeTab === 'audit' && (
      <section className="grid gap-6">
        <div className="card">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="section-title">Audit Activity Stream</h2>
              <p className="section-copy">A readable trail of sensitive business actions with action categories, actor search, and date filtering.</p>
            </div>
            <span className="data-chip">{filteredAuditLogs.length} visible entries</span>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <input className="input" placeholder="Search actor, message, or action" value={auditSearch} onChange={(event) => setAuditSearch(event.target.value)} />
            <select className="input" value={auditActionFilter} onChange={(event) => setAuditActionFilter(event.target.value)}>
              <option value="all">All Actions</option>
              {[...new Set(auditLogs.map((item) => item.action))].map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <input type="date" className="input" value={auditDateFilter} onChange={(event) => setAuditDateFilter(event.target.value)} />
          </div>
          {auditError && <p className="error-banner mt-4">{auditError}</p>}
          {!filteredAuditLogs.length ? (
            <div className="mt-5">
              <EmptyState title="No audit activity yet" description="Important system events will appear here as the team uses the hospital workflow." />
            </div>
          ) : (
            <div className="mt-5 max-h-[760px] space-y-3 overflow-y-auto pr-1">
              {filteredAuditLogs.map((log) => (
                <article key={log._id} className={`record-shell ${log.action.includes('report') ? 'audit-report' : log.action.includes('appointment') ? 'audit-appointment' : log.action.includes('admin') ? 'audit-admin' : 'audit-doctor'}`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">{log.action}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{log.message}</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {log.actor?.name || 'System user'} ({log.actorRole}) · {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="data-chip">{log.entityType}</span>
                      <span className="data-chip">{log.action.split('.')[0]}</span>
                    </div>
                  </div>
                  <div className="record-grid">
                    <div className="record-meta">
                      <p className="record-label">Actor Email</p>
                      <p className="record-value">{log.actor?.email || 'Not available'}</p>
                    </div>
                    <div className="record-meta">
                      <p className="record-label">Entity</p>
                      <p className="record-value">{log.entityType}</p>
                      <p className="record-subvalue">{log.entityId}</p>
                    </div>
                    <div className="record-meta sm:col-span-2 xl:col-span-3">
                      <p className="record-label">Metadata</p>
                      <p className="record-value text-xs font-medium leading-6 text-slate-600">
                        {Object.keys(log.metadata || {}).length ? JSON.stringify(log.metadata) : 'No extra metadata recorded.'}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      )}
        </div>

      {paymentModal.open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="section-title">Appointment Payment</h3>
                <p className="section-copy">
                  {paymentModal.appointment?.patient?.user?.name} with {paymentModal.appointment?.doctor?.user?.name}
                </p>
              </div>
              <button type="button" className="btn-secondary" onClick={closePaymentModal}>Close</button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="record-grid">
                  <div className="record-meta">
                    <p className="record-label">Amount</p>
                    <p className="record-value">Rs. {paymentModal.appointment?.amount ?? 0}</p>
                  </div>
                  <div className="record-meta">
                    <p className="record-label">Current Status</p>
                    <p className="record-value capitalize">{paymentModal.appointment?.paymentStatus || 'unpaid'}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Payment Method</label>
                <select className="input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" className="btn-primary w-full" onClick={() => updatePayment('paid')}>Mark Paid</button>
                <button type="button" className="btn-secondary w-full" onClick={() => updatePayment('unpaid')}>Mark Unpaid</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReportPreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
    </DashboardLayout>
  );
};

export default AdminPanelPage;
