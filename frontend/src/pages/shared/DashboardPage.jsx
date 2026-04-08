import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user.role === 'admin') {
          const response = await api.get('/admin/dashboard');
          setData(response.data.data);
        }
        if (user.role === 'doctor') {
          const [profileResponse, appointmentsResponse] = await Promise.all([
            api.get('/doctors/profile'),
            api.get('/doctors/appointments'),
          ]);
          setData({ profile: profileResponse.data.data, appointments: appointmentsResponse.data.data });
        }
        if (user.role === 'patient') {
          const [appointmentsResponse, prescriptionsResponse] = await Promise.all([
            api.get('/patients/appointments'),
            api.get('/patients/prescriptions'),
          ]);
          setData({ appointments: appointmentsResponse.data.data, prescriptions: prescriptionsResponse.data.data });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.role]);

  if (loading) {
    return <Loader fullScreen />;
  }

  const renderContent = () => {
    if (user.role === 'admin') {
      return (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Patients" value={data.stats.patients} />
            <StatCard title="Doctors" value={data.stats.doctors} tone="accent" />
            <StatCard title="Appointments" value={data.stats.appointments} tone="dark" />
            <StatCard title="Departments" value={data.stats.departments} />
          </div>
          <section className="card">
            <h2 className="text-xl font-semibold text-slate-900">Recent Appointments</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Doctor</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAppointments.map((appointment) => (
                    <tr key={appointment._id} className="border-t border-slate-100">
                      <td className="py-3">{appointment.patient?.user?.name}</td>
                      <td className="py-3">{appointment.doctor?.user?.name}</td>
                      <td className="py-3 capitalize">{appointment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      );
    }

    if (user.role === 'doctor') {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Assigned Appointments" value={data.appointments.length} />
          <StatCard title="Completed" value={data.appointments.filter((item) => item.status === 'completed').length} tone="accent" />
          <StatCard title="Pending" value={data.appointments.filter((item) => item.status === 'pending').length} tone="dark" />
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Appointments" value={data.appointments.length} />
        <StatCard title="Prescriptions" value={data.prescriptions.length} tone="accent" />
        <StatCard title="Cancelled" value={data.appointments.filter((item) => item.status === 'cancelled').length} tone="dark" />
      </div>
    );
  };

  return (
    <DashboardLayout
      title={`Welcome, ${user.name}`}
      description="A role-aware overview of hospital operations, clinical work, and patient activity."
    >
      {data ? renderContent() : <EmptyState title="No data yet" description="Start by creating records or booking an appointment." />}
    </DashboardLayout>
  );
};

export default DashboardPage;
