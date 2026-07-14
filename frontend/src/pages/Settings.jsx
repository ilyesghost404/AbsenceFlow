import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import {
  User, Bell, Palette, Shield, Save, Loader2,
  Eye, EyeOff, Sun, Moon, Monitor, LayoutGrid, PanelLeftClose,
  Mail, CalendarCheck, CalendarRange, FileBarChart,
  LogOut, Clock, Globe, CheckCircle2, AlertTriangle, Lock
} from 'lucide-react';
import {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications,
  getAppearance,
  updateAppearance,
  getSecurityInfo,
  changePassword,
} from '../services/settingsService';

// ─── Toggle Component ────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none
      ${checked ? 'bg-blue-600' : 'bg-slate-300'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span className={`
      inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200
      ${checked ? 'translate-x-6' : 'translate-x-1'}
    `} />
  </button>
);

// ─── Password Strength ──────────────────────────────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { level: 3, label: 'Good', color: 'bg-blue-500' };
  return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
};

// ─── Main Component ─────────────────────────────────────────────────────────
const Settings = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');

  // ── Profile State ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ username: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Notification State ─────────────────────────────────────────────────
  const [notifs, setNotifs] = useState(null);
  const [notifsLoading, setNotifsLoading] = useState(true);

  // ── Appearance State ───────────────────────────────────────────────────
  const [appearance, setAppearance] = useState({ theme: 'system', compact_mode: false, sidebar_collapsed: false });
  const [appearanceLoading, setAppearanceLoading] = useState(true);

  // ── Security State ─────────────────────────────────────────────────────
  const [security, setSecurity] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // ── Sections Config ────────────────────────────────────────────────────
  const sections = [
    { id: 'profile',       label: 'Profile',        icon: User,    desc: 'Manage your account' },
    { id: 'notifications', label: 'Notifications',  icon: Bell,    desc: 'Alert preferences' },
    { id: 'appearance',    label: 'Appearance',      icon: Palette, desc: 'Theme & layout' },
    { id: 'security',      label: 'Security',        icon: Shield,  desc: 'Password & session' },
  ];

  // ── Load Data On Tab Switch ────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const data = await getProfile();
      setProfile(data);
      setProfileForm({ username: data.username || '', email: data.email || '' });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadNotifs = useCallback(async () => {
    try {
      setNotifsLoading(true);
      const data = await getNotifications();
      setNotifs(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setNotifsLoading(false);
    }
  }, []);

  const loadAppearance = useCallback(async () => {
    try {
      setAppearanceLoading(true);
      const data = await getAppearance();
      setAppearance(data);
    } catch {
      toast.error('Failed to load appearance');
    } finally {
      setAppearanceLoading(false);
    }
  }, []);

  const loadSecurity = useCallback(async () => {
    try {
      setSecurityLoading(true);
      const data = await getSecurityInfo();
      setSecurity(data);
    } catch {
      toast.error('Failed to load security info');
    } finally {
      setSecurityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'profile') loadProfile();
    if (activeSection === 'notifications') loadNotifs();
    if (activeSection === 'appearance') loadAppearance();
    if (activeSection === 'security') loadSecurity();
  }, [activeSection, loadProfile, loadNotifs, loadAppearance, loadSecurity]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      await updateProfile(profileForm);
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleNotifToggle = async (key, value) => {
    const prev = { ...notifs };
    const updated = { ...notifs, [key]: value };
    setNotifs(updated); // optimistic
    try {
      await updateNotifications(updated);
      toast.success('Notification preference updated');
    } catch {
      setNotifs(prev); // revert
      toast.error('Failed to save preference');
    }
  };

  const handleAppearanceChange = async (key, value) => {
    const prev = { ...appearance };
    const updated = { ...appearance, [key]: value };
    setAppearance(updated);

    // Apply immediately to localStorage
    localStorage.setItem('absenceflow_theme', updated.theme);
    localStorage.setItem('absenceflow_compact', updated.compact_mode);
    localStorage.setItem('absenceflow_sidebar_collapsed', updated.sidebar_collapsed);

    // Apply data-theme attribute
    document.documentElement.setAttribute('data-theme', updated.theme);

    try {
      await updateAppearance(updated);
      toast.success('Appearance updated');
    } catch {
      setAppearance(prev);
      toast.error('Failed to save appearance');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      return toast.error('New passwords do not match');
    }
    if (pwForm.new_password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    try {
      setPwSaving(true);
      await changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const pwStrength = getPasswordStrength(pwForm.new_password);

  // ── Format Helpers ────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const map = {
      admin:    { bg: 'bg-violet-100 text-violet-700 border-violet-200', label: 'Administrator' },
      manager:  { bg: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Manager' },
      employee: { bg: 'bg-sky-100 text-sky-700 border-sky-200', label: 'Employee' },
    };
    return map[role] || { bg: 'bg-slate-100 text-slate-700', label: role };
  };

  // ── Skeleton ──────────────────────────────────────────────────────────
  const FormSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-5 bg-slate-200 rounded w-40" />
      <div className="space-y-4">
        <div className="h-10 bg-slate-200 rounded-xl" />
        <div className="h-10 bg-slate-200 rounded-xl" />
        <div className="h-10 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account preferences and application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ─── Sidebar ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <Card className="p-3 sticky top-6">
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-left group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}>
                      <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{section.label}</p>
                      <p className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {section.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ─── Content ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">

          {/* ═══════════════════════════ PROFILE ═══════════════════════════ */}
          {activeSection === 'profile' && (
            <Card className="overflow-hidden" noPadding>
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                    {(user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{profile?.full_name || user?.username || 'User'}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getRoleBadge(user?.role).bg}`}>
                        {getRoleBadge(user?.role).label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-8">
                {profileLoading ? <FormSkeleton /> : (
                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                        <input
                          type="text"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm(f => ({ ...f, username: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Read-only info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                        <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-500 capitalize">
                          {getRoleBadge(user?.role).label}
                        </div>
                      </div>
                      {profile?.department && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                          <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-500">
                            {profile.department}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold
                                   hover:bg-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {profileSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          )}

          {/* ═══════════════════════ NOTIFICATIONS ═══════════════════════ */}
          {activeSection === 'notifications' && (
            <Card className="overflow-hidden" noPadding>
              <div className="px-8 py-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Bell size={22} className="text-blue-600" />
                  Notification Preferences
                </h2>
                <p className="text-sm text-slate-500 mt-1">Choose which notifications you want to receive</p>
              </div>

              <div className="p-8">
                {notifsLoading ? <FormSkeleton /> : (
                  <div className="space-y-1">
                    {[
                      {
                        key: 'absence_notifications',
                        icon: CalendarCheck,
                        label: 'Absence Request Notifications',
                        desc: 'Get notified when absence requests are submitted',
                        color: 'text-blue-600', bg: 'bg-blue-50',
                      },
                      {
                        key: 'approval_notifications',
                        icon: CheckCircle2,
                        label: 'Approval / Rejection Notifications',
                        desc: 'Get notified when your requests are approved or rejected',
                        color: 'text-emerald-600', bg: 'bg-emerald-50',
                      },
                      {
                        key: 'holiday_notifications',
                        icon: CalendarRange,
                        label: 'Holiday Reminders',
                        desc: 'Receive reminders about upcoming public holidays',
                        color: 'text-violet-600', bg: 'bg-violet-50',
                      },
                      {
                        key: 'report_notifications',
                        icon: FileBarChart,
                        label: 'Report Notifications',
                        desc: 'Get notified when new reports are generated',
                        color: 'text-amber-600', bg: 'bg-amber-50',
                      },
                    ].map(({ key, icon: Icon, label, desc, color, bg }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 px-5 py-5 rounded-xl
                                   hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} transition-transform group-hover:scale-105`}>
                            <Icon size={18} className={color} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                          </div>
                        </div>
                        <Toggle
                          checked={notifs?.[key] ?? true}
                          onChange={(val) => handleNotifToggle(key, val)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ═══════════════════════ APPEARANCE ═════════════════════════ */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              {/* Theme */}
              <Card className="overflow-hidden" noPadding>
                <div className="px-8 py-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Palette size={22} className="text-blue-600" />
                    Theme
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Select your preferred color scheme</p>
                </div>

                <div className="p-8">
                  {appearanceLoading ? <FormSkeleton /> : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'light',  label: 'Light',  icon: Sun,     desc: 'Clean and bright' },
                        { id: 'dark',   label: 'Dark',   icon: Moon,    desc: 'Easy on the eyes' },
                        { id: 'system', label: 'System', icon: Monitor, desc: 'Match OS setting' },
                      ].map(({ id, label, icon: Icon, desc }) => (
                        <button
                          key={id}
                          onClick={() => handleAppearanceChange('theme', id)}
                          className={`
                            flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200
                            ${appearance.theme === id
                              ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                            }
                          `}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            appearance.theme === id ? 'bg-blue-100' : 'bg-slate-100'
                          }`}>
                            <Icon size={22} className={appearance.theme === id ? 'text-blue-600' : 'text-slate-500'} />
                          </div>
                          <div className="text-center">
                            <p className={`text-sm font-semibold ${
                              appearance.theme === id ? 'text-blue-700' : 'text-slate-700'
                            }`}>{label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                          </div>
                          {appearance.theme === id && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                              <CheckCircle2 size={14} className="text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Layout Options */}
              <Card className="overflow-hidden" noPadding>
                <div className="px-8 py-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <LayoutGrid size={20} className="text-blue-600" />
                    Layout
                  </h2>
                </div>
                <div className="p-8 space-y-1">
                  {!appearanceLoading && (
                    <>
                      <div className="flex items-center justify-between px-5 py-5 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <LayoutGrid size={18} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Compact Mode</p>
                            <p className="text-xs text-slate-400 mt-0.5">Reduce spacing and padding for more content</p>
                          </div>
                        </div>
                        <Toggle
                          checked={appearance.compact_mode}
                          onChange={(val) => handleAppearanceChange('compact_mode', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between px-5 py-5 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <PanelLeftClose size={18} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Sidebar Collapsed</p>
                            <p className="text-xs text-slate-400 mt-0.5">Show a minimal sidebar with icons only</p>
                          </div>
                        </div>
                        <Toggle
                          checked={appearance.sidebar_collapsed}
                          onChange={(val) => handleAppearanceChange('sidebar_collapsed', val)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════════════ SECURITY ═══════════════════════════ */}
          {activeSection === 'security' && (
            <div className="space-y-6">

              {/* Change Password */}
              <Card className="overflow-hidden" noPadding>
                <div className="px-8 py-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Lock size={22} className="text-blue-600" />
                    Change Password
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Keep your account secure with a strong password</p>
                </div>

                <div className="p-8">
                  <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          value={pwForm.current_password}
                          onChange={(e) => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 bg-white border border-slate-200 rounded-xl text-sm
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          value={pwForm.new_password}
                          onChange={(e) => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 bg-white border border-slate-200 rounded-xl text-sm
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter new password (min 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {/* Strength Bar */}
                      {pwForm.new_password && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map(n => (
                              <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${
                                n <= pwStrength.level ? pwStrength.color : 'bg-slate-200'
                              }`} />
                            ))}
                          </div>
                          <p className={`text-xs font-medium ${
                            pwStrength.level <= 1 ? 'text-red-600' :
                            pwStrength.level <= 2 ? 'text-amber-600' :
                            pwStrength.level <= 3 ? 'text-blue-600' : 'text-emerald-600'
                          }`}>
                            {pwStrength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? 'text' : 'password'}
                          value={pwForm.confirm_password}
                          onChange={(e) => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                          className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl text-sm
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                                     ${pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password
                                       ? 'border-red-300' : 'border-slate-200'}`}
                          placeholder="Re-enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertTriangle size={12} /> Passwords do not match
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={pwSaving || !pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold
                                   hover:bg-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {pwSaving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
              </Card>

              {/* Session Info */}
              <Card className="overflow-hidden" noPadding>
                <div className="px-8 py-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Globe size={20} className="text-blue-600" />
                    Session Information
                  </h2>
                </div>

                <div className="p-8">
                  {securityLoading ? <FormSkeleton /> : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                            <Shield size={18} className="text-violet-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Current Role</p>
                            <p className="text-sm font-semibold text-slate-800 capitalize">
                              {getRoleBadge(security?.role).label}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Clock size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Current Session</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(security?.current_login?.time)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Globe size={18} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Login IP</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {security?.current_login?.ip || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Clock size={18} className="text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Previous Login</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(security?.previous_login?.time)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={logout}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                                     text-red-600 bg-red-50 border border-red-100
                                     hover:bg-red-100 transition-all"
                        >
                          <LogOut size={16} />
                          Logout from current session
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
