import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
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

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Default redirect based on role */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Common Routes */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Dashboard for all roles */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'employee']} />}>
                <Route path="/dashboard" element={<DashboardRouter />} />
              </Route>
              
              {/* Manager and Employee routes */}
              <Route element={<ProtectedRoute allowedRoles={['manager', 'employee']} />}>
                <Route path="/leave-requests" element={<LeaveRequests />} />
                <Route path="/holidays" element={<Holidays />} />
              </Route>

              {/* Manager only routes */}
              <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
                <Route path="/employees" element={<Employees />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              {/* Admin only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/users" element={<UserManagement />} />
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
