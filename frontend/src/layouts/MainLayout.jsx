import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SessionTimeout from '../components/SessionTimeout';
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
    '/profile': 'Profile',
  };
  return titles[pathname] || 'Dashboard';
};

const MainLayout = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  
  // Open by default on desktop (width >= 1024px), closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  console.log("MainLayout render — innerWidth:", typeof window !== "undefined" ? window.innerWidth : "undefined", "sidebarOpen:", sidebarOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Sync initial state on mount after DevTools constraints apply
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SessionTimeout>
      <div className="flex min-h-screen bg-slate-50 overflow-x-hidden max-w-full">
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
      <div className="flex-1 flex flex-col lg:ml-64 w-full max-w-full overflow-x-hidden">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
      </div>
    </SessionTimeout>
  );
};

export default MainLayout;
