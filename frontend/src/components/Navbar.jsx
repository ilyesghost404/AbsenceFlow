import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ title = 'Dashboard', onMenuClick }) => {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Administrator';
    if (role === 'manager') return 'Manager';
    return 'Employee';
  };

  const isEmployee = user?.role === 'employee';

  const UserInfoContent = () => (
    <>
      <div className="w-11 h-11 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg uppercase select-none transition-transform group-hover:scale-105">
        {user?.username ? user.username[0] : 'U'}
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
          {user?.employee_name || user?.username || 'User'}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 group-hover:text-blue-500 transition-colors">
          {getRoleLabel(user?.role)}
        </p>
      </div>
    </>
  );

  return (
    <div className="bg-white shadow-sm border-b border-slate-100 px-6 lg:px-8 py-5 sticky top-0 z-30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-700 cursor-pointer"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        </div>
        
        <div className="flex items-center gap-5">
          <button className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 cursor-pointer">
            <Bell className="text-slate-600" size={20} />
          </button>
          
          <div className="pl-5 border-l border-slate-200 relative">
            {isEmployee ? (
              <Link 
                to="/profile"
                className="flex items-center gap-3 text-left focus:outline-none cursor-pointer group"
                title="My Profile"
              >
                <UserInfoContent />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <UserInfoContent />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
