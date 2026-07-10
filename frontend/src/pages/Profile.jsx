import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Briefcase, Calendar, Hash } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getEmployeeById } from '../services/employeeService';

const Profile = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.employee_id) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const data = await getEmployeeById(user.employee_id);
        setEmployee(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">My Profile</h1>
          <p className="text-slate-500">Your personal details</p>
        </div>
        <Card className="p-8 text-center">
          <p className="text-slate-500">No employee profile linked to this account.</p>
        </Card>
      </div>
    );
  }

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = cleanStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">My Profile</h1>
        <p className="text-slate-500">Your personal and employment details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white text-4xl font-bold">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{employee.first_name} {employee.last_name}</h2>
              <p className="text-blue-600 font-medium">{employee.position || 'Employee'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Hash size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Matricule</p>
                <p className="text-slate-700 font-medium">{employee.matricule || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-slate-700 font-medium">{employee.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Briefcase size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                <p className="text-slate-700 font-medium">{employee.department || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hire Date</p>
                <p className="text-slate-700 font-medium">
                  {employee.hire_date ? parseLocalDate(employee.hire_date)?.toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
