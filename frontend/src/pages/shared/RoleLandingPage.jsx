import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardPage from './DashboardPage';

const RoleLandingPage = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'doctor') {
    return <Navigate to="/doctor-panel" replace />;
  }

  if (user?.role === 'patient') {
    return <Navigate to="/patient-panel" replace />;
  }

  return <DashboardPage />;
};

export default RoleLandingPage;
