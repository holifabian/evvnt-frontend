import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp, Calendar, DollarSign, Star, CheckCircle,
  QrCode, Crown, ArrowUp, BarChart3, Clock, MapPin, Download, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listar as listarContratos, checkin, descargarPDF } from '../services/contratos';
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

  const handleSubirArchivo = async (e, tipo) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorGallery('');

    // Validar en cliente
    if (tipo === 'foto') {
      const allowedExts = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedExts.includes(file.type)) {
        setErrorGallery('Formato de imagen no permitido. Solo se aceptan jpg, png y webp.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrorGallery('La imagen excede el tamaño máximo permitido de 5MB.');
        return;
      }
      // Verificar cantidad máxima
      const currentPhotos = galleryMedia.filter(m => m.tipo === 'foto').length;
      if (currentPhotos >= 10) {
        setErrorGallery('Has alcanzado el límite máximo de 10 fotos.');
        return;
      }
    } else if (tipo === 'video') {
      if (file.type !== 'video/mp4') {
        setErrorGallery('Formato de video no permitido. Solo se acepta mp4.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB
        setErrorGallery('El video excede el tamaño máximo permitido de 50MB.');
        return;
      }
      // Verificar cantidad máxima
      const currentVideos = galleryMedia.filter(m => m.tipo === 'video').length;
      if (currentVideos >= 3) {
        setErrorGallery('Has alcanzado el límite máximo de 3 videos.');
        return;
      }
    }

    setSubiendo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/proveedores/${proveedor.id}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setGalleryMedia(prev => [res.data, ...prev]);
      showToast('Archivo subido con éxito', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Error al subir el archivo';
      setErrorGallery(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubiendo(false);
      e.target.value = ''; // limpiar input
    }
  };

  const handleEliminarArchivo = async (mediaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;

    try {
      await api.delete(`/proveedores/media/${mediaId}`);
      setGalleryMedia(prev => prev.filter(m => m.id !== mediaId));
      showToast('Archivo eliminado', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al eliminar el archivo', 'error');
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
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 mt-0.5">Sube fotos y videos para promocionar tu trabajo de cara a los clientes</p>
                  </div>
                <div className="flex items-center gap-2">
                  <label className="btn-secondary py-2 px-3 text-xs cursor-pointer flex items-center gap-1.5 hover:bg-gray-100 transition-colors">
                    <span>Subir foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleSubirArchivo(e, 'foto')}
                      disabled={subiendo}
                    />
                  </label>
                  <label className="btn-primary py-2 px-3 text-xs cursor-pointer flex items-center gap-1.5">
                    <span>Subir video</span>
                    <input
                      type="file"
                      accept="video/mp4"
                      className="hidden"
                      onChange={(e) => handleSubirArchivo(e, 'video')}
                      disabled={subiendo}
                    />
                  </label>
                </div>
              </div>

              {subiendo && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-center gap-2 mb-4">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-blue-700 font-semibold">Subiendo archivo...</span>
                </div>
              )}

              {errorGallery && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700">
                  {errorGallery}
                </div>
              )}

              {galleryMedia.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                    Aún no has subido fotos. Agrega fotos de tu trabajo para atraer más clientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Grid de Fotos */}
                  {galleryMedia.filter(m => m.tipo === 'foto').length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fotos ({galleryMedia.filter(m => m.tipo === 'foto').length}/10)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {galleryMedia.filter(m => m.tipo === 'foto').map(f => (
                          <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 bg-gray-50">
                            <img src={f.url} alt="Gallery item" className="w-full h-full object-cover" />
                            <button
                              onClick={() => handleEliminarArchivo(f.id)}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                              title="Eliminar foto"
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

                  {/* Grid de Videos */}
                  {galleryMedia.filter(m => m.tipo === 'video').length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Videos ({galleryMedia.filter(m => m.tipo === 'video').length}/3)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {galleryMedia.filter(m => m.tipo === 'video').map(v => (
                          <div key={v.id} className="relative aspect-video rounded-xl overflow-hidden group bg-black">
                            <video src={v.url} controls className="w-full h-full object-contain" />
                            <button
                              onClick={() => handleEliminarArchivo(v.id)}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                              title="Eliminar video"
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

