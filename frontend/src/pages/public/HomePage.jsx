import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';

const slides = [
  {
    title: 'One workspace for hospital admin, doctors, and patients',
    copy: 'Manage appointments, prescriptions, reports, and payments from one connected dashboard experience.',
    badge: 'Role-based workflow',
  },
  {
    title: 'Clean screens that are easy to explain in viva',
    copy: 'Simple navigation, structured cards, and readable workflows make the project presentation friendly.',
    badge: 'Fresher-friendly',
  },
  {
    title: 'Demo accounts are included for quick testing',
    copy: 'Use the login hints to sign in as admin, doctor, or patient and show the full working flow.',
    badge: 'Demo ready',
  },
];

const highlights = [
  { label: 'Registered Patients', value: '1,240+' },
  { label: 'Doctors Onboarded', value: '48' },
  { label: 'Daily Appointments', value: '86' },
  { label: 'Reports Processed', value: '310' },
];

const services = [
  {
    title: 'Appointments',
    copy: 'Patients book, doctors review, and admins monitor the visit pipeline.',
  },
  {
    title: 'Prescriptions',
    copy: 'Doctors generate structured prescriptions with medicines and advice.',
  },
  {
    title: 'Reports',
    copy: 'Upload, preview, and manage PDF or image reports linked to appointments.',
  },
];

const workflow = [
  'Patient logs in and books an appointment.',
  'Doctor reviews the scheduled visit and marks it completed.',
  'Prescription and reports are linked to the same appointment.',
  'Admin monitors records, payments, and overall hospital activity.',
];

const HomePage = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div id="home" className="min-h-screen">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="dashboard-hero">
            <div className="dashboard-hero-grid">
              <div>
                <span className="dashboard-hero-kicker">Hospital Management System</span>
                <h1 className="dashboard-hero-title">
                  A professional hospital platform built for simple, clear, and role-based workflows.
                </h1>
                <p className="dashboard-hero-copy">
                  Use the landing page to explain the project quickly, then move to login and demo the admin, doctor, and patient panels without confusion.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/login" className="btn-primary">
                    Open Login
                  </Link>
                  <Link to="/dashboard" className="btn-secondary">
                    View Panel Flow
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="dashboard-hero-chip">Admin</span>
                  <span className="dashboard-hero-chip">Doctor</span>
                  <span className="dashboard-hero-chip">Patient</span>
                  <span className="dashboard-hero-chip">Simple demo</span>
                </div>
              </div>

              <div className="dashboard-hero-side">
                <div className="dashboard-hero-panel">
                  <div className="flex items-center justify-between gap-3">
                    <span className="dashboard-hero-panel-label">Live Preview</span>
                    <span className="data-chip">{slides[activeSlide].badge}</span>
                  </div>
                  <h2 className="dashboard-hero-panel-value">{slides[activeSlide].title}</h2>
                  <p className="dashboard-hero-panel-copy">{slides[activeSlide].copy}</p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        index === activeSlide
                          ? 'border-white/30 bg-white/15 text-white'
                          : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-white/55">Slide {index + 1}</p>
                      <p className="mt-1 text-sm font-semibold">{slide.badge}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <span className="dashboard-hero-glow dashboard-hero-glow-left" />
            <span className="dashboard-hero-glow dashboard-hero-glow-right" />
          </div>

          <aside className="card">
            <p className="section-title">Quick Stats</p>
            <p className="section-copy">Sample data for a professional demo view.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item.label} className="insight-card">
                  <p className="insight-label">{item.label}</p>
                  <p className="insight-value">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Demo Credentials Hint</p>
              <p className="mt-1 text-sm text-slate-500">
                Open login page for admin, doctor, and patient demo accounts.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="data-chip" to="/login">Admin</Link>
                <Link className="data-chip" to="/login">Doctor</Link>
                <Link className="data-chip" to="/login">Patient</Link>
              </div>
            </div>
          </aside>
        </section>

        <section id="services" className="mt-8 grid gap-4 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.title} className="card">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-500">Module</p>
              <h2 className="mt-3 text-xl font-extrabold text-slate-900">{service.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{service.copy}</p>
            </article>
          ))}
        </section>

        <section id="workflow" className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="card">
            <p className="section-title">How It Works</p>
            <p className="section-copy">A very simple flow you can explain in presentation.</p>
            <div className="mt-6 space-y-3">
              {workflow.map((step, index) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Step {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="card overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-title">Why this project feels professional</p>
                <p className="section-copy">Clear landing page, clear login hints, and role-specific panels.</p>
              </div>
              <Link to="/register" className="btn-primary w-fit">
                Start as Patient
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-slate-900 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/65">Presentation</p>
                <p className="mt-3 text-lg font-bold">Simple enough to explain, strong enough to demo.</p>
              </div>
              <div className="rounded-[24px] bg-brand-500 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/70">Demo Ready</p>
                <p className="mt-3 text-lg font-bold">Admin, doctor, and patient logins are visible on the login page.</p>
              </div>
            </div>
          </article>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default HomePage;
