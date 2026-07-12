import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 30000,
});

// Interceptor: agregar JWT a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('evvnt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('evvnt_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export const generarRecomendacion = (datos) => api.post('/recomendador', datos);

export default api;

