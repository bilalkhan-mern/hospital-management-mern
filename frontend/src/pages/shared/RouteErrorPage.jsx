import { isRouteErrorResponse, Link, useNavigate, useRouteError } from 'react-router-dom';

const RouteErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText || 'Application Error'}`
    : 'Unexpected Application Error';
  const message = isRouteErrorResponse(error)
    ? error.data?.message || 'Something went wrong while loading this page.'
    : error?.message || 'Something went wrong while loading this page.';

  return (
    <div className="min-h-screen bg-[#f4f7f9] px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
        <div className="card w-full max-w-2xl text-center">
          <p className="dashboard-hero-kicker !text-brand-500">System Recovery</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="section-copy mx-auto max-w-xl">{message}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" className="btn-primary" onClick={() => navigate(0)}>
              Retry
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Go Back
            </button>
            <Link className="btn-secondary" to="/dashboard">
              Back To Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorPage;
