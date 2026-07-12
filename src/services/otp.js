import api from './api';

export const generarOTP = () => api.post('/otp/generar');
export const verificarOTP = (codigo) => api.post('/otp/verificar', { codigo });

