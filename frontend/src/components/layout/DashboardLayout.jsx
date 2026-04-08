import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = ({ children, title, description, sidebarSections = [], activeSection = '', onSectionChange }) => {
  const { user } = useAuth();
  const currentSection = sidebarSections.find((section) => section.id === activeSection);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="mx-auto grid w-full max-w-[1600px] min-w-0 gap-5 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6 lg:px-8 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)] xl:gap-8">
        <Sidebar sections={sidebarSections} activeSection={activeSection} onSectionChange={onSectionChange} />
        <main className="min-w-0 space-y-6 overflow-x-hidden">
          <section className="dashboard-hero">
            <div className="dashboard-hero-glow dashboard-hero-glow-left" />
            <div className="dashboard-hero-glow dashboard-hero-glow-right" />

            <div className="dashboard-hero-grid">
              <div className="relative min-w-0">
                <p className="dashboard-hero-kicker">Hospital Management</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="dashboard-hero-chip">{user?.role || 'workspace'}</span>
                  {currentSection?.label && <span className="dashboard-hero-chip">{currentSection.label}</span>}
                  <span className="dashboard-hero-chip">{sidebarSections.length || 0} sections</span>
                </div>
                <h1 className="dashboard-hero-title">{title}</h1>
                <p className="dashboard-hero-copy">{description}</p>
              </div>

              <div className="dashboard-hero-side">
                <div className="dashboard-hero-panel">
                  <p className="dashboard-hero-panel-label">Current Focus</p>
                  <p className="dashboard-hero-panel-value">{currentSection?.label || 'Overview'}</p>
                  <p className="dashboard-hero-panel-copy">
                    {currentSection?.helper || 'Choose a section from the sidebar to jump directly into that workflow.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
