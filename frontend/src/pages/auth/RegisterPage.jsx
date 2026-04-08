import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: registerUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      await registerUser(values);
      navigate('/login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Patient Registration</h1>
        <p className="mt-2 text-sm text-slate-500">Create a patient account to browse doctors, book appointments, and review prescriptions.</p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input className="input" placeholder="Full Name" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Email" {...register('email', { required: 'Email is required' })} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <input type="password" className="input" placeholder="Password" {...register('password', { required: 'Password is required' })} />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <input className="input" placeholder="Phone" {...register('phone')} />
          </div>
          <div>
            <input type="number" className="input" placeholder="Age" {...register('age')} />
          </div>
          <div>
            <select className="input" {...register('gender')}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <input className="input" placeholder="Blood Group" {...register('bloodGroup')} />
          </div>
          <div className="md:col-span-2">
            <textarea className="input min-h-24" placeholder="Address" {...register('address')} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button className="btn-primary" disabled={submitting}>{submitting ? 'Creating account...' : 'Register'}</button>
            <Link className="text-sm font-semibold text-brand-500" to="/login">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
