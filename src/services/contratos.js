import api from './api';

export const crear = (datos) => api.post('/contratos', datos);
export const listar = () => api.get('/contratos');
export const obtener = (id) => api.get(`/contratos/${id}`);
export const checkin = (id) => api.put(`/contratos/${id}/checkin`);
export const descargarPDF = async (id) => {
  const res = await api.get(`/contratos/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `contrato-evvnt-${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

