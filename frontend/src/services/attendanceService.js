import api from './api';

export const getAttendance = async (employeeId, year, month) => {
  const response = await api.get(`/attendance/${employeeId}/${year}/${month}`);
  return response.data.data;
};

export const getAnomalies = async () => {
  const response = await api.get('/attendance/anomalies');
  return response.data.data;
};

export const validateAnomaly = async (id, data) => {
  const response = await api.put(`/attendance/anomalies/${id}/validate`, data);
  return response.data.data;
};
