const Loader = ({ fullScreen = false }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-10'}`}>
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
  </div>
);

export default Loader;
