import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DemoCredentialsCard from '../../components/auth/DemoCredentialsCard';

const LoginPage = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      setLoginError('');
      const user = await login(values);
      const nextRoute = location.state?.from?.pathname || (
        user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor-panel' : '/patient-panel'
      );
      navigate(nextRoute, { replace: true });
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-slate-900 p-10 text-white shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">CareSync</p>
          <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">Built for patient care, doctor workflows, and hospital operations.</h1>
          <p className="mt-5 max-w-lg text-sm text-slate-300">Role-based dashboards, secure authentication, appointment coordination, prescriptions, and hospital administration from one clean interface.</p>
        </section>
        <section className="card">
          <h2 className="text-2xl font-bold text-slate-900">Login</h2>
          <p className="mt-2 text-sm text-slate-500">Use your admin, doctor, or patient credentials.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {loginError && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{loginError}</p>}
            <div>
              <input className="input" placeholder="Email" {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <input type="password" className="input" placeholder="Password" {...register('password', { required: 'Password is required' })} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <button className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <DemoCredentialsCard
            onPick={({ email, password }) => {
              setValue('email', email, { shouldDirty: true, shouldValidate: true });
              setValue('password', password, { shouldDirty: true, shouldValidate: true });
              setLoginError('');
            }}
          />
          <div className="mt-6 space-y-2 text-sm text-slate-500">
            <p>
              Patient account needed?{' '}
              <Link className="font-semibold text-brand-500" to="/register">
                Create one here
              </Link>
            </p>
            <p>
              Doctor joining the hospital?{' '}
              <Link className="font-semibold text-brand-500" to="/register-doctor">
                Apply for doctor access
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
