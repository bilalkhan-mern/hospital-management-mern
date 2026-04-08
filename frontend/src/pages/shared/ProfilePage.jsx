import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (user.role === 'doctor' || user.role === 'patient') {
        setLoading(false);
        return;
      }

      try {
        setProfileError('');
        const response = await api.get('/auth/me');
        const profile = response.data.data;
        reset({
          name: profile.name || '',
          phone: profile.phone || '',
        });
      } catch (error) {
        setProfileError(error.response?.data?.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [reset, user.role]);

  const onSubmit = async () => {
    toast.success('Admin profile is view-only in this build.');
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (user.role === 'doctor') {
    return <Navigate to="/doctor-panel" replace />;
  }

  if (user.role === 'patient') {
    return <Navigate to="/patient-panel" replace />;
  }

  return (
    <DashboardLayout title="Profile" description="Your admin account details and system access context.">
      <form className="card grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        {profileError && <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{profileError}</p>}
        <div>
          <input className="input" placeholder="Name" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
        </div>
        <div>
          <input className="input" placeholder="Phone" {...register('phone')} />
        </div>
        <button className="btn-primary md:col-span-2 md:w-fit">Save</button>
      </form>
    </DashboardLayout>
  );
};

export default ProfilePage;
