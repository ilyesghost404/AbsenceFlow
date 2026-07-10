import api from './api';

// ─── Profile ────────────────────────────────────────────────────────────────
export const getProfile = async () => {
  const res = await api.get('/settings/profile');
  return res.data.data;
};

export const updateProfile = async (data) => {
  const res = await api.put('/settings/profile', data);
  return res.data.data;
};

// ─── Notifications ──────────────────────────────────────────────────────────
export const getNotifications = async () => {
  const res = await api.get('/settings/notifications');
  return res.data.data;
};

export const updateNotifications = async (data) => {
  const res = await api.put('/settings/notifications', data);
  return res.data.data;
};

// ─── Appearance ─────────────────────────────────────────────────────────────
export const getAppearance = async () => {
  const res = await api.get('/settings/appearance');
  return res.data.data;
};

export const updateAppearance = async (data) => {
  const res = await api.put('/settings/appearance', data);
  return res.data.data;
};

// ─── Security ───────────────────────────────────────────────────────────────
export const getSecurityInfo = async () => {
  const res = await api.get('/settings/security');
  return res.data.data;
};

export const changePassword = async (data) => {
  const res = await api.put('/settings/password', data);
  return res.data;
};
