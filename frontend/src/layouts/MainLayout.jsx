import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Outlet, useLocation } from 'react-router-dom';

const getPageTitle = (pathname) => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/employees': 'Employees',
    '/attendance': 'Attendance',
    '/leave-requests': 'Leave Requests',
    '/holidays': 'Holidays',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/users': 'User Management',
  };
  return titles[pathname] || 'Dashboard';
};

const MainLayout = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
