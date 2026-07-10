import api from './api';

export const getAttendance = async (employeeId, year, month) => {
  const response = await api.get(`/attendance/${employeeId}/${year}/${month}`);
  return response.data.data;
};
