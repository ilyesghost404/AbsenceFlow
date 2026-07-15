import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import ActivateAccount from '../pages/ActivateAccount';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import ManagerDashboard from '../pages/ManagerDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import Employees from '../pages/Employees';
import Attendance from '../pages/Attendance';
import LeaveRequests from '../pages/LeaveRequests';
import Holidays from '../pages/Holidays';
import Reports from '../pages/Reports';
import UserManagement from '../pages/UserManagement';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import SecuritySettings from '../pages/SecuritySettings';
import AdminSecurityCenter from '../pages/AdminSecurityCenter';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (user?.role === 'employee') return <EmployeeDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'manager') return <ManagerDashboard />;
  
  return <Navigate to="/login" replace />;
};

const RootRedirect = () => {
  const { user } = useAuth();
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/activate-account" element={<ActivateAccount />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Default redirect based on role */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Common Routes */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/security" element={<SecuritySettings />} />
              
              {/* Dashboard for all roles */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'employee']} />}>
                <Route path="/dashboard" element={<DashboardRouter />} />
              </Route>
              
              {/* Manager and Employee routes */}
              <Route element={<ProtectedRoute allowedRoles={['manager', 'employee']} />}>
                <Route path="/leave-requests" element={<LeaveRequests />} />
                <Route path="/holidays" element={<Holidays />} />
                <Route path="/attendance" element={<Attendance />} />
              </Route>

              {/* Manager and Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
                <Route path="/employees" element={<Employees />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              {/* Admin only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/users" element={<UserManagement />} />
                <Route path="/admin/security" element={<AdminSecurityCenter />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
