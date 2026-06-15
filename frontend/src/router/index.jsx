import { createBrowserRouter, Navigate } from 'react-router-dom';
import HomePage from '../pages/public/HomePage';
import ProtectedRoute from '../components/routes/ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DoctorRegisterPage from '../pages/auth/DoctorRegisterPage';
import RoleLandingPage from '../pages/shared/RoleLandingPage';
import AppointmentsPage from '../pages/shared/AppointmentsPage';
import ProfilePage from '../pages/shared/ProfilePage';
import AdminPanelPage from '../pages/admin/AdminPanelPage';
import DoctorPanelPage from '../pages/doctor/DoctorPanelPage';
import PatientPanelPage from '../pages/patient/PatientPanelPage';
import NotFoundPage from '../pages/shared/NotFoundPage';
import RouteErrorPage from '../pages/shared/RouteErrorPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage />, errorElement: <RouteErrorPage /> },
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  { path: '/register', element: <RegisterPage />, errorElement: <RouteErrorPage /> },
  { path: '/register-doctor', element: <DoctorRegisterPage />, errorElement: <RouteErrorPage /> },
  {
    element: <ProtectedRoute roles={['admin', 'doctor', 'patient']} />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/dashboard', element: <RoleLandingPage /> },
      { path: '/appointments', element: <AppointmentsPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  {
    element: <ProtectedRoute roles={['admin']} />,
    errorElement: <RouteErrorPage />,
    children: [{ path: '/admin', element: <AdminPanelPage /> }],
  },
  {
    element: <ProtectedRoute roles={['doctor']} />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/doctor-panel', element: <DoctorPanelPage /> },
      { path: '/doctor-workspace', element: <Navigate to="/doctor-panel" replace /> },
    ],
  },
  {
    element: <ProtectedRoute roles={['patient']} />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/patient-panel', element: <PatientPanelPage /> },
      { path: '/doctors', element: <Navigate to="/patient-panel" replace /> },
      { path: '/book-appointment', element: <Navigate to="/patient-panel" replace /> },
      { path: '/prescriptions', element: <Navigate to="/patient-panel" replace /> },
    ],
  },
  { path: '*', element: <NotFoundPage />, errorElement: <RouteErrorPage /> },
]);
