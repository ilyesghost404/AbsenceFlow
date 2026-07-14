import api from './api';

export const getAttendance = async (employeeId, year, month) => {
  const response = await api.get(`/attendance/${employeeId}/${year}/${month}`);
  return response.data.data;
};

export const getAnomalies = async (params = { page: 1, limit: 10, search: '' }) => {
  const response = await api.get('/attendance/anomalies', { params });
  return response.data;
};

export const validateAnomaly = async (id, data) => {
  const response = await api.put(`/attendance/anomalies/${id}/validate`, data);
  return response.data.data;
};
