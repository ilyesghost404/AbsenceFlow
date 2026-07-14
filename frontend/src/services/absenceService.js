import api from './api';

export const getAbsences = async () => {
  const response = await api.get('/absences');
  return response.data.data;
};

export const getAbsencesByDate = async (date) => {
  const response = await api.get(`/absences/date/${date}`);
  return response.data.data;
};

export const createAbsence = async (absence) => {
  const response = await api.post('/absences', absence);
  return response.data;
};

export const updateAbsence = async (id, absence) => {
  const response = await api.put(`/absences/${id}`, absence);
  return response.data;
};

export const deleteAbsence = async (id) => {
  const response = await api.delete(`/absences/${id}`);
  return response.data.data;
};

export const validateAbsence = async (id) => {
  const response = await api.put(`/absences/${id}/validate`);
  return response.data.data;
};

export const rejectAbsence = async (id) => {
  const response = await api.put(`/absences/${id}/reject`);
  return response.data.data;
};
