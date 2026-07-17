import api from './api';

export const getPresence = async () => {
  const response = await api.get('/presence');
  return response.data.data;
};

export const getPresenceById = async (id) => {
  const response = await api.get(`/presence/${id}`);
  return response.data.data;
};

export const createPresence = async (presenceData) => {
  const response = await api.post('/presence', presenceData);
  return response.data.data;
};

export const updatePresence = async (id, presenceData) => {
  const response = await api.put(`/presence/${id}`, presenceData);
  return response.data.data;
};

export const deletePresence = async (id) => {
  const response = await api.delete(`/presence/${id}`);
  return response.data.data;
};

export const checkIn = async (employeeId) => {
  const response = await api.post(`/presence/check-in/${employeeId}`);
  return response.data.data;
};

export const checkOut = async (employeeId) => {
  const response = await api.put(`/presence/check-out/${employeeId}`);
  return response.data.data;
};

export const getTodayAttendance = async (params = { page: 1, limit: 10, search: '' }) => {
  const response = await api.get('/presence/today', { params });
  return response.data;
};

export const verifyFace = async (employeeId, image) => {
  const response = await api.post('/presence/verify-face', { employeeId, image });
  return response.data; // { success, match, confidence, liveness, faceToken }
};

export const verifyQr = async (qrToken) => {
  const response = await api.post('/presence/verify-qr', { qrToken });
  return response.data; // { success, valid }
};

export const checkInWithAI = async (faceToken, qrToken, deviceInfo) => {
  const response = await api.post('/presence/check-in', { faceToken, qrToken, deviceInfo });
  return response.data.data;
};

export const checkOutWithAI = async (faceToken, qrToken, deviceInfo) => {
  const response = await api.post('/presence/check-out', { faceToken, qrToken, deviceInfo });
  return response.data.data;
};

export const createQr = async () => {
  const response = await api.post('/presence/create-qr');
  return response.data; // { success, qrToken, expiresAt }
};
