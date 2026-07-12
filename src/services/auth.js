// src/services/auth.js
import api from './api';

export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (datos) => api.post('/auth/register', datos);
export const getMe = () => api.get('/auth/me');

