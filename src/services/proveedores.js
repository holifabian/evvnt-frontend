import api from './api';

export const listar = (filtros = {}) => api.get('/proveedores', { params: filtros });
export const obtener = (id) => api.get(`/proveedores/${id}`);
export const crear = (datos) => api.post('/proveedores', datos);
export const actualizar = (datos) => api.put('/proveedores', datos);
export const miPerfil = () => api.get('/proveedores/mi-perfil');

