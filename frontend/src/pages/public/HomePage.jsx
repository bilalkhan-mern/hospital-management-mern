import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';

const overviewCards = [
  { label: 'OPD Consultations', value: '128', note: 'Today' },
  { label: 'Doctors Available', value: '42', note: 'Across departments' },
  { label: 'Lab Reports', value: '96', note: 'Processed today' },
  { label: 'Patient Records', value: '1,480', note: 'Updated securely' },
];

const services = [
  {
    title: 'Outpatient Department',
    copy: 'Appointments, doctor allocation, and consultation records managed in one place.',
  },
  {
    title: 'Diagnostics',
    copy: 'Lab reports, x-ray files, and clinical documents linked to the correct visit.',
  },
  {
    title: 'Prescriptions',
    copy: 'Structured medicines, dosage details, and treatment instructions for patients.',
  },
];

const departments = [
  'Cardiology',
  'General Medicine',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'ENT',
];

const workflow = [
  'Patient registers or signs in and books an appointment.',
  'Doctor reviews the scheduled visit and completes the consultation.',
  'Prescription and reports stay attached to the same appointment.',
  'Admin monitors records, departments, billing, and overall activity.',
];

const HomePage = () => {
  return (
    <div id="home" className="min-h-screen">
      <PublicNavbar />

      <main className="w-full">
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(8,47,73,0.95)_55%,rgba(15,118,110,0.9))] text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
            <div className="absolute right-[-6rem] top-10 h-80 w-80 rounded-full bg-orange-300/10 blur-3xl" />
            <div className="absolute bottom-[-5rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative mx-auto grid w-full max-w-[1800px] gap-8 px-4 py-16 sm:px-6 lg:px-8 xl:grid-cols-[1.15fr_0.85fr] xl:py-24">
            <div className="max-w-4xl">
              <span className="dashboard-hero-kicker text-teal-100/70">Hospital Management System</span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl xl:text-6xl">
                Care, records, appointments, and hospital operations in one connected platform.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
                Designed for real hospital workflows across admin, doctor, and patient use cases. The structure is clean, readable, and easy to present in viva or client review.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn-secondary border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15 hover:text-white">
                  Patient Registration
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <span className="dashboard-hero-chip">OPD</span>
                <span className="dashboard-hero-chip">IPD</span>
                <span className="dashboard-hero-chip">Diagnostics</span>
                <span className="dashboard-hero-chip">Prescriptions</span>
                <span className="dashboard-hero-chip">Billing</span>
              </div>
            </div>

            <aside className="rounded-[32px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/55">Hospital Overview</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-white">Today at a glance</h2>
                </div>
                <span className="data-chip bg-white/10 text-white">Live view</span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {overviewCards.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">{item.label}</p>
                    <p className="mt-2 text-3xl font-extrabold text-white">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-200">{item.note}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {services.map((service) => (
              <article key={service.title} className="card">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-500">Hospital Service</p>
                <h2 className="mt-3 text-xl font-extrabold text-slate-900">{service.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">{service.copy}</p>
              </article>
            ))}
          </div>

          <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="card">
              <p className="section-title">Departments</p>
              <p className="section-copy">Main clinical areas available in the hospital flow.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {departments.map((department) => (
                  <span key={department} className="data-chip">
                    {department}
                  </span>
                ))}
              </div>
            </article>

            <article className="card">
              <p className="section-title">Hospital Workflow</p>
              <p className="section-copy">Clear process flow from appointment booking to records management.</p>
              <div className="mt-6 space-y-3">
                {workflow.map((step, index) => (
                  <div key={step} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Step {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{step}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="insight-card">
              <p className="insight-label">Emergency Support</p>
              <p className="insight-value">24/7</p>
            </div>
            <div className="insight-card">
              <p className="insight-label">Secure Records</p>
              <p className="insight-value">Encrypted</p>
            </div>
            <div className="insight-card">
              <p className="insight-label">Doctor Access</p>
              <p className="insight-value">Role Based</p>
            </div>
            <div className="insight-card">
              <p className="insight-label">Patient Care</p>
              <p className="insight-value">Connected</p>
            </div>
          </section>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default HomePage;
