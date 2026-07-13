import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp, Calendar, DollarSign, Star, CheckCircle,
  QrCode, Crown, ArrowUp, BarChart3, Clock, MapPin, Download, User,
  Camera, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listar as listarContratos, checkin, descargarPDF } from '../services/contratos';
import { subirMedia, eliminarMedia, reordenarMedia } from '../services/proveedores';
import api from '../services/api';
import CalendarioDisponibilidad from '../components/CalendarioDisponibilidad';
import { showToast } from '../components/Toast';

export default function PanelProveedor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contratos, setContratos] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [proveedor, setProveedor] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [errorGallery, setErrorGallery] = useState('');
  const [signingContratoId, setSigningContratoId] = useState(null);
  const [provOtp, setProvOtp] = useState('');
  const [enviandoProvOtp, setEnviandoProvOtp] = useState(false);
  const [devOtpProvider, setDevOtpProvider] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (user.rol !== 'proveedor') { navigate('/panel-cliente'); return; }
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const [contRes, provRes] = await Promise.all([
        listarContratos(),
        api.get('/proveedores/mi-perfil'),
      ]);
      setContratos(contRes.data);
      setProveedor(provRes.data);

      const [resRes, dispRes, mediaRes] = await Promise.all([
        api.get(`/resenas/proveedor/${provRes.data.id}`),
        api.get(`/disponibilidad/${provRes.data.id}`),
        api.get(`/proveedores/${provRes.data.id}/media`)
      ]);
      setResenas(resRes.data);
      setDisponibilidad(dispRes.data);
      setGalleryMedia(mediaRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (contratoId) => {
    setProcesando(contratoId);
    try {
      await checkin(contratoId);
      showToast('Check-in registrado. El pago ha sido liberado.', 'success');
      cargar();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error en check-in', 'error');
    } finally {
      setProcesando(null);
    }
  };

  const handleConfirmarAnticipo = async (c) => {
    const anticipoVal = parseFloat(c.anticipo || 0).toFixed(2);
    if (!window.confirm(`¿Confirmas haber recibido el anticipo de USD $${anticipoVal} del cliente ${c.cliente_nombre || ''}?`)) {
      return;
    }
    setProcesando(c.id);
    try {
      await api.put(`/contratos/${c.id}/confirmar-anticipo`);
      showToast('Anticipo confirmado correctamente.', 'success');
      cargar();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al confirmar anticipo', 'error');
    } finally {
      setProcesando(null);
    }
  };

  const handleConfirmarPagoTotal = async (c) => {
    const total = parseFloat(c.precio_total || 0);
    const anticipo = parseFloat(c.anticipo || 0);
    const saldoVal = (total - anticipo).toFixed(2);
    if (!window.confirm(`¿Confirmas haber recibido el saldo de USD $${saldoVal} del cliente ${c.cliente_nombre || ''}? Esto marcará el contrato como completado.`)) {
      return;
    }
    setProcesando(c.id);
    try {
      await api.put(`/contratos/${c.id}/confirmar-pago-total`);
      showToast('Pago total confirmado y contrato completado.', 'success');
      cargar();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al confirmar pago total', 'error');
    } finally {
      setProcesando(null);
    }
  };

  const iniciarFirma = async (contratoId) => {
    setSigningContratoId(contratoId);
    setProvOtp('');
    setDevOtpProvider('');
    setEnviandoProvOtp(true);
    try {
      const res = await api.post('/otp/generar');
      if (res.data && res.data.fallback && res.data.codigo) {
        setDevOtpProvider(res.data.codigo);
        showToast('Modo desarrollo: código generado en pantalla', 'info');
      } else {
        showToast('Código OTP enviado a tu correo', 'success');
      }
    } catch (err) {
      showToast('Error al solicitar código OTP', 'error');
    } finally {
      setEnviandoProvOtp(false);
    }
  };

  const handleFirmarContrato = async (contratoId) => {
    if (provOtp.length !== 6) {
      showToast('El código OTP debe ser de 6 dígitos', 'warning');
      return;
    }
    setProcesando(contratoId);
    try {
      await api.put(`/contratos/${contratoId}/firmar-proveedor`, { otp_codigo: provOtp });
      showToast('¡Contrato firmado exitosamente!', 'success');
      setSigningContratoId(null);
      setProvOtp('');
      cargar();
      
      // Descargar PDF automáticamente ya que ambas partes han firmado
      try {
        await descargarPDF(contratoId);
      } catch (pdfErr) {
        console.error('Error al descargar PDF automático:', pdfErr);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al firmar contrato', 'error');
    } finally {
      setProcesando(null);
    }
  };

  const toggleDisponibilidad = async (fecha, disponibleActual) => {
    try {
      const res = await api.post('/disponibilidad', {
        fecha,
        disponible: disponibleActual === undefined ? true : !disponibleActual,
      });
      setDisponibilidad(prev => {
        const idx = prev.findIndex(d => d.fecha === fecha);
        if (idx >= 0) {
          const nuevo = [...prev];
          nuevo[idx] = { fecha, disponible: res.data.disponible };
          return nuevo;
        }
        return [...prev, { fecha, disponible: res.data.disponible }];
      });
    } catch (err) {
      showToast('Error actualizando disponibilidad', 'error');
    }
  };

  // Estados para selector de archivo, preview y progreso
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [progreso, setProgreso] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorGallery('');

    // Validar en cliente
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');
    const allowedImageExts = ['image/jpeg', 'image/png', 'image/webp'];

    if (!isVideo && !allowedImageExts.includes(file.type)) {
      showToast('Formato de imagen no permitido. Solo se aceptan jpg, png y webp.', 'error');
      return;
    }
    if (isVideo) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'mp4' && ext !== 'mov') {
        showToast('Formato de video no permitido. Solo se aceptan mp4 y mov.', 'error');
        return;
      }
    }

    const limit = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > limit) {
      showToast(`El archivo supera el límite de ${isVideo ? '50MB' : '5MB'}.`, 'error');
      return;
    }

    if (galleryMedia.length >= 12) {
      showToast('Has alcanzado el límite máximo de 12 archivos en tu galería.', 'error');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const ejecutarSubida = async () => {
    if (!selectedFile) return;
    setSubiendo(true);
    setProgreso(0);
    setErrorGallery('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('orden', galleryMedia.length);

    try {
      const res = await subirMedia(proveedor.id, formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgreso(pct);
      });
      setGalleryMedia(prev => [...prev, res.data]);
      showToast('Archivo subido con éxito.', 'success');
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Error al subir el archivo';
      setErrorGallery(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  };

  const handleEliminarArchivo = async (mediaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;

    try {
      await eliminarMedia(proveedor.id, mediaId);
      setGalleryMedia(prev => prev.filter(m => m.id !== mediaId));
      showToast('Archivo eliminado', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al eliminar el archivo', 'error');
    }
  };

  // Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDragEnter = (e, index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    const reordered = [...galleryMedia];
    const draggedItem = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setGalleryMedia(reordered);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    const mediaOrden = galleryMedia.map((item, idx) => ({
      id: item.id,
      orden: idx
    }));
    try {
      await reordenarMedia(proveedor.id, mediaOrden);
      showToast('Orden de galería actualizado.', 'success');
    } catch (err) {
      showToast('Error al guardar el nuevo orden de la galería.', 'error');
    }
  };

  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const contratosEsteMes = contratos.filter(c => {
    const d = new Date(c.fecha_evento);
    return d.getMonth() === mesActual && d.getFullYear() === hoy.getFullYear();
  });

  const ingresoNeto = contratos
    .filter(c => c.estado === 'completado')
    .reduce((sum, c) => sum + parseFloat(c.precio_total || 0) * 0.95, 0);

  const tasaCheckin = contratos.length > 0
    ? Math.round((contratos.filter(c => c.checkin_realizado).length / contratos.length) * 100)
    : 0;

  const contratosActivos = contratos.filter(c => ['activo', 'pagado'].includes(c.estado));
  const contratosEsperandoFirma = contratos.filter(c => c.timestamp_aceptacion && !c.timestamp_proveedor && c.estado !== 'cancelado');

  const distribucionCalif = [5, 4, 3, 2, 1].map(n => ({
    estrella: n,
    cantidad: resenas.filter(r => r.calificacion === n).length,
    pct: resenas.length > 0 ? (resenas.filter(r => r.calificacion === n).length / resenas.length) * 100 : 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-navy">Bienvenido, {user?.nombre || proveedor?.user_nombre}</h1>
            <p className="text-gray-600 text-lg font-semibold mt-1">{proveedor?.nombre_negocio}</p>
            <p className="text-gray-500 text-sm mt-0.5">{proveedor?.categoria} · {proveedor?.ciudad}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <Link to="/perfil/editar" className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold">
              <User size={15} />
              Editar perfil
            </Link>
            {proveedor?.plan === 'gratuito' && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                <Crown size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Plan gratuito</span>
                <button className="text-xs text-primary font-bold hover:underline ml-1">Upgrade</button>
              </div>
            )}
          </div>
        </div>

        {/* Banner destacado: Contratos pendientes de firma */}
        {contratosEsperandoFirma.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5 shrink-0">⚠️</span>
              <div>
                <h3 className="font-bold text-red-900 text-sm">
                  Tienes {contratosEsperandoFirma.length} {contratosEsperandoFirma.length === 1 ? 'contrato' : 'contratos'} esperando tu firma
                </h3>
                <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                  Por favor, revisa y firma digitalmente los acuerdos pendientes para que los clientes puedan descargar el contrato formalizado en PDF.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const firstPending = contratosEsperandoFirma[0];
                iniciarFirma(firstPending.id);
                const element = document.getElementById('reservas-activas-seccion');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors shrink-0 whitespace-nowrap"
            >
              ✍️ Firmar ahora
            </button>
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Reservas este mes', val: contratosEsteMes.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Ingresos netos', val: `$${ingresoNeto.toFixed(0)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Calificación', val: parseFloat(proveedor?.calificacion || 0).toFixed(1), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Tasa check-in', val: `${tasaCheckin}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-black text-navy">{val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reservas activas */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h2 className="text-base font-bold text-navy mb-4" id="reservas-activas-seccion">
                Reservas activas ({contratosActivos.length})
              </h2>
              {contratosActivos.length === 0 ? (
                <div className="card p-6 text-center text-gray-400 text-sm">
                  No tienes reservas activas en este momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {contratosActivos.map(c => {
                    const fecha = new Date(c.fecha_evento + 'T00:00:00');
                    const diasRestantes = Math.ceil((fecha - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={c.id} className="card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-bold text-navy text-sm">{c.cliente_nombre}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                diasRestantes <= 3 ? 'bg-red-50 text-red-600' :
                                diasRestantes <= 7 ? 'bg-amber-50 text-amber-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                {diasRestantes === 0 ? 'Hoy' : `En ${diasRestantes} días`}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} /> {fecha.toLocaleDateString('es-EC')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> {c.hora_evento}
                              </span>
                              <span className="flex items-center gap-1 max-w-[200px] truncate">
                                <MapPin size={11} /> {c.lugar_evento}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{c.tipo_evento}</p>
                            
                            {/* Resumen de Pago */}
                            {(() => {
                              const totalPagos = parseFloat(c.precio_total || 0);
                              const anticipoPagos = parseFloat(c.anticipo || 0);
                              const saldoPagos = totalPagos - anticipoPagos;
                              const pctAnticipo = totalPagos > 0 ? Math.round((anticipoPagos / totalPagos) * 100) : 50;
                              const pctSaldo = 100 - pctAnticipo;
                              return (
                                <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-2.5 max-w-xs text-left">
                                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Resumen de pago</p>
                                  <div className="space-y-1 text-[11px] text-navy font-semibold">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-gray-500">Precio total:</span>
                                      <span className="font-mono">${totalPagos.toFixed(2)} USD</span>
                                    </div>
                                    <div className="flex justify-between pl-2 border-l-2 border-primary/40">
                                      <span className="text-gray-500">├─ Anticipo ({pctAnticipo}%):</span>
                                      <span className="font-mono text-primary">${anticipoPagos.toFixed(2)} USD</span>
                                    </div>
                                    <div className="flex justify-between pl-2 border-l-2 border-primary/40">
                                      <span className="text-gray-500">└─ Saldo ({pctSaldo}%):</span>
                                      <span className="font-mono">${saldoPagos.toFixed(2)} USD</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <p className="font-bold text-navy text-sm">${parseFloat(c.precio_total || 0).toFixed(2)} USD</p>
                            
                            {!c.timestamp_proveedor ? (
                              <div className="mt-2 w-full">
                                {signingContratoId === c.id ? (
                                  <div className="flex flex-col gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 mt-2 text-left">
                                    <p className="text-[10px] font-bold text-gray-500">Ingresa el código OTP enviado a tu correo:</p>
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        value={provOtp}
                                        onChange={e => setProvOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="font-mono text-center text-sm border rounded-lg py-1 px-2 w-24 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                                      />
                                      <button
                                        onClick={() => handleFirmarContrato(c.id)}
                                        disabled={procesando === c.id || provOtp.length !== 6}
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg disabled:opacity-50"
                                      >
                                        Firmar
                                      </button>
                                      <button
                                        onClick={() => setSigningContratoId(null)}
                                        className="text-gray-400 hover:text-gray-600 text-xs py-1"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                    {devOtpProvider && import.meta.env.MODE === 'development' && (
                                      <p className="text-[10px] text-blue-700 font-bold bg-blue-50 py-1 px-2 rounded mt-1 text-center">
                                        Modo desarrollo — código: {devOtpProvider}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => iniciarFirma(c.id)}
                                    disabled={procesando === c.id}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                  >
                                    ✍️ Firmar Contrato
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                {c.timestamp_aceptacion && c.timestamp_proveedor && !c.fecha_confirmacion_anticipo && (
                                  <button
                                    onClick={() => handleConfirmarAnticipo(c)}
                                    disabled={procesando === c.id}
                                    className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                                  >
                                    <DollarSign size={11} />
                                    Confirmar anticipo (USD ${parseFloat(c.anticipo || 0).toFixed(2)})
                                  </button>
                                )}

                                {c.timestamp_aceptacion && c.timestamp_proveedor && c.fecha_confirmacion_anticipo && !c.fecha_confirmacion_pago_total && (
                                  <button
                                    onClick={() => handleConfirmarPagoTotal(c)}
                                    disabled={procesando === c.id}
                                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                                  >
                                    <DollarSign size={11} />
                                    Confirmar pago total (USD ${(parseFloat(c.precio_total || 0) - parseFloat(c.anticipo || 0)).toFixed(2)})
                                  </button>
                                )}

                                {c.fecha_confirmacion_pago_total && (
                                  <span className="w-full mt-2 text-center block text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-bold">
                                    ✓ Todo Pagado y Completado
                                  </span>
                                )}

                                {!c.checkin_realizado && diasRestantes <= 1 && (
                                  <button
                                    onClick={() => handleCheckin(c.id)}
                                    disabled={procesando === c.id}
                                    className="mt-1 btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                                  >
                                    <QrCode size={12} />
                                    {procesando === c.id ? '...' : 'Check-in'}
                                  </button>
                                )}

                                <button
                                  onClick={() => descargarPDF(c.id)}
                                  className="mt-1 btn-secondary text-xs py-1 px-2.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                                >
                                  <Download size={12} /> PDF
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historial completo */}
            <div>
              <h2 className="text-base font-bold text-navy mb-4">
                Historial de reservas ({contratos.length})
              </h2>
              <div className="space-y-2">
                {contratos.slice(0, 10).map(c => (
                  <div key={c.id} className="card p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{c.cliente_nombre}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(c.fecha_evento + 'T00:00:00').toLocaleDateString('es-EC')} · {c.tipo_evento}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-navy">${parseFloat(c.precio_total || 0).toFixed(0)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        c.estado === 'completado' ? 'bg-green-50 text-green-700' :
                        c.estado === 'cancelado' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {c.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-200/80 mt-12 mb-8" />

            {/* Mi Galería */}
            <div>
              <h2 className="text-base font-bold text-navy mb-4">Mi galería</h2>
              <div className="card p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500">
                      Sube fotos y videos para promocionar tu trabajo (máximo 12 archivos).
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Formatos permitidos: jpg, png, webp (máx. 5MB) · mp4, mov (máx. 50MB).
                    </p>
                  </div>
                  <div className="shrink-0">
                    <label className="btn-primary py-2.5 px-4 text-xs cursor-pointer flex items-center justify-center gap-2">
                      <Camera size={14} />
                      <span>Subir foto o video</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                        className="hidden"
                        onChange={handleSelectFile}
                        disabled={subiendo}
                      />
                    </label>
                  </div>
                </div>

                {/* Previsualización del archivo seleccionado */}
                {previewUrl && (
                  <div className="mb-6 p-4 border border-dashed border-primary/20 rounded-xl bg-blue-50/20 text-center max-w-sm mx-auto">
                    <p className="text-xs text-gray-500 font-semibold mb-3">Vista previa del archivo seleccionado</p>
                    <div className="aspect-square w-48 h-48 mx-auto rounded-xl overflow-hidden bg-black mb-4 relative">
                      {selectedFile?.type.startsWith('video/') || selectedFile?.name.endsWith('.mp4') || selectedFile?.name.endsWith('.mov') ? (
                        <video src={previewUrl} className="w-full h-full object-contain" controls />
                      ) : (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
                        className="btn-secondary py-1.5 px-3 text-xs"
                        disabled={subiendo}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={ejecutarSubida}
                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                        disabled={subiendo}
                      >
                        {subiendo ? 'Subiendo...' : 'Subir archivo'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Barra de progreso */}
                {subiendo && (
                  <div className="mb-6 max-w-sm mx-auto">
                    <div className="flex justify-between text-xs text-gray-500 font-semibold mb-1">
                      <span>Subiendo archivo...</span>
                      <span>{progreso}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50">
                      <div className="bg-primary h-full transition-all duration-150" style={{ width: `${progreso}%` }} />
                    </div>
                  </div>
                )}

                {errorGallery && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 mb-4 text-xs font-semibold">
                    {errorGallery}
                  </div>
                )}

                {galleryMedia.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <Camera size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No has subido ningún archivo a tu galería.</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
                      Galería del perfil ({galleryMedia.length}/12) — Arrastra para reordenar
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {galleryMedia.map((item, idx) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnter={(e) => handleDragEnter(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative group cursor-move transition-transform duration-200 ${
                            draggedIndex === idx ? 'scale-95 opacity-50 border-primary ring-2 ring-primary/20' : ''
                          }`}
                        >
                          {item.tipo === 'video' ? (
                            <>
                              <video
                                src={item.url}
                                className="w-full h-full object-cover pointer-events-none"
                                preload="metadata"
                              />
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                                  <Play size={14} className="text-navy fill-navy ml-0.5" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={item.url} alt="Gallery item" className="w-full h-full object-cover pointer-events-none" />
                          )}
                          <button
                            onClick={() => handleEliminarArchivo(item.id)}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                            title="Eliminar archivo"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Disponibilidad */}
            <div>
              <h2 className="text-base font-bold text-navy mb-3">Mi disponibilidad</h2>
              <CalendarioDisponibilidad
                disponibilidad={disponibilidad}
                editable={true}
                onToggle={toggleDisponibilidad}
              />
            </div>

            {/* Calificación */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-navy mb-4">Calificación</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-navy">
                    {parseFloat(proveedor?.calificacion || 0).toFixed(1)}
                  </p>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={11} className={
                        n <= Math.round(proveedor?.calificacion || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200 fill-gray-200'
                      } />
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  {distribucionCalif.map(({ estrella, cantidad, pct }) => (
                    <div key={estrella} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-3">{estrella}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-3">{cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {resenas.slice(0, 5).map(r => (
                  <div key={r.id} className="border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-navy">{r.cliente_nombre}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={9} className={n <= r.calificacion ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{r.comentario}</p>
                  </div>
                ))}
                {resenas.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Aún no tienes reseñas</p>
                )}
              </div>
            </div>

            {/* Plan */}
            <div className={`card p-5 ${
              proveedor?.plan === 'business' || proveedor?.plan === 'premium' ? 'border-amber-200 bg-amber-50/30' :
              proveedor?.plan === 'pro' ? 'border-blue-200 bg-blue-50/20' : ''
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Crown size={16} className={
                  proveedor?.plan === 'business' || proveedor?.plan === 'premium' ? 'text-amber-600' :
                  proveedor?.plan === 'pro' ? 'text-blue-600' : 'text-gray-400'
                } />
                <h2 className="text-sm font-bold text-navy">
                  Plan {
                    proveedor?.plan === 'business' || proveedor?.plan === 'premium' ? 'Business' :
                    proveedor?.plan === 'pro' ? 'Pro' : 'Gratuito'
                  }
                </h2>
              </div>
              
              {/* Beneficios del plan actual */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-500">Beneficios de tu plan:</p>
                {(!proveedor?.plan || proveedor?.plan === 'gratuito') && [
                  "Apareces en el catálogo",
                  "Comisión del 10% por reserva",
                  "Perfil básico visible"
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle size={12} className="text-gray-400" />
                    {f}
                  </div>
                ))}
                {proveedor?.plan === 'pro' && [
                  "Comisión reducida al 7%",
                  "Mayor visibilidad en búsquedas",
                  "Badge Pro visible"
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-blue-800">
                    <CheckCircle size={12} className="text-blue-600" />
                    {f}
                  </div>
                ))}
                {(proveedor?.plan === 'business' || proveedor?.plan === 'premium') && [
                  "Comisión reducida al 5%",
                  "Apareces primero en búsquedas",
                  "Badge Premium visible",
                  "Estadísticas avanzadas",
                  "Soporte prioritario"
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-amber-800">
                    <CheckCircle size={12} className="text-amber-600" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Botón de actualizar o información */}
              {(!proveedor?.plan || proveedor?.plan === 'gratuito') && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-[11px] text-gray-500 mb-2">Planes disponibles:</p>
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs text-gray-700"><strong>Pro ($12/mes):</strong> 7% comisión, badge Pro.</p>
                    <p className="text-xs text-gray-700"><strong>Business ($25/mes):</strong> 5% comisión, badge Premium, primero en búsquedas.</p>
                  </div>
                  <button className="w-full btn-primary text-xs py-2">
                    Mejorar Plan
                  </button>
                </div>
              )}
              {proveedor?.plan === 'pro' && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-[11px] text-gray-500 mb-2">Siguiente nivel:</p>
                  <p className="text-xs text-gray-700 mb-3"><strong>Business ($25/mes):</strong> 5% comisión, estadísticas y soporte VIP.</p>
                  <button className="w-full btn-primary text-xs py-2">
                    Subir a Business
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

