import axios from 'axios';

// Use direct URL for Desktop (Electron), but use local proxy '/api' for Web
const baseURL = import.meta.env.VITE_IS_DESKTOP 
  ? (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api') 
  : '/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Prevent redirect to login if we are already on a public page
      const publicPaths = ['/login', '/activate-account', '/forgot-password', '/reset-password', '/verify-reset-code', '/verify-email'];
      const currentPath = window.location.pathname;
      const currentHash = window.location.hash;
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path) || currentHash.includes(path));
      
      const isDesktop = import.meta.env.VITE_IS_DESKTOP;
      
      if (!isPublicPath) {
        if (isDesktop) {
          window.location.hash = '#/login?expired=true';
        } else {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

