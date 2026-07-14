import api from "./api";

export const getHolidays = async (params = {}) => {
  const response = await api.get("/holidays", { params });
  return response.data;
};

export const createHoliday = async (holidayData) => {
  const response = await api.post("/holidays", holidayData);
  return response.data.data;
};

export const updateHoliday = async (id, holidayData) => {
  const response = await api.put(`/holidays/${id}`, holidayData);
  return response.data.data;
};

export const deleteHoliday = async (id) => {
  const response = await api.delete(`/holidays/${id}`);
  return response.data.data;
};
