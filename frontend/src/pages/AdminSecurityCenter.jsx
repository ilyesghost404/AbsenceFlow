import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, Lock, Unlock, Monitor, Activity, Users,
  AlertTriangle, Clock, RefreshCw, XCircle, Search, PowerOff
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

const AdminSecurityCenter = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
  const [stats, setStats] = useState({
    total_users: 0,
    active_accounts: 0,
    locked_accounts: 0,
    disabled_accounts: 0,
    online_users: 0,
    offline_users: 0,
    last_activity: null
  });

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const limit = 10;

  // Lock user modal state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lockDuration, setLockDuration] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes] = await Promise.all([
        api.get('/users', { params: { limit: 1000 } }),
        api.get('/users/audit-logs', { params: { limit: 1000 } })
      ]);

      if (usersRes.data.success) {
        setUsers(usersRes.data.data || []);
        if (usersRes.data.stats) {
          setStats(usersRes.data.stats);
        }
      }
      if (logsRes.data.success) setAuditLogs(logsRes.data.data || logsRes.data);
    } catch (error) {
      console.error('Error fetching admin security data:', error);
      toast.error('Failed to load security center data');
    } finally {
      setLoading(false);
    }
  };

  const handleLockUnlock = async (user, minutes) => {
    try {
      setIsSubmitting(true);
      const res = await api.post(`/users/${user.id}/lock`, { minutes });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsLockModalOpen(false);
        fetchSecurityData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update account lock status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeSessions = async (user) => {
    if (!window.confirm(`Are you sure you want to revoke all active sessions for ${user.username}? They will be logged out of all devices immediately.`)) {
      return;
    }
    
    try {
      const res = await api.delete(`/users/${user.id}/sessions`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchSecurityData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke sessions');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const isLocked = (lockedUntil) => {
    if (!lockedUntil) return false;
    return new Date(lockedUntil) > new Date();
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading Security Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">Security Center</h1>
          <p className="text-slate-500 font-medium">Global security overview and audit logs</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchSecurityData} className="px-6">
          Refresh Data
        </Button>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-5 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Users</p>
            <p className="text-2xl font-black text-slate-800">{stats.total_users}</p>
          </div>
        </Card>
        
        <Card className="p-5 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Unlock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Active</p>
            <p className="text-2xl font-black text-slate-800">{stats.active_accounts}</p>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Lock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Locked</p>
            <p className="text-2xl font-black text-slate-800">{stats.locked_accounts}</p>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Disabled</p>
            <p className="text-2xl font-black text-slate-800">{stats.disabled_accounts}</p>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Monitor size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Online</p>
            <p className="text-2xl font-black text-slate-800">{stats.online_users}</p>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
            <PowerOff size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Offline</p>
            <p className="text-2xl font-black text-slate-800">{stats.offline_users}</p>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm flex items-center gap-4 col-span-2">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Activity size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Last System Activity</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {formatDate(stats.last_activity)}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm mb-8">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${
                activeTab === 'users' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              User Security Status
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${
                activeTab === 'logs' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Global Audit Logs
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <div>
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Username</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Status</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Online Status</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Login</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.slice((usersPage - 1) * limit, usersPage * limit).map((u) => {
                    const locked = isLocked(u.locked_until);
                    const disabled = !u.is_active;
                    const online = parseInt(u.active_sessions || 0) > 0;
                    
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                              {u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{u.username}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {disabled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-2 h-2 rounded-full bg-slate-500"></span> Disabled
                            </span>
                          ) : locked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span> Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {online ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-400 border border-slate-100">
                              <span className="w-2 h-2 rounded-full bg-slate-300"></span> Offline
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                          {formatDate(u.last_login)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {locked ? (
                              <button
                                onClick={() => handleLockUnlock(u, 0)}
                                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Unlock Account"
                              >
                                <Unlock size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => { setSelectedUser(u); setIsLockModalOpen(true); }}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Lock Account"
                              >
                                <Lock size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleRevokeSessions(u)}
                              disabled={parseInt(u.active_sessions || 0) === 0}
                              className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-30"
                              title="Revoke All Sessions"
                            >
                              <PowerOff size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        No users found matching "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination 
              page={usersPage} 
              limit={limit} 
              total={filteredUsers.length} 
              totalPages={Math.ceil(filteredUsers.length / limit)} 
              onPageChange={(newPage) => setUsersPage(newPage)} 
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actor</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.slice((logsPage - 1) * limit, logsPage * limit).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-6 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap text-sm font-medium text-slate-700">
                        {log.actor_username || 'System'}
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap text-sm text-slate-500">
                        {log.target_user_id || '-'}
                      </td>
                      <td className="py-3 px-6 text-sm text-slate-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-3 px-6 text-xs text-slate-400">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        No audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination 
              page={logsPage} 
              limit={limit} 
              total={auditLogs.length} 
              totalPages={Math.ceil(auditLogs.length / limit)} 
              onPageChange={(newPage) => setLogsPage(newPage)} 
            />
          </div>
        )}
      </Card>

      {/* Lock Account Modal */}
      <Modal
        isOpen={isLockModalOpen}
        onClose={() => !isSubmitting && setIsLockModalOpen(false)}
        title="Lock User Account"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-medium flex gap-3">
              <AlertTriangle className="shrink-0 text-red-500" size={20} />
              <p>Locking this account will prevent the user from logging in until the lock expires or is manually removed.</p>
            </div>
            
            <div>
              <p className="font-bold text-slate-800 mb-1">Target User</p>
              <p className="text-slate-500">{selectedUser.username} ({selectedUser.email})</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Lock Duration (Minutes)</label>
              <select
                value={lockDuration}
                onChange={(e) => setLockDuration(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
              >
                <option value={15}>15 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={1440}>24 Hours</option>
                <option value={10080}>7 Days</option>
                <option value={525600}>Permanent (1 Year)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <Button 
                onClick={() => handleLockUnlock(selectedUser, lockDuration)}
                disabled={isSubmitting}
                className="px-6 py-2.5 shadow-md bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? 'Locking...' : 'Lock Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default AdminSecurityCenter;
