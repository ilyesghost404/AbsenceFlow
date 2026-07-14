import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Mail, Briefcase, Calendar, Hash, Building, ShieldCheck, 
  Phone, MapPin, Edit2, CalendarDays, Clock, CheckCircle2
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getEmployeeById, updateEmployee } from '../services/employeeService';
import { getDashboardStats } from '../services/dashboardService';

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const ProfileInfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors rounded-xl border border-transparent hover:border-slate-100">
    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
      <Icon size={22} strokeWidth={2} />
    </div>
    <div className="pt-1">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-slate-800 font-bold text-[15px]">{value || <span className="text-slate-300 italic">Not provided</span>}</p>
    </div>
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    matricule: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hire_date: ''
  });

  const fetchProfileData = async () => {
    try {
      if (!user?.employee_id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [empData, dashStats] = await Promise.all([
        getEmployeeById(user.employee_id),
        getDashboardStats().catch(() => null)
      ]);
      setEmployee(empData);
      if (dashStats) setStats(dashStats);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleEditClick = () => {
    setFormData({
      matricule: employee.matricule || '',
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      hire_date: employee.hire_date ? parseLocalDate(employee.hire_date).toISOString().split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.matricule || !formData.hire_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateEmployee(employee.id, formData);
      toast.success('Profile updated successfully');
      setIsEditModalOpen(false);
      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile. You might not have permission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">My Profile</h1>
        </div>
        <Card className="p-12 text-center shadow-sm border-slate-200">
          <ShieldCheck className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Profile Linked</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Your user account does not have an associated employee profile. Please contact an administrator.</p>
        </Card>
      </div>
    );
  }

  // Calculate leave summary
  const remainingVacation = stats?.remainingVacationDays ?? 0;
  const usedVacation = 30 - remainingVacation;

  return (
    <div className="min-h-screen pb-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">My Profile</h1>
          <p className="text-slate-500 font-medium">View and manage your personal details</p>
        </div>
        <Button icon={Edit2} onClick={handleEditClick} className="shadow-lg hover:shadow-blue-500/25 px-6">
          Edit Profile
        </Button>
      </div>

      <div className="space-y-8">
        {/* Profile Header Card */}
        <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative">
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider border border-white/30 flex items-center gap-1.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              Active Employee
            </div>
          </div>
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 sm:-mt-16 mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white p-2 shadow-lg shrink-0 z-10">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-100">
                  <span className="text-3xl sm:text-4xl font-black text-slate-400">
                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                  </span>
                </div>
              </div>
              <div className="flex-1 pb-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                  {employee.first_name} {employee.last_name}
                </h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100 shadow-sm">
                    {employee.position || 'Employee'}
                  </span>
                  {employee.department && (
                    <span className="flex items-center gap-1 text-slate-500 text-sm font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                      <Building size={14} /> {employee.department}
                    </span>
                  )}
                  {employee.matricule && (
                    <span className="flex items-center gap-1 text-slate-500 text-sm font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                      <Hash size={14} /> ID: {employee.matricule}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Personal Information */}
          <Card className="p-6 shadow-sm border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <ShieldCheck className="text-blue-600" size={20} />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileInfoRow icon={ShieldCheck} label="First Name" value={employee.first_name} />
              <ProfileInfoRow icon={ShieldCheck} label="Last Name" value={employee.last_name} />
              <ProfileInfoRow icon={Mail} label="Work Email" value={employee.email} />
              <ProfileInfoRow icon={Phone} label="Phone Number" value={employee.phone} />
            </div>
          </Card>

          {/* Employment Information */}
          <Card className="p-6 shadow-sm border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <Briefcase className="text-indigo-600" size={20} />
              Employment Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileInfoRow icon={Hash} label="Employee ID" value={employee.matricule} />
              <ProfileInfoRow icon={Building} label="Department" value={employee.department} />
              <ProfileInfoRow icon={Briefcase} label="Position" value={employee.position} />
              <ProfileInfoRow 
                icon={Calendar} 
                label="Hire Date" 
                value={employee.hire_date ? parseLocalDate(employee.hire_date)?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} 
              />
            </div>
          </Card>

          {/* Leave Summary */}
          {stats && (
            <Card className="p-6 shadow-sm border-slate-200 lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                <CalendarDays className="text-emerald-600" size={20} />
                Leave Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col items-center justify-center text-center">
                  <p className="text-emerald-600 font-black text-3xl mb-1">{remainingVacation}</p>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Remaining Days</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex flex-col items-center justify-center text-center">
                  <p className="text-amber-600 font-black text-3xl mb-1">{usedVacation}</p>
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Used Days</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col items-center justify-center text-center">
                  <p className="text-blue-600 font-black text-3xl mb-1">{stats.pendingRequests || 0}</p>
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Pending Requests</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 flex flex-col items-center justify-center text-center">
                  <p className="text-purple-600 font-black text-3xl mb-1">{stats.approvedRequests || 0}</p>
                  <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12}/> Approved Leaves</p>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200 text-sm font-medium flex gap-3 mb-6">
            <ShieldCheck className="shrink-0 text-amber-500" size={20} />
            <p>Note: Updating your profile information requires approval and adequate permissions. Changes will be logged.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <hr className="border-slate-100 my-4" />

          <div className="grid grid-cols-2 gap-4 opacity-75">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Employee ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.matricule}
                onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-100 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hire Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-100 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 opacity-75">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-100 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-100 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting} className="px-8 py-2.5 shadow-md">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
