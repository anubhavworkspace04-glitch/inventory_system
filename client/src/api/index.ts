import axios from 'axios';

// Use relative /api so Vite dev proxy forwards to backend (port 5000).
// In production, the Express server serves /api from the same origin.
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // ready for future JWT cookies
});

// Request interceptor to attach bearer token
apiClient.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional response interceptor to handle errors cleanly
apiClient.interceptors.response.use(
  (response: any) => response.data,
  (error: any) => {
    // Standardize error formats
    const apiError = error.response?.data || {
      success: false,
      message: 'Network error or backend server is offline.'
    };
    return Promise.reject(apiError);
  }
);
