import api from './api';

export const listar = (filtros = {}) => api.get('/proveedores', { params: filtros });
export const obtener = (id) => api.get(`/proveedores/${id}`);
export const crear = (datos) => api.post('/proveedores', datos);
export const actualizar = (datos) => api.put('/proveedores', datos);
export const miPerfil = () => api.get('/proveedores/mi-perfil');
export const obtenerMedia = (id) => api.get(`/proveedores/${id}/media`);
export const subirMedia = (id, formData, onUploadProgress) =>
  api.post(`/proveedores/${id}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });
export const eliminarMedia = (id, mediaId) => api.delete(`/proveedores/${id}/media/${mediaId}`);
export const reordenarMedia = (id, mediaOrden) => api.put(`/proveedores/${id}/media/reorder`, { mediaOrden });

