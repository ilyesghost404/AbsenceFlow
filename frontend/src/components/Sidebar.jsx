import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import {
  BarChart3,
  Users,
  CalendarCheck,
  CalendarRange,
  LogOut,
  Settings,
  X,
  LayoutDashboard,
  CalendarDays,
  User,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const items = [];

    if (user?.role === 'admin') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/employees', label: 'Employees', icon: Users },
        { path: '/users', label: 'Users', icon: Users },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/admin/security', label: 'Security Center', icon: ShieldCheck }
      );
    } else if (user?.role === 'manager') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/employees', label: 'Employees', icon: Users },
        { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
        { path: '/leave-requests', label: 'Leave Requests', icon: CalendarDays },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/holidays', label: 'Holidays', icon: CalendarRange }
      );
    } else if (user?.role === 'employee') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/attendance', label: 'My Attendance', icon: CalendarCheck },
        { path: '/leave-requests', label: 'My Requests', icon: CalendarDays },
        { path: '/holidays', label: 'Holidays', icon: CalendarRange }
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  useEffect(() => {
    // Only auto-close sidebar on mobile when navigating
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  }, [location.pathname]);

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Administrator';
    if (role === 'manager') return 'Manager';
    return 'Employee';
  };

  return (
    <>
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-50">
        <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-2xl">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarRange className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">AbsenceFlow</h1>
                <p className="text-xs text-blue-200">HR Management</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white hover:pl-5'
                    }
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="space-y-2">
              <Link
                to="/settings"
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-blue-500/20 transition-colors">
                    <Settings size={20} className="group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span className="text-base font-semibold">Settings</span>
                </div>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-red-500/20 transition-colors">
                    <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
                  </div>
                  <span className="text-base font-semibold">Logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarRange className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">AbsenceFlow</h1>
                <p className="text-xs text-blue-200">HR Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white hover:pl-5'
                    }
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="space-y-2">
              <Link
                to="/settings"
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-blue-500/20 transition-colors">
                    <Settings size={20} className="group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span className="text-base font-semibold">Settings</span>
                </div>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-red-500/20 transition-colors">
                    <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
                  </div>
                  <span className="text-base font-semibold">Logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
