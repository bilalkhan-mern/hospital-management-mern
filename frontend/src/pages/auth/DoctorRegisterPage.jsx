import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { defaultSchedule, weekDayOptions } from '../../lib/schedule';

const DoctorRegisterPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      schedule: defaultSchedule,
    },
  });
  const { registerDoctor } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadDepartments = async () => {
      const response = await api.get('/departments');
      setDepartments(response.data.data);
    };

    loadDepartments();
  }, []);

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      setSubmitError('');
      await registerDoctor(values);
      navigate('/login');
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Unable to submit doctor registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900">Doctor Registration Request</h1>
        <p className="mt-2 text-sm text-slate-500">Submit your details for admin approval. You can log in after your doctor account is approved.</p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          {submitError && <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{submitError}</p>}
          <div>
            <input className="input" placeholder="Full Name" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Email" {...register('email', { required: 'Email is required' })} />
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
          </div>
          <div>
            <input type="password" className="input" placeholder="Password" {...register('password', { required: 'Password is required' })} />
            {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Phone" {...register('phone', { required: 'Phone is required' })} />
            {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>}
          </div>
          <div>
            <select className="input" {...register('department', { required: 'Department is required' })}>
              <option value="">Select Department</option>
              {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
            {errors.department && <p className="mt-1 text-xs text-rose-500">{errors.department.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Specialization" {...register('specialization', { required: 'Specialization is required' })} />
            {errors.specialization && <p className="mt-1 text-xs text-rose-500">{errors.specialization.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Qualification" {...register('qualification', { required: 'Qualification is required' })} />
            {errors.qualification && <p className="mt-1 text-xs text-rose-500">{errors.qualification.message}</p>}
          </div>
          <div>
            <input type="number" className="input" placeholder="Experience" {...register('experience', { required: 'Experience is required' })} />
            {errors.experience && <p className="mt-1 text-xs text-rose-500">{errors.experience.message}</p>}
          </div>
          <div>
            <input type="number" className="input" placeholder="Consultation Fee" {...register('consultationFee', { required: 'Consultation fee is required' })} />
            {errors.consultationFee && <p className="mt-1 text-xs text-rose-500">{errors.consultationFee.message}</p>}
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-700">Working Days</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {weekDayOptions.map((day) => (
                <label key={day.value} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <input type="checkbox" value={day.value} {...register('schedule.workingDays', { required: 'Select at least one working day' })} />
                  {day.label}
                </label>
              ))}
            </div>
            {errors.schedule?.workingDays && <p className="mt-1 text-xs text-rose-500">{errors.schedule.workingDays.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Start Time</label>
            <input type="time" className="input" {...register('schedule.startTime', { required: 'Start time is required' })} />
            {errors.schedule?.startTime && <p className="mt-1 text-xs text-rose-500">{errors.schedule.startTime.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">End Time</label>
            <input type="time" className="input" {...register('schedule.endTime', { required: 'End time is required' })} />
            {errors.schedule?.endTime && <p className="mt-1 text-xs text-rose-500">{errors.schedule.endTime.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Slot Duration (minutes)</label>
            <input type="number" className="input" {...register('schedule.slotDuration', { required: 'Slot duration is required', min: { value: 5, message: 'Minimum slot duration is 5 minutes' } })} />
            {errors.schedule?.slotDuration && <p className="mt-1 text-xs text-rose-500">{errors.schedule.slotDuration.message}</p>}
          </div>
          <div className="md:col-span-2">
            <textarea className="input min-h-28" placeholder="Professional Bio" {...register('bio', { required: 'Bio is required' })} />
            {errors.bio && <p className="mt-1 text-xs text-rose-500">{errors.bio.message}</p>}
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Doctor Request'}</button>
            <Link className="text-sm font-semibold text-brand-500" to="/login">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorRegisterPage;
