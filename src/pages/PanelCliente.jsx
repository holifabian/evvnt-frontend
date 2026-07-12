import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Download, Star, Calendar, MapPin, Clock,
  FileText, CheckCircle, AlertCircle, Package, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listar, descargarPDF } from '../services/contratos';
import api from '../services/api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  activo:     { label: 'Confirmado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  pagado:     { label: 'Pagado',     color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  completado: { label: 'Completado', color: 'bg-green-50 text-green-700 border-green-200' },
  cancelado:  { label: 'Cancelado',  color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function PanelCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resenaModal, setResenaModal] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [resena, setResena] = useState({ calificacion: 5, comentario: '' });
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [hoverCalificacion, setHoverCalificacion] = useState(0);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const res = await listar();
      setContratos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const puedeResenar = (c) => {
    return c.estado === 'completado';
  };

  const abrirResena = (c) => {
    setContratoSeleccionado(c);
    setResena({ calificacion: 5, comentario: '' });
    setResenaModal(true);
  };

  const enviarResena = async () => {
    if (resena.comentario.trim().length < 20) {
      showToast('Tu comentario debe tener al menos 20 caracteres', 'error');
      return;
    }

    setEnviandoResena(true);
    try {
      await api.post('/resenas', {
        contrato_id: contratoSeleccionado.id,
        calificacion: resena.calificacion,
        comentario: resena.comentario,
      });
      showToast('¡Gracias por tu reseña! Ayudas a la comunidad Evvnt.', 'success');
      setResenaModal(false);
      cargar();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error enviando reseña', 'error');
    } finally {
      setEnviandoResena(false);
    }
  };

  const stats = {
    total: contratos.length,
    activos: contratos.filter(c => ['activo', 'pagado'].includes(c.estado)).length,
    completados: contratos.filter(c => c.estado === 'completado').length,
  };

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-navy">Mi panel</h1>
            <p className="text-gray-500 text-sm">Bienvenido, {user?.nombre?.split(' ')[0]}</p>
          </div>
          <div className="flex gap-3 self-start sm:self-auto">
            <Link to="/perfil/editar" className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold">
              <User size={15} />
              Editar perfil
            </Link>
            <Link to="/catalogo" className="btn-primary self-start sm:self-auto text-xs sm:text-sm py-2 px-3">
              Contratar servicio
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total contratos', val: stats.total, icon: FileText, color: 'text-navy' },
            { label: 'Activos', val: stats.activos, icon: Calendar, color: 'text-blue-600' },
            { label: 'Completados', val: stats.completados, icon: CheckCircle, color: 'text-green-600' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="card p-4 text-center">
              <Icon size={20} className={`${color} mx-auto mb-2`} />
              <p className="text-2xl font-black text-navy">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Contratos */}
        <h2 className="text-base font-bold text-navy mb-4">Mis contratos</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : contratos.length === 0 ? (
          <div className="card p-10 text-center">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-navy mb-2">Aún no tienes contratos</h3>
            <p className="text-gray-500 text-sm mb-5">
              Explora el catálogo y contrata el servicio perfecto para tu evento.
            </p>
            <Link to="/catalogo" className="btn-primary">
              Ver proveedores
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {contratos.map(c => {
              const fechaEvento = new Date(c.fecha_evento + 'T00:00:00');
              const esPassado = fechaEvento < new Date();

              // Determinar estados del contrato según la lógica especificada
              let badgeText = '';
              let badgeColor = '';
              let showBlinkingDots = false;
              let helperText = '';
              let isDownloadable = false;
              let showWhatsAppFirma = false;
              let showWhatsAppPago = false;

              if (c.estado === 'cancelado') {
                badgeText = 'Cancelado';
                badgeColor = 'bg-red-50 text-red-700 border-red-200';
              } else if (!c.timestamp_aceptacion) {
                badgeText = 'Pendiente firma cliente';
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              } else if (!c.timestamp_proveedor) {
                badgeText = 'Esperando firma proveedor';
                badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                showBlinkingDots = true;
                helperText = 'Hemos notificado al proveedor. Una vez que firme el contrato, podrás descargar el PDF y el acuerdo quedará vigente.';
                showWhatsAppFirma = true;
              } else if (!c.fecha_confirmacion_anticipo) {
                badgeText = 'Vigente — Anticipo pendiente';
                badgeColor = 'bg-orange-50 text-orange-700 border-orange-200 border-dashed';
                isDownloadable = true;
                showWhatsAppPago = true;
                const anticVal = parseFloat(c.anticipo || 0).toFixed(2);
                helperText = `Coordina con el proveedor el pago del anticipo de USD $${anticVal}. Una vez que lo reciba, el proveedor lo confirmará aquí.`;
              } else if (!c.fecha_confirmacion_pago_total) {
                badgeText = 'En curso — Anticipo confirmado ✓';
                badgeColor = 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
                isDownloadable = true;
                showWhatsAppPago = true;
                const saldoVal = (parseFloat(c.precio_total || 0) - parseFloat(c.anticipo || 0)).toFixed(2);
                helperText = `El proveedor confirmó haber recibido el anticipo. El saldo de USD $${saldoVal} se pagará el día del evento.`;
              } else {
                badgeText = 'Completado ✓';
                badgeColor = 'bg-green-50 text-green-700 border-green-200 font-bold';
                isDownloadable = true;
                helperText = 'El evento fue completado exitosamente. ¡Gracias por usar Evvnt!';
              }

              const totalPagos = parseFloat(c.precio_total || 0);
              const anticipoPagos = parseFloat(c.anticipo || 0);
              const saldoPagos = totalPagos - anticipoPagos;

              const getWhatsAppUrl = (tipo) => {
                const telefono = c.proveedor_telefono ? c.proveedor_telefono.replace(/\s+/g, '') : '';
                const formattedPhone = telefono.replace(/[^\d]/g, '');
                const fechaStr = fechaEvento.toLocaleDateString('es-EC', {day: 'numeric', month: 'long', year: 'numeric'});
                
                let text = '';
                if (tipo === 'firma') {
                  text = `Hola ${c.proveedor_nombre || ''}, soy ${user?.nombre || ''}. Acabo de firmar el contrato Evvnt N° ${c.id} para el evento '${c.tipo_evento}' el ${fechaStr}. Por favor revisa tu panel de Evvnt para firmarlo también y así coordinamos el anticipo de USD $${anticipoPagos.toFixed(2)}. ¡Gracias!`;
                } else if (!c.fecha_confirmacion_anticipo) {
                  text = `Hola ${c.proveedor_nombre || ''}, soy ${user?.nombre || ''}. Acabo de firmar el contrato Evvnt N° ${c.id} para el evento '${c.tipo_evento}' el ${fechaStr}. Quería coordinar contigo el pago del anticipo de USD $${anticipoPagos.toFixed(2)}. ¡Gracias!`;
                } else {
                  text = `Hola ${c.proveedor_nombre || ''}, soy ${user?.nombre || ''}. Te escribo por el contrato Evvnt N° ${c.id} para el evento '${c.tipo_evento}' el ${fechaStr}. Quería coordinar el pago del saldo restante de USD $${saldoPagos.toFixed(2)} para el día del evento. ¡Gracias!`;
                }
                return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
              };

              return (
                <div key={c.id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-bold text-navy text-sm">{c.proveedor_nombre}</h3>
                        <span className={`badge-estado border ${badgeColor} text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5`}>
                          {badgeText}
                          {showBlinkingDots && (
                            <span className="flex gap-0.5 ml-0.5 shrink-0">
                              <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {fechaEvento.toLocaleDateString('es-EC', {day: 'numeric', month: 'long', year: 'numeric'})}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {c.hora_evento}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {c.lugar_evento}
                        </span>
                      </div>
                      
                      {/* Resumen de Pago */}
                      <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3 max-w-sm">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Resumen de pago</p>
                        <div className="space-y-1.5 text-xs text-navy font-semibold">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Precio total:</span>
                            <span className="font-mono">${totalPagos.toFixed(2)} USD</span>
                          </div>
                          {(() => {
                            const pctAnticipo = totalPagos > 0 ? Math.round((anticipoPagos / totalPagos) * 100) : 50;
                            const pctSaldo = 100 - pctAnticipo;
                            return (
                              <>
                                <div className="flex justify-between pl-2 border-l-2 border-primary/40">
                                  <span className="text-gray-500">├─ Anticipo ({pctAnticipo}%):</span>
                                  <span className="font-mono text-primary">${anticipoPagos.toFixed(2)} USD</span>
                                </div>
                                <div className="flex justify-between pl-2 border-l-2 border-primary/40">
                                  <span className="text-gray-500">└─ Saldo ({pctSaldo}%):</span>
                                  <span className="font-mono">${saldoPagos.toFixed(2)} USD</span>
                                </div>
                              </>
                            );
                          })()}
                          <div className="flex justify-between text-[10px] text-gray-400 mt-2 border-t border-gray-200/60 pt-1.5">
                            <span>Método de pago:</span>
                            <span>Directo entre las partes</span>
                          </div>
                        </div>
                      </div>

                      {helperText && (
                        <p className="text-[11px] text-gray-500 mt-3 bg-blue-50/50 border border-blue-100/50 rounded-lg p-2.5 max-w-md">
                          {helperText}
                        </p>
                      )}

                      {puedeResenar(c) && !c.resena_enviada && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 max-w-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                          <div>
                            <p className="text-[11px] font-bold text-amber-900 leading-normal">
                              ⭐ ¿Cómo te fue con {c.proveedor_nombre}?
                            </p>
                            <p className="text-[10px] text-amber-700 leading-normal mt-0.5">
                              Cuéntanos tu experiencia y ayuda a otros usuarios.
                            </p>
                          </div>
                          <button
                            onClick={() => abrirResena(c)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-2xs whitespace-nowrap transition-colors"
                          >
                            Dejar reseña
                          </button>
                        </div>
                      )}

                      {showWhatsAppFirma && (
                        <div className="mt-3">
                          {c.proveedor_telefono ? (
                            <>
                              <a
                                href={getWhatsAppUrl('firma')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-fit text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-lg border font-semibold bg-[#25D366] hover:bg-[#128C7E] text-white border-[#25D366] transition-colors"
                              >
                                <span className="text-sm font-bold">💬</span>
                                Avisar al proveedor por WhatsApp
                              </a>
                              <p className="text-[10px] text-gray-400 mt-1.5">
                                Avísale al proveedor para que firme el contrato y puedan coordinar el pago del anticipo.
                              </p>
                            </>
                          ) : (
                            <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 max-w-md font-medium">
                              Contáctalo por correo para que firme: <span className="font-semibold">{c.proveedor_email}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {showWhatsAppPago && (
                        <div className="mt-3">
                          {c.proveedor_telefono ? (
                            <a
                              href={getWhatsAppUrl('pago')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-fit text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-lg border font-semibold bg-[#25D366] hover:bg-[#128C7E] text-white border-[#25D366] transition-colors"
                            >
                              <span className="text-sm font-bold">💬</span>
                              Coordinar pago por WhatsApp
                            </a>
                          ) : (
                            <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 max-w-md font-medium">
                              El proveedor no tiene número de WhatsApp registrado. Contáctalo por correo: <span className="font-semibold">{c.proveedor_email}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => isDownloadable && descargarPDF(c.id)}
                        disabled={!isDownloadable}
                        title={!isDownloadable ? "Disponible cuando ambas partes firmen" : "Descargar contrato firmado"}
                        className={`text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-lg border font-semibold transition-all ${
                          isDownloadable
                            ? 'bg-primary border-primary text-white hover:bg-accent'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Download size={13} />
                        Descargar PDF
                      </button>
                      {puedeResenar(c) && !c.resena_enviada && (
                        <button
                          onClick={() => abrirResena(c)}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 border-amber-500"
                        >
                          <Star size={13} />
                          Dejar reseña
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={resenaModal} onClose={() => setResenaModal(false)} title="Dejar reseña">
        <div className="p-6 space-y-4 text-left">
          <p className="text-sm text-navy font-semibold">
            Califica tu experiencia con <span className="text-primary">{contratoSeleccionado?.proveedor_nombre}</span>
          </p>

          {/* Estrellas */}
          <div>
            <label className="label text-navy font-bold text-xs mb-1 block">Calificación</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setResena(prev => ({ ...prev, calificacion: n }))}
                  onMouseEnter={() => setHoverCalificacion(n)}
                  onMouseLeave={() => setHoverCalificacion(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  type="button"
                >
                  <Star
                    size={28}
                    className={n <= (hoverCalificacion || resena.calificacion)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-200'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label text-navy font-bold text-xs mb-1 block">Cuéntanos tu experiencia (mínimo 20 caracteres)</label>
            <textarea
              value={resena.comentario}
              onChange={e => setResena(prev => ({ ...prev, comentario: e.target.value }))}
              rows={3}
              placeholder="Cuéntanos cómo fue el servicio, amabilidad, etc..."
              className="input-field resize-none text-navy font-medium text-xs leading-normal"
              minLength={20}
              required
            />
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">
              Caracteres actuales: {resena.comentario.length} / 20
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setResenaModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={enviarResena}
              disabled={enviandoResena}
              className="btn-primary"
            >
              {enviandoResena ? 'Enviando...' : 'Publicar reseña'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

