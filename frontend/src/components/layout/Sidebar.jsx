import { NavLink } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';

const linkMap = {
  admin: [
    { label: 'Command Center', to: '/admin' },
    { label: 'Appointments', to: '/appointments' },
  ],
  doctor: [
    { label: 'Doctor Panel', to: '/doctor-panel' },
    { label: 'Appointments', to: '/appointments' },
  ],
  patient: [
    { label: 'Patient Panel', to: '/patient-panel' },
  ],
};

const Sidebar = ({ sections = [], activeSection = '', onSectionChange }) => {
  const role = useRole();
  const links = linkMap[role] || [];

  return (
    <aside className="card h-fit lg:sticky lg:top-24">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Workspace</p>
      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold transition xl:mb-2 ${
                isActive ? 'bg-slate-950 text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {sections.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Sections</p>
          <div className="mt-3 grid gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  activeSection === section.id
                    ? 'border-brand-500 bg-brand-500 text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700'
                }`}
                onClick={() => onSectionChange?.(section.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate">{section.label}</p>
                    {section.helper && <p className="mt-1 text-xs text-current/70">{section.helper}</p>}
                  </div>
                  {typeof section.count !== 'undefined' && (
                    <span className={`inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-bold ${
                      activeSection === section.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {section.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
