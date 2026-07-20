import api from './api';

const buildParams = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });
  return params;
};

// Get comprehensive report statistics
export const getReportStats = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await api.get(`/reports/statistics?${params}`);
  return response.data.data;
};

// Get monthly absence evolution (last 12 months)
export const getMonthlyEvolution = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await api.get(`/reports/monthly-evolution?${params}`);
  return response.data.data;
};

// Get department-level absence statistics
export const getDepartmentStats = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await api.get(`/reports/departments?${params}`);
  return response.data.data;
};

// Get absence type distribution
export const getAbsenceTypes = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await api.get(`/reports/types?${params}`);
  return response.data.data;
};

// Get top-10 employee absence ranking
export const getEmployeeRanking = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await api.get(`/reports/ranking?${params}`);
  return response.data.data;
};

// Get paginated detailed absence list
export const getDetailedAbsences = async (filters = {}) => {
  const params = buildParams(filters);

  const response = await api.get(`/reports/detailed?${params}`);
  return response.data;
};

// Export absences to Excel (custom filter export) — triggers file download
export const exportToExcel = async (filters = {}) => {
  const params = buildParams(filters);

  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token');

  const response = await fetch(
    `${api.defaults.baseURL}/reports/export/excel?${params}`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to export Excel');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AbsenceFlow_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// Get monthly attendance matrix report data
export const getAttendanceMatrix = async (year, month) => {
  const response = await api.get(`/reports/attendance-matrix?year=${year}&month=${month}`);
  return response.data.data;
};

// Print current report view
export const printReport = () => {
  window.print();
};
