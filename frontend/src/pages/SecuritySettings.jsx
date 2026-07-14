import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, Lock, Smartphone, Monitor, Globe, Clock, 
  Trash2, AlertTriangle, Key, LogIn, ChevronRight, Server
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const SecuritySettings = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-slate-200' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isUpdating2FA, setIsUpdating2FA] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  useEffect(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (newPassword.length === 0) {
      setPasswordStrength({ score: 0, label: '', color: 'bg-slate-200' });
    } else if (score < 3) {
      setPasswordStrength({ score, label: 'Weak', color: 'bg-red-500' });
    } else if (score < 5) {
      setPasswordStrength({ score, label: 'Medium', color: 'bg-amber-500' });
    } else {
      setPasswordStrength({ score, label: 'Strong', color: 'bg-emerald-500' });
    }
  }, [newPassword]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, historyRes, meRes] = await Promise.all([
        api.get('/users/sessions'),
        api.get('/users/login-history'),
        api.get('/users/me')
      ]);

      if (sessionsRes.data.success) setSessions(sessionsRes.data.data);
      if (historyRes.data.success) setLoginHistory(historyRes.data.data);
      if (meRes.data.success) setTwoFactorEnabled(meRes.data.data.two_factor_enabled);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error('Please choose a stronger password');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setIsUpdating2FA(true);
      const res = await api.post('/users/2fa', { enabled: !twoFactorEnabled, type: 'email' });
      if (res.data.success) {
        setTwoFactorEnabled(!twoFactorEnabled);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to update 2FA settings');
    } finally {
      setIsUpdating2FA(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await api.delete(`/users/sessions/${sessionId}`);
      if (res.data.success) {
        toast.success('Session revoked');
        setSessions(sessions.filter(s => s.token_jti !== sessionId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      const res = await api.delete('/users/sessions/all');
      if (res.data.success) {
        toast.success('All other sessions revoked');
        setSessions(sessions.filter(s => s.isCurrent));
      }
    } catch (error) {
      toast.error('Failed to revoke sessions');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading security settings...</p>
      </div>
    );
  }

  // Calculate security score
  let score = 50;
  if (twoFactorEnabled) score += 30;
  // If recent password change, add 20 (mocking this as true for now)
  score += 20;

  return (
    <div className="min-h-screen pb-12 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">Security Settings</h1>
        <p className="text-slate-500 font-medium">Manage your account security, passwords, and sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-1">
          {/* Security Score */}
          <Card className="p-6 text-center border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Security Score</h3>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" 
                  stroke={score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="8" strokeDasharray={`${score * 2.827} 282.7`} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{score}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-2">
              {score === 100 ? 'Your account is highly secure.' : 'There is room for improvement.'}
            </p>
          </Card>

          {/* 2FA Card */}
          <Card className="p-6 border-slate-200">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Two-Factor Auth</h3>
                <p className="text-xs text-slate-500 font-medium">Add an extra layer of security</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className={`text-sm font-bold ${twoFactorEnabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <button 
                onClick={handleToggle2FA}
                disabled={isUpdating2FA}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Change Password */}
          <Card className="p-6 border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <Key className="text-blue-600" size={20} />
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
                  />
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 h-1.5 mb-1">
                        <div className={`flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`}></div>
                        <div className={`flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`}></div>
                        <div className={`flex-1 rounded-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-200'}`}></div>
                        <div className={`flex-1 rounded-full ${passwordStrength.score >= 5 ? passwordStrength.color : 'bg-slate-200'}`}></div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${passwordStrength.score < 3 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isChangingPassword || passwordStrength.score < 3 || newPassword !== confirmPassword}>
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Active Sessions */}
          <Card className="p-0 overflow-hidden border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Monitor className="text-indigo-600" size={20} />
                Active Sessions
              </h3>
              {sessions.length > 1 && (
                <button 
                  onClick={handleRevokeAllOtherSessions}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Revoke All Other Sessions
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {sessions.map(session => (
                <div key={session.token_jti} className="p-4 sm:p-6 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
                      {session.device_name?.toLowerCase().includes('mac') || session.device_name?.toLowerCase().includes('windows') ? (
                        <Monitor size={24} />
                      ) : (
                        <Smartphone size={24} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{session.device_name}</span>
                        {session.isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-0.5">
                        <Globe size={14} /> {session.browser_name} · {session.ip_address}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> Last active: {formatDate(session.last_activity)}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button 
                      onClick={() => handleRevokeSession(session.token_jti)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-start sm:self-center"
                      title="Revoke session"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="p-6 text-center text-slate-500">No active sessions found.</div>
              )}
            </div>
          </Card>

          {/* Login History */}
          <Card className="p-0 overflow-hidden border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <LogIn className="text-purple-600" size={20} />
                Recent Login Activity
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {loginHistory.map(entry => (
                <div key={entry.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${entry.successful ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        {entry.successful ? 'Successful login' : 'Failed login attempt'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.browser_name} on {entry.device_name} · {entry.ip_address}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {formatDate(entry.login_time)}
                  </span>
                </div>
              ))}
              {loginHistory.length === 0 && (
                <div className="p-6 text-center text-slate-500">No recent login activity.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
