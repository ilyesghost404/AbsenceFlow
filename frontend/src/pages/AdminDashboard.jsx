import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, UserX, Shield, Briefcase, UserCircle,
  UserPlus, TrendingUp, AlertTriangle, Activity, Clock,
  Database, Server, Wifi, CheckCircle2, XCircle, Search,
  Plus, Download, Upload, Settings, RefreshCw, Eye,
  LogIn, LogOut, Key, ToggleLeft, ToggleRight, Trash2,
  ChevronRight, Loader2, WifiOff, CircleDot
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
  PieChart as RechartsPieChart, Pie, Legend
} from 'recharts';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import {
  getAdminDashboardStats,
  searchUsers,
  getSystemHealth
} from '../services/dashboardService';

// ─── Colour palette ────────────────────────────────────────────────────────────
const ROLE_COLORS   = { admin: '#7c3aed', manager: '#2563eb', employee: '#0891b2' };
const CHART_COLORS  = ['#7c3aed', '#2563eb', '#0891b2', '#0d9488', '#d97706', '#dc2626'];

// ─── Activity icon & colour map ────────────────────────────────────────────────
const ACTION_META = {
  user_created:     { icon: UserPlus,    color: 'text-emerald-600', bg: 'bg-emerald-50',  label: 'User Created' },
  user_updated:     { icon: UserCircle,  color: 'text-blue-600',    bg: 'bg-blue-50',     label: 'User Updated' },
  user_deleted:     { icon: Trash2,      color: 'text-red-600',     bg: 'bg-red-50',      label: 'User Deleted' },
  role_changed:     { icon: Shield,      color: 'text-violet-600',  bg: 'bg-violet-50',   label: 'Role Changed' },
  account_enabled:  { icon: ToggleRight, color: 'text-emerald-600', bg: 'bg-emerald-50',  label: 'Account Enabled' },
  account_disabled: { icon: ToggleLeft,  color: 'text-amber-600',   bg: 'bg-amber-50',    label: 'Account Disabled' },
  password_changed: { icon: Key,         color: 'text-orange-600',  bg: 'bg-orange-50',   label: 'Password Changed' },
  login:            { icon: LogIn,       color: 'text-sky-600',     bg: 'bg-sky-50',      label: 'Login' },
  logout:           { icon: LogOut,      color: 'text-slate-600',   bg: 'bg-slate-50',    label: 'Logout' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const getInitials = (fullName, username) => {
  if (fullName && fullName.trim() && fullName.trim() !== ' ') {
    const parts = fullName.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (username || '?').slice(0, 2).toUpperCase();
};

const getRoleBadge = (role) => {
  const map = {
    admin:    'bg-violet-100 text-violet-700 border-violet-200',
    manager:  'bg-blue-100   text-blue-700   border-blue-200',
    employee: 'bg-sky-100    text-sky-700    border-sky-200',
  };
  return map[role] || 'bg-slate-100 text-slate-700 border-slate-200';
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <Card className="animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <div className="h-3 bg-slate-200 rounded w-24" />
        <div className="h-8 bg-slate-200 rounded w-16" />
      </div>
      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
    </div>
  </Card>
);



const HealthBadge = ({ status, latency }) => {
  const isHealthy = status === 'healthy';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
      isHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
      {isHealthy ? 'Online' : 'Error'}
      {latency != null && <span className="opacity-60 ml-1">{latency}ms</span>}
    </div>
  );
};

const CustomTooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminDashboard = ({ onAction }) => {
  const navigate = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [health,   setHealth]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error,    setError]    = useState(null);
  const [now,      setNow]      = useState(new Date());

  // Search state
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const searchRef = useRef(null);
  const searchDebounce = useRef(null);

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Click outside search ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch main stats ───────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
      setError('Failed to load dashboard data.');
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch health ───────────────────────────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const data = await getSystemHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchHealth();
    // Refresh health every 30 s
    const healthInterval = setInterval(fetchHealth, 30000);
    return () => clearInterval(healthInterval);
  }, [fetchStats, fetchHealth]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchDebounce.current);
    if (!val.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await searchUsers(val);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  };

  // ── Chart data ─────────────────────────────────────────────────────────────
  const userGrowthData = stats?.userGrowth?.map(row => ({
    name:  row.month_label,
    users: parseInt(row.count),
  })) ?? [];

  const roleData = stats?.roleDistribution?.map(row => ({
    name:  row.role.charAt(0).toUpperCase() + row.role.slice(1),
    value: parseInt(row.count),
  })) ?? [];

  const deptData = stats?.deptDistribution?.map(row => ({
    name:  row.department,
    users: parseInt(row.count),
  })) ?? [];

  // ── System status message ──────────────────────────────────────────────────
  const systemOk = health && health.database?.status === 'healthy' && health.api?.status === 'healthy';
  const statusMsg = !health
    ? 'Checking system status…'
    : systemOk
    ? 'All systems operational.'
    : 'One or more services may need attention.';

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pb-10 space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-4 bg-slate-200 rounded w-48" />
        </div>
        {/* Stat card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="h-80 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-40 mb-6" />
              <div className="h-56 bg-slate-100 rounded-xl" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <WifiOff className="text-red-400" size={36} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load dashboard</h2>
        <p className="text-slate-500 mb-6 max-w-sm">{error}</p>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-12 space-y-8">

      {/* ── Welcome Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, <span className="text-blue-600">Admin</span> 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${
          systemOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <CircleDot size={14} className={systemOk ? 'text-emerald-500' : 'text-amber-500'} />
          {statusMsg}
        </div>
      </div>

      {/* ── Global Search ────────────────────────────────────────────────── */}
      <div className="relative" ref={searchRef}>
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            id="admin-search"
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search users by name, username, email, or department…"
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm
                       text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={16} />
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 max-w-2xl mt-2 bg-white rounded-3xl shadow-xl border border-slate-200 p-2 z-50 overflow-hidden max-h-96 overflow-y-auto">
            {searchResults.length === 0 && !searchLoading ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">
                No users found matching "{searchQuery}"
              </div>
            ) : (
              <ul>
                {searchResults.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 cursor-pointer
                               transition-colors border-b border-slate-50 last:border-0"
                    onClick={() => { navigate('/users'); setSearchOpen(false); }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: ROLE_COLORS[u.role] || '#64748b' }}
                    >
                      {getInitials(u.full_name, u.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {u.full_name && u.full_name.trim() && u.full_name.trim() !== ' '
                          ? u.full_name : u.username}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                      <StatusBadge status={u.role} />
                      <StatusBadge status={u.is_active ? 'Active' : 'Disabled'} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Access Action Bar ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: 'Manage Users',
              icon: Users,
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-600',
              accent: 'hover:text-blue-700',
              accentBar: 'bg-blue-500',
              action: () => navigate('/users'),
            },
            {
              label: 'Add User',
              icon: UserPlus,
              iconBg: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
              accent: 'hover:text-emerald-700',
              accentBar: 'bg-emerald-500',
              action: () => navigate('/users', { state: { action: 'add' } }),
            },
            {
              label: 'View System Activity',
              icon: Activity,
              iconBg: 'bg-indigo-50',
              iconColor: 'text-indigo-600',
              accent: 'hover:text-indigo-700',
              accentBar: 'bg-indigo-500',
              action: () => navigate('/admin/security'),
            },
            {
              label: 'Manage Roles & Permissions',
              icon: Key,
              iconBg: 'bg-violet-50',
              iconColor: 'text-violet-600',
              accent: 'hover:text-violet-700',
              accentBar: 'bg-violet-500',
              action: () => navigate('/users'),
            },
            {
              label: 'System Settings',
              icon: Settings,
              iconBg: 'bg-slate-100',
              iconColor: 'text-slate-600',
              accent: 'hover:text-slate-800',
              accentBar: 'bg-slate-500',
              action: () => navigate('/settings'),
            },
            {
              label: 'Database/System Health',
              icon: Server,
              iconBg: 'bg-teal-50',
              iconColor: 'text-teal-600',
              accent: 'hover:text-teal-700',
              accentBar: 'bg-teal-500',
              action: () => document.getElementById('system-health-section')?.scrollIntoView({ behavior: 'smooth' }),
            },
          ].map(({ label, icon: Icon, iconBg, iconColor, accent, accentBar, action }) => (
            <button
              key={label}
              onClick={action}
              className={`
                relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl
                text-slate-600 text-sm font-semibold border border-transparent
                transition-all duration-300 group
                ${accent} hover:bg-slate-50 hover:border-slate-100 hover:shadow-sm
              `}
            >
              {/* Icon bubble */}
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${iconBg} transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105
              `}>
                <Icon size={20} className={iconColor} />
              </div>
              <span className="text-center">{label}</span>
              {/* Coloured bottom accent on hover */}
              <span className={`
                absolute bottom-0 left-1/2 -translate-x-1/2
                h-1 w-0 ${accentBar} rounded-t-lg
                transition-all duration-300 group-hover:w-12
              `} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Statistics Cards Row 1 ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Users"       value={stats?.totalUsers}       icon={Users}        colorClass="text-blue-600"    bgClass="bg-blue-50"    />
        <StatsCard title="Active Accounts"   value={stats?.activeAccounts}   icon={UserCheck}    colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <StatsCard title="Disabled Accounts" value={stats?.disabledAccounts} icon={UserX}        colorClass="text-rose-600"    bgClass="bg-rose-50"     />
        <StatsCard title="Administrators"    value={stats?.admins}           icon={Shield}       colorClass="text-violet-600"  bgClass="bg-violet-50"  />
      </div>

      {/* ── Statistics Cards Row 2 ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Managers"          value={stats?.managers}         icon={Briefcase}    colorClass="text-blue-600"    bgClass="bg-blue-50"    />
        <StatsCard title="Employees"         value={stats?.employees}        icon={UserCircle}   colorClass="text-sky-600"     bgClass="bg-sky-50"     />
        <StatsCard title="New Users This Month" value={stats?.newThisMonth}  icon={UserPlus}     colorClass="text-teal-600"    bgClass="bg-teal-50"    trend={{value: `+${stats?.newThisWeek ?? 0}`, label: 'this week', positive: true}} />
        <StatsCard title="Logged In Today"   value={stats?.loggedInToday}    icon={LogIn}        colorClass="text-indigo-600"  bgClass="bg-indigo-50"  />
      </div>

      {/* ── Charts Row 1: User Growth + Role Distribution ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <Card className="lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            User Growth
          </h3>
          <p className="text-xs text-slate-400 mb-5">New registrations — last 12 months</p>
          {userGrowthData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              No registration data available
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#dbeafe' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Role Distribution Donut */}
        <Card>
          <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Shield className="text-violet-600" size={20} />
            Role Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">Users by role</p>
          {roleData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={roleData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  <Legend iconType="circle" iconSize={8} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ── Charts Row 2: Department + Account Status Overview ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <Card className="lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Briefcase className="text-blue-600" size={20} />
            Department Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-5">Users per department</p>
          {deptData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No department data</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  <Bar dataKey="users" radius={[8, 8, 0, 0]}>
                    {deptData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Account Status Overview */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-teal-600" size={20} />
            Account Overview
          </h3>
          {[
            { label: 'Active Accounts',       value: stats?.statusOverview?.active,           color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Disabled Accounts',     value: stats?.statusOverview?.disabled,         color: 'text-red-500',     bg: 'bg-red-50' },
            { label: 'Never Logged In',       value: stats?.statusOverview?.neverLoggedIn,    color: 'text-amber-600',   bg: 'bg-amber-50' },
            { label: 'Created This Week',     value: stats?.statusOverview?.createdThisWeek,  color: 'text-blue-600',    bg: 'bg-blue-50' },
            { label: 'Created This Month',    value: stats?.statusOverview?.createdThisMonth, color: 'text-violet-600',  bg: 'bg-violet-50' },
            { label: 'Failed Logins (24h)',   value: stats?.failedLogins24h,                  color: 'text-rose-600',    bg: 'bg-rose-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${bg}`}>
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <span className={`text-lg font-bold ${color}`}>{value ?? 0}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* ── Activity + Recent Users ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Account Activity */}
        <Card id="activity-logs-section" className="lg:col-span-2 overflow-hidden" noPadding>
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-blue-600" size={18} />
              Recent Activity
            </h3>
            <span className="text-xs text-slate-400">Latest 20 events</span>
          </div>

          <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
            {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                <Activity size={32} className="mx-auto mb-3 opacity-30" />
                No activity recorded yet.<br />
                <span className="text-xs">Actions like creating or updating users will appear here.</span>
              </div>
            ) : (
              stats.recentActivity.map((event, i) => {
                const meta = ACTION_META[event.action_type] || {
                  icon: CircleDot,
                  color: 'text-slate-600',
                  bg:    'bg-slate-50',
                  label: event.action_type
                };
                const IconComp = meta.icon;
                return (
                  <div
                    key={event.id || i}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <IconComp size={15} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{meta.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
                        {event.description || '—'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                      {formatRelativeTime(event.created_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Recent Users Table */}
        <Card className="lg:col-span-3 overflow-hidden" noPadding>
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" size={18} />
              Recent Users
            </h3>
            <button
              onClick={() => navigate('/users')}
              className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold
                         hover:text-blue-700 transition-colors"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {!stats?.recentUsers || stats.recentUsers.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                No users found
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => navigate('/users')}
                    >
                      {/* Avatar + Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: ROLE_COLORS[u.role] || '#64748b' }}
                          >
                            {getInitials(u.full_name, u.username)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate max-w-[140px]">
                              {u.full_name && u.full_name.trim() && u.full_name.trim() !== ' '
                                ? u.full_name : u.username}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-[140px]">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={u.role} type="outline" />
                      </td>
                      {/* Department */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-slate-600 text-xs">{u.department || '—'}</span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                      <StatusBadge status={u.is_active ? 'Active' : 'Disabled'} type="dot" />
                      </td>
                      {/* Joined */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-slate-400">
                          {new Date(u.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* ── System Health ─────────────────────────────────────────────────── */}
      <Card id="system-health-section">
        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Server className="text-blue-600" size={20} />
          System Health
          {healthLoading && <Loader2 size={14} className="text-slate-400 animate-spin ml-1" />}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label:   'Database Connection',
              icon:    Database,
              status:  health?.database?.status  ?? (healthLoading ? 'checking' : 'unknown'),
              latency: health?.database?.latency,
              detail:  'PostgreSQL',
            },
            {
              label:   'Backend API',
              icon:    Wifi,
              status:  health?.api?.status ?? (healthLoading ? 'checking' : 'unknown'),
              latency: health?.api?.latency,
              detail:  'Express.js',
            },
            {
              label:   'Server Status',
              icon:    Server,
              status:  health?.server?.status ?? (healthLoading ? 'checking' : 'unknown'),
              latency: null,
              detail:  health?.server?.uptime != null
                ? `Uptime ${Math.floor(health.server.uptime / 3600)}h ${Math.floor((health.server.uptime % 3600) / 60)}m`
                : 'Node.js',
            },
            {
              label:   'PostgreSQL',
              icon:    Database,
              status:  health?.database?.status ?? (healthLoading ? 'checking' : 'unknown'),
              latency: health?.database?.latency,
              detail:  'Database engine',
            },
          ].map(({ label, icon: Icon, status, latency, detail }) => {
            const isHealthy  = status === 'healthy';
            const isChecking = status === 'checking';
            return (
              <div
                key={label}
                className={`flex flex-col gap-3 p-5 rounded-xl border transition-all ${
                  isHealthy  ? 'bg-emerald-50/60 border-emerald-100'  :
                  isChecking ? 'bg-slate-50 border-slate-100'         :
                               'bg-red-50/60  border-red-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isHealthy  ? 'bg-emerald-100' :
                    isChecking ? 'bg-slate-100'   :
                                 'bg-red-100'
                  }`}>
                    <Icon size={20} className={
                      isHealthy  ? 'text-emerald-600' :
                      isChecking ? 'text-slate-400'   :
                                   'text-red-500'
                    } />
                  </div>
                  {isChecking ? (
                    <Loader2 size={14} className="text-slate-400 animate-spin" />
                  ) : (
                    <HealthBadge status={status} latency={latency} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
