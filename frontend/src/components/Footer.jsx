import { Link } from 'react-router-dom';
import { CalendarRange, Shield, HelpCircle, Mail, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8 border-b border-slate-100">
        {/* Left Side: Logo & Description */}
        <div className="space-y-4 md:max-w-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <CalendarRange className="text-white" size={18} />
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight">WinSAP</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Smart employee absence and attendance management system. Designed to streamline requests, tracking, and reporting.
          </p>
        </div>

        {/* Center: Quick Links */}
        <div className="mt-8 md:mt-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Links</h3>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
            <li>
              <Link 
                to="/dashboard" 
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/employees" 
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5"
              >
                Employees
              </Link>
            </li>
            <li>
              <Link 
                to="/attendance" 
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5"
              >
                Attendance
              </Link>
            </li>
            <li>
              <Link 
                to="/reports" 
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5"
              >
                Reports
              </Link>
            </li>
            <li>
              <Link 
                to="/holidays" 
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5"
              >
                Holidays
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Side: Security & Support */}
        <div className="mt-8 md:mt-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Security & Support</h3>
          <ul className="space-y-3">
            <li>
              <Link 
                to="/settings" 
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-2"
              >
                <Shield size={14} className="text-slate-400" />
                Settings
              </Link>
            </li>
            <li>
              <a 
                href="#help" 
                onClick={(e) => {
                  e.preventDefault();
                  alert('For support, please contact your administrator or refer to the WinSAP documentation.');
                }}
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-2"
              >
                <HelpCircle size={14} className="text-slate-400" />
                Help Documentation
              </a>
            </li>
            <li>
              <a 
                href="mailto:support@winsap.com" 
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-2"
              >
                <Mail size={14} className="text-slate-400" />
                Contact Support
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Section: Copyright */}
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 font-medium">
          &copy; 2026 WinSAP. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a 
            href="https://github.com/ilyesghost404/AbsenceFlow" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
          >
            GitHub <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
