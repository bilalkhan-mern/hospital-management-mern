import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/format';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');

  const loadAppointments = async () => {
    try {
      setAppointmentsError('');
      const endpoint = user.role === 'admin' ? '/admin/appointments' : '/doctors/appointments';
      const response = await api.get(endpoint);
      setAppointments(response.data.data);
    } catch (error) {
      setAppointmentsError(error.response?.data?.message || 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'patient') {
      setLoading(false);
      return;
    }
    loadAppointments();
  }, [user.role]);

  const updateStatus = async (id, status) => {
    try {
      setAppointmentsError('');
      await api.patch(`/doctors/appointments/${id}/status`, { status, notes: '' });
      toast.success('Appointment status updated.');
      loadAppointments();
    } catch (error) {
      setAppointmentsError(error.response?.data?.message || 'Unable to update appointment status.');
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (user.role === 'patient') {
    return <Navigate to="/patient-panel" replace />;
  }

  return (
    <DashboardLayout title="Appointments" description="Track bookings, statuses, and schedule activity by role.">
      {appointmentsError && <div className="card border border-rose-100 bg-rose-50 text-sm text-rose-600">{appointmentsError}</div>}
      {!appointments.length ? (
        <EmptyState title="No appointments found" description="Appointments will appear here once created." />
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <article key={appointment._id} className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{appointment.patient?.user?.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(appointment.date)} at {appointment.timeSlot}
                </p>
                <p className="mt-2 text-sm capitalize text-brand-600">Status: {appointment.status}</p>
              </div>
              {user.role === 'doctor' && (
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => updateStatus(appointment._id, 'completed')}>Mark Completed</button>
                  <button className="btn-secondary" onClick={() => updateStatus(appointment._id, 'cancelled')}>Cancel</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AppointmentsPage;
