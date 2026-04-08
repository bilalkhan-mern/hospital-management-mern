import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="card max-w-lg text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-500">404</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-sm text-slate-500">The page you are looking for does not exist or may have moved.</p>
      <Link className="btn-primary mt-6" to="/dashboard">Go to dashboard</Link>
    </div>
  </div>
);

export default NotFoundPage;
