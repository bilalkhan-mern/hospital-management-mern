const PublicFooter = () => {
  return (
    <footer id="footer" className="border-t border-slate-200/80 bg-white/70">
      <div className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">
            Care<span className="text-brand-500">Sync</span>
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            A clean hospital management system for admin, doctor, and patient workflows with secure access and structured records.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-900">Quick Access</p>
            <div className="mt-2 space-y-2">
              <a className="block transition hover:text-brand-600" href="#services">Services</a>
              <a className="block transition hover:text-brand-600" href="#workflow">Workflow</a>
              <a className="block transition hover:text-brand-600" href="#home">Top</a>
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Support</p>
            <div className="mt-2 space-y-2">
              <p>24/7 Hospital Desk</p>
              <p>Secure Role Access</p>
              <p>Demo Ready for Presentation</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
