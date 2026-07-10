import api from "./api";

// Legacy – used by EmployeeDashboard
export const getDashboardStats = async () => {
  const response = await api.get("/dashboard");
  return response.data.data;
};

// Admin-specific dashboard stats
export const getAdminDashboardStats = async () => {
  const response = await api.get("/dashboard/admin");
  return response.data.data;
};

// Global user search for admin dashboard
export const searchUsers = async (query) => {
  const response = await api.get(`/dashboard/admin/search?q=${encodeURIComponent(query)}`);
  return response.data.data;
};

// System health check
export const getSystemHealth = async () => {
  const response = await api.get("/dashboard/health");
  return response.data.data;
};
