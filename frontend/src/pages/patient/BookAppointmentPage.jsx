import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import api from '../../api/axios';

const BookAppointmentPage = () => {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await api.get('/patients/doctors?limit=100');
        setDoctors(response.data.data.items);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const onSubmit = async (values) => {
    await api.post('/patients/appointments', values);
    toast.success('Appointment booked successfully.');
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <DashboardLayout title="Book Appointment" description="Reserve an available time slot with your preferred doctor.">
      <form className="card grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <select className="input" {...register('doctorId')}>
          <option value="">Select Doctor</option>
          {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.user?.name} - {doctor.specialization}</option>)}
        </select>
        <input type="date" className="input" {...register('date')} />
        <input className="input" placeholder="Time Slot (e.g. 10:00 AM)" {...register('timeSlot')} />
        <textarea className="input min-h-28 md:col-span-2" placeholder="Symptoms or notes" {...register('symptoms')} />
        <button className="btn-primary md:w-fit">Confirm Appointment</button>
      </form>
    </DashboardLayout>
  );
};

export default BookAppointmentPage;
