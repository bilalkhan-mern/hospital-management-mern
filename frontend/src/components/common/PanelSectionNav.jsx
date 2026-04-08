const PanelSectionNav = ({ title, description, sections, activeSection, onChange }) => (
  <aside className="panel-nav-shell">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{title}</p>
      {description && <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>}
    </div>

    <nav className="panel-nav-list">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`panel-nav-button ${activeSection === section.id ? 'panel-nav-button-active' : ''}`}
          onClick={() => onChange(section.id)}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{section.label}</p>
            {section.helper && <p className="mt-1 text-xs text-current/70">{section.helper}</p>}
          </div>
          {typeof section.count !== 'undefined' && (
            <span className={`panel-nav-count ${activeSection === section.id ? 'panel-nav-count-active' : ''}`}>
              {section.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  </aside>
);

export default PanelSectionNav;
