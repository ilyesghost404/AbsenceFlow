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
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Settings</h1>
        <p className="text-slate-500 text-base">Manage your account preferences and application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ─── Sidebar ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <Card className="p-4 sticky top-6 shadow-sm border border-slate-100">
            <div className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-left group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 -translate-y-0.5'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      <Icon size={22} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 transition-colors'} />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-base mb-0.5 ${isActive ? 'text-white' : 'text-slate-800'}`}>{section.label}</p>
                      <p className={`text-sm truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
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
            <Card className="overflow-hidden shadow-sm border border-slate-100" noPadding>
              {/* Header */}
              <div className="px-10 py-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-5">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-blue-500/20">
                    {(user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{profile?.full_name || user?.username || 'User'}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-sm px-3 py-1 rounded-full border font-bold ${getRoleBadge(user?.role).bg}`}>
                        {getRoleBadge(user?.role).label}
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-10">
                {profileLoading ? <FormSkeleton /> : (
                  <form onSubmit={handleProfileSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-base font-bold text-slate-800 mb-2">Username</label>
                        <input
                          type="text"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm(f => ({ ...f, username: e.target.value }))}
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-base text-slate-800 font-medium
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-base font-bold text-slate-800 mb-2">Email</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-base text-slate-800 font-medium
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Read-only info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-base font-bold text-slate-800 mb-2">Role</label>
                        <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-base font-medium text-slate-500 capitalize shadow-inner">
                          {getRoleBadge(user?.role).label}
                        </div>
                      </div>
                      {profile?.department && (
                        <div>
                          <label className="block text-base font-bold text-slate-800 mb-2">Department</label>
                          <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-base font-medium text-slate-500 shadow-inner">
                            {profile.department}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl text-base font-bold
                                   hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {profileSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
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
            <Card className="overflow-hidden shadow-sm border border-slate-100" noPadding>
              <div className="px-10 py-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  <Bell size={26} className="text-blue-600" />
                  Notification Preferences
                </h2>
                <p className="text-base font-medium text-slate-500 mt-2">Choose which notifications you want to receive</p>
              </div>

              <div className="p-10">
                {notifsLoading ? <FormSkeleton /> : (
                  <div className="space-y-4">
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
                        className="flex items-center justify-between gap-6 px-6 py-6 rounded-2xl border border-slate-100 bg-white
                                   hover:bg-slate-50 hover:shadow-sm hover:border-slate-200 transition-all group cursor-pointer"
                        onClick={() => handleNotifToggle(key, !(notifs?.[key] ?? true))}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} transition-transform group-hover:scale-110 shadow-sm`}>
                            <Icon size={24} className={color} />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900">{label}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">{desc}</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Toggle
                            checked={notifs?.[key] ?? true}
                            onChange={(val) => handleNotifToggle(key, val)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ═══════════════════════ APPEARANCE ═════════════════════════ */}
          {activeSection === 'appearance' && (
            <div className="space-y-8">
              {/* Theme */}
              <Card className="overflow-hidden shadow-sm border border-slate-100" noPadding>
                <div className="px-10 py-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <Palette size={26} className="text-blue-600" />
                    Theme
                  </h2>
                  <p className="text-base font-medium text-slate-500 mt-2">Select your preferred color scheme</p>
                </div>

                <div className="p-10">
                  {appearanceLoading ? <FormSkeleton /> : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {[
                        { id: 'light',  label: 'Light',  icon: Sun,     desc: 'Clean and bright' },
                        { id: 'dark',   label: 'Dark',   icon: Moon,    desc: 'Easy on the eyes' },
                        { id: 'system', label: 'System', icon: Monitor, desc: 'Match OS setting' },
                      ].map(({ id, label, icon: Icon, desc }) => (
                        <button
                          key={id}
                          onClick={() => handleAppearanceChange('theme', id)}
                          className={`
                            flex flex-col items-center gap-4 p-8 rounded-3xl border-2 transition-all duration-300
                            ${appearance?.theme === id
                              ? 'border-blue-500 bg-blue-50/80 shadow-lg shadow-blue-500/20 scale-105'
                              : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'
                            }
                          `}
                        >
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                            appearance?.theme === id ? 'bg-blue-100' : 'bg-slate-100'
                          }`}>
                            <Icon size={28} className={appearance?.theme === id ? 'text-blue-600' : 'text-slate-500'} />
                          </div>
                          <div className="text-center">
                            <p className={`font-bold text-lg ${appearance?.theme === id ? 'text-blue-900' : 'text-slate-800'}`}>{label}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Interface Settings */}
              <Card className="overflow-hidden shadow-sm border border-slate-100" noPadding>
                <div className="px-10 py-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <LayoutGrid size={26} className="text-blue-600" />
                    Interface Settings
                  </h2>
                  <p className="text-base font-medium text-slate-500 mt-2">Customize how WinSAP looks and feels</p>
                </div>
                <div className="p-10 space-y-4">
                  {!appearanceLoading && (
                    <>
                      <div className="flex items-center justify-between gap-6 px-6 py-6 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:shadow-sm hover:border-slate-200 transition-all cursor-pointer group" onClick={() => handleAppearanceChange('compact_mode', !(appearance?.compact_mode))}>
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <LayoutGrid size={24} className="text-slate-600" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900">Compact Mode</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">Reduce spacing to fit more content on screen</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Toggle
                            checked={appearance?.compact_mode}
                            onChange={(val) => handleAppearanceChange('compact_mode', val)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-6 px-6 py-6 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:shadow-sm hover:border-slate-200 transition-all cursor-pointer group" onClick={() => handleAppearanceChange('sidebar_collapsed', !(appearance?.sidebar_collapsed))}>
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <PanelLeftClose size={24} className="text-slate-600" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900">Collapse Sidebar by Default</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">Start with a minimized navigation menu</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Toggle
                            checked={appearance?.sidebar_collapsed}
                            onChange={(val) => handleAppearanceChange('sidebar_collapsed', val)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════════════ SECURITY ═══════════════════════════ */}
          {activeSection === 'security' && (
            <div className="space-y-8">

              {/* Change Password */}
              <Card className="overflow-hidden shadow-sm border border-slate-100" noPadding>
                <div className="px-10 py-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <Lock size={26} className="text-blue-600" />
                    Change Password
                  </h2>
                  <p className="text-base font-medium text-slate-500 mt-2">Keep your account secure with a strong password</p>
                </div>

                <div className="p-10">
                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
                    {/* Current Password */}
                    <div>
                      <label className="block text-base font-bold text-slate-800 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          value={pwForm.current_password}
                          onChange={(e) => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                          className="w-full px-5 py-3.5 pr-12 bg-white border border-slate-200 rounded-xl text-base font-medium
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showCurrentPw ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-base font-bold text-slate-800 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          value={pwForm.new_password}
                          onChange={(e) => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                          className="w-full px-5 py-3.5 pr-12 bg-white border border-slate-200 rounded-xl text-base font-medium
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                          placeholder="Enter new password (min 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewPw ? <EyeOff size={20} /> : <Eye size={20} />}
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
                      <label className="block text-base font-bold text-slate-800 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? 'text' : 'password'}
                          value={pwForm.confirm_password}
                          onChange={(e) => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                          className={`w-full px-5 py-3.5 pr-12 bg-white border rounded-xl text-base font-medium shadow-sm
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                                     ${pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password
                                       ? 'border-red-300' : 'border-slate-200'}`}
                          placeholder="Re-enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password && (
                        <p className="text-sm font-semibold text-red-500 mt-2 flex items-center gap-1.5">
                          <AlertTriangle size={16} /> Passwords do not match
                        </p>
                      )}
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={pwSaving || !pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password}
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
