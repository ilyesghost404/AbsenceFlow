import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title = 'Dashboard', onMenuClick }) => {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Administrator';
    if (role === 'manager') return 'Manager';
    return 'Employee';
  };

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
          <div className="relative hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all w-64 text-sm text-slate-700"
            />
          </div>
          
          <button className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 cursor-pointer">
            <Bell className="text-slate-600" size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
            <div className="w-11 h-11 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg uppercase select-none">
              {user?.username ? user.username[0] : 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.employee_name || user?.username || 'User'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {getRoleLabel(user?.role)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

