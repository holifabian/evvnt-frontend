import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Crown, MapPin, Calendar, ArrowRight, Phone, Mail } from 'lucide-react';
import { obtener } from '../services/proveedores';
import { useAuth } from '../context/AuthContext';
import CalendarioDisponibilidad from '../components/CalendarioDisponibilidad';
import Modal from '../components/Modal';
import api from '../services/api';

export default function PerfilProveedor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proveedor, setProveedor] = useState(null);
  const [media, setMedia] = useState([]);
  const [activePhoto, setActivePhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginModal, setLoginModal] = useState(false);
  const [cotizacionModal, setCotizacionModal] = useState(false);
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  const [cotizError, setCotizError] = useState('');
  const [cotizForm, setCotizForm] = useState({
    tipo_evento: 'Cumpleaños',
    fecha_evento: '',
    lugar_evento: '',
    num_personas: '',
    duracion: '',
    servicios_adicionales: [],
    presupuesto: '',
    mensaje: ''
  });

  const handleCotizChange = (e) => {
    const { name, value } = e.target;
    setCotizForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (serv) => {
    setCotizForm(prev => {
      const idx = prev.servicios_adicionales.indexOf(serv);
      if (idx >= 0) {
        return {
          ...prev,
          servicios_adicionales: prev.servicios_adicionales.filter(s => s !== serv)
        };
      } else {
        return {
          ...prev,
          servicios_adicionales: [...prev.servicios_adicionales, serv]
        };
      }
    });
  };

  const handleSolicitarCotizacion = () => {
    if (!user) {
      setLoginModal(true);
    } else {
      setCotizError('');
      setCotizForm({
        tipo_evento: 'Cumpleaños',
        fecha_evento: '',
        lugar_evento: '',
        num_personas: '',
        duracion: '',
        servicios_adicionales: [],
        presupuesto: '',
        mensaje: ''
      });
      setCotizacionModal(true);
    }
  };

  const handleEnviarCotizacion = (e) => {
    e.preventDefault();
    if (fechasOcupadas.includes(cotizForm.fecha_evento)) {
      setCotizError('⚠️ El proveedor no está disponible en esta fecha. Por favor elige otra fecha o contáctalo para confirmar.');
      return;
    }
    
    const adicionales = cotizForm.servicios_adicionales.length > 0
      ? cotizForm.servicios_adicionales.join(', ')
      : 'Ninguno';

    const text = `Hola ${proveedor?.nombre_negocio || ''}, soy ${user?.nombre || ''} y me interesa tu servicio de ${proveedor?.categoria || ''} a través de Evvnt.
📋 Detalles de mi evento:
- Tipo de evento: ${cotizForm.tipo_evento}
- Fecha: ${cotizForm.fecha_evento}
- Lugar: ${cotizForm.lugar_evento}
- Número de personas: ${cotizForm.num_personas}
- Duración requerida: ${cotizForm.duracion} horas
- Servicios adicionales: ${adicionales}
- Presupuesto aproximado: USD $${parseFloat(cotizForm.presupuesto || 0).toFixed(2)}
- Mensaje: ${cotizForm.mensaje || 'Ninguno'}
¿Podrías darme una cotización? ¡Gracias!`;

    const telefono = proveedor?.telefono ? proveedor.telefono.replace(/[^\d]/g, '') : '';
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setCotizacionModal(false);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      obtener(id),
      api.get(`/proveedores/${id}/media`),
      api.get(`/proveedores/${id}/disponibilidad`)
    ])
      .then(([provRes, mediaRes, dispRes]) => {
        setProveedor(provRes.data);
        setMedia(mediaRes.data);
        setFechasOcupadas(dispRes.data);
      })
      .catch((err) => {
        console.error(err);
        navigate('/catalogo');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleContratar = () => {
    if (!user) {
      setLoginModal(true);
    } else {
      navigate(`/contratar/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!proveedor) return null;

  const {
    nombre_negocio, categoria, descripcion, precio_base, precio_maximo,
    calificacion, total_eventos, verificado, plan, ciudad,
    resenas = [], disponibilidad = [], email, telefono,
  } = proveedor;

  const initials = nombre_negocio?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const distribucionCalif = [5, 4, 3, 2, 1].map(n => ({
    estrella: n,
    cantidad: resenas.filter(r => r.calificacion === n).length,
    pct: resenas.length > 0 ? (resenas.filter(r => r.calificacion === n).length / resenas.length) * 100 : 0,
  }));

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="py-5 text-sm text-gray-400">
          <span
            className="hover:text-primary cursor-pointer"
            onClick={() => navigate('/catalogo')}
          >
            Proveedores
          </span>
          <span className="mx-2">/</span>
          <span className="text-navy font-medium">{nombre_negocio}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-20 h-20 bg-navy rounded-2xl flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-2xl">{initials}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h1 className="text-xl font-black text-navy">{nombre_negocio}</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="font-semibold text-primary">{categoria}</span>
                    {verificado && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                        <span>Verificado</span>
                      </div>
                    )}
                    {ciudad && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {ciudad}
                      </span>
                    )}
                    <span>{total_eventos} eventos realizados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          size={15}
                          className={n <= Math.round(calificacion) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-navy text-sm">⭐ {parseFloat(calificacion || 0).toFixed(1)} / 5</span>
                    <span className="text-gray-400 text-sm">({resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="card p-6">
              <h2 className="text-base font-bold text-navy mb-3">Acerca del servicio</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{descripcion}</p>
            </div>

            {/* Galería */}
            <div className="card p-6">
              <h2 className="text-base font-bold text-navy mb-4">Galería de fotos y videos</h2>
              
              {media.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50/50 rounded-xl">
                  Este proveedor aún no ha subido fotos
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Grid de 3 columnas para Fotos */}
                  {media.filter(m => m.tipo === 'foto').length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fotos</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {media.filter(m => m.tipo === 'foto').map(f => (
                          <div
                            key={f.id}
                            className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-gray-100 hover:opacity-90 transition-opacity bg-gray-50 relative group"
                            onClick={() => setActivePhoto(f.url)}
                          >
                            <img
                              src={f.url}
                              alt={f.descripcion || 'Imagen del proveedor'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grid/Listado de Videos */}
                  {media.filter(m => m.tipo === 'video').length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Videos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {media.filter(m => m.tipo === 'video').map(v => (
                          <div key={v.id} className="rounded-xl overflow-hidden border border-gray-100 bg-black aspect-video">
                            <video
                              src={v.url}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Disponibilidad */}
            <div>
              <h2 className="text-base font-bold text-navy mb-3">Calendario de disponibilidad</h2>
              <CalendarioDisponibilidad disponibilidad={disponibilidad} fechasOcupadas={fechasOcupadas} />
            </div>

            {/* Reseñas */}
            <div>
              <h2 className="text-base font-bold text-navy mb-4">
                Reseñas verificadas ({resenas.length})
              </h2>

              {resenas.length > 0 && (
                <div className="card p-5 mb-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-4xl font-black text-navy">{parseFloat(calificacion || 0).toFixed(1)}</p>
                      <div className="flex gap-0.5 mt-1 justify-center">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={12} className={n <= Math.round(calificacion) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{resenas.length} reseñas</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {distribucionCalif.map(({ estrella, cantidad, pct }) => (
                        <div key={estrella} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-4">{estrella}</span>
                          <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-4">{cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {resenas.length === 0 ? (
                  <div className="card p-6 text-center text-gray-400 text-sm">
                    Aún no hay reseñas para este proveedor.
                  </div>
                ) : (
                  resenas.slice(0, 5).map(r => (
                    <div key={r.id} className="card p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-xs">
                            {r.cliente_nombre?.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-navy">{r.cliente_nombre}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star key={n} size={11} className={n <= r.calificacion ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{r.comentario}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(r.fecha_resena || r.created_at).toLocaleDateString('es-EC')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Tarifas */}
            <div className="card p-5 sticky top-24">
              <h3 className="text-base font-bold text-navy mb-4">Tarifas</h3>
              <div className="space-y-2 mb-5">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600 font-semibold">Precio base</span>
                  <span className="font-bold text-navy">Desde USD ${parseFloat(precio_base || 0).toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-gray-500 italic leading-relaxed">
                  * El precio final se acuerda directamente con el proveedor según tus necesidades.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleSolicitarCotizacion}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <span>💬</span> Solicitar cotización
                </button>
                
                <button
                  onClick={handleContratar}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-200"
                >
                  <span>📝</span> Ya acordamos el precio — Generar contrato
                </button>
              </div>

              {!user && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  Debes iniciar sesión para cotizar o contratar
                </p>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                  El pago se coordina directamente entre cliente y proveedor. Evvnt facilita el acuerdo digital bajo la Ley 67 de Ecuador.
                </p>
              </div>
            </div>

            {/* Contacto */}
            {(email || telefono) && (
              <div className="card p-5">
                <h3 className="text-sm font-bold text-navy mb-3">Contacto</h3>
                <div className="space-y-2">
                  {email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      {email}
                    </div>
                  )}
                  {telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {telefono}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de login */}
      <Modal open={loginModal} onClose={() => setLoginModal(false)} title="Iniciar sesión">
        <div className="p-6 text-center">
          <p className="text-gray-600 text-sm mb-6">
            Debes iniciar sesión para contratar a <strong>{nombre_negocio}</strong>.
          </p>
          <div className="flex gap-3">
            <button
              className="flex-1 btn-secondary"
              onClick={() => setLoginModal(false)}
            >
              Cancelar
            </button>
            <button
              className="flex-1 btn-primary"
              onClick={() => navigate('/auth')}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Cotización */}
      <Modal open={cotizacionModal} onClose={() => setCotizacionModal(false)} title="Solicitar cotización">
        <form onSubmit={handleEnviarCotizacion} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-left">
          <div>
            <label className="label text-navy font-bold text-xs mb-1 block">Tipo de evento</label>
            <select
              required
              name="tipo_evento"
              value={cotizForm.tipo_evento}
              onChange={handleCotizChange}
              className="w-full border rounded-lg p-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Cumpleaños">Cumpleaños</option>
              <option value="Matrimonio">Matrimonio</option>
              <option value="Graduación">Graduación</option>
              <option value="Empresarial">Empresarial</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="label text-navy font-bold text-xs mb-1 block">Fecha del evento</label>
            <input
              type="date"
              required
              name="fecha_evento"
              value={cotizForm.fecha_evento}
              onChange={handleCotizChange}
              className="w-full border rounded-lg p-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
            />
          </div>

          <div>
            <label className="label text-navy font-bold text-xs mb-1 block">Lugar del evento</label>
            <input
              type="text"
              required
              name="lugar_evento"
              placeholder="Ej: Salón de Eventos Bella Vista"
              value={cotizForm.lugar_evento}
              onChange={handleCotizChange}
              className="w-full border rounded-lg p-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-navy font-bold text-xs mb-1 block">Número de personas</label>
              <input
                type="number"
                required
                name="num_personas"
                placeholder="Aprox"
                value={cotizForm.num_personas}
                onChange={handleCotizChange}
                className="w-full border rounded-lg p-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label text-navy font-bold text-xs mb-1 block">Duración (horas)</label>
              <input
                type="number"
                required
                min="1"
                max="12"
                name="duracion"
                placeholder="1 a 12"
                value={cotizForm.duracion}
                onChange={handleCotizChange}
                className="w-full border rounded-lg p-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="label text-navy font-bold text-xs mb-1.5 block">Servicios adicionales</label>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-navy">
              {['Audio', 'Iluminación', 'Transporte', 'Otro'].map(serv => (
                <label key={serv} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cotizForm.servicios_adicionales.includes(serv)}
                    onChange={() => handleCheckboxChange(serv)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>{serv}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label text-navy font-bold text-xs mb-1 block">Presupuesto aproximado (USD)</label>
            <input
              type="number"
              required
              name="presupuesto"
              placeholder="USD $"
              value={cotizForm.presupuesto}
              onChange={handleCotizChange}
              className="w-full border rounded-lg p-2 text-sm text-navy font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="label text-navy font-bold text-xs mb-1 block">Mensaje adicional (Opcional)</label>
            <textarea
              name="mensaje"
              rows={2}
              placeholder="Especifica detalles de la música, catering, etc..."
              value={cotizForm.mensaje}
              onChange={handleCotizChange}
              className="w-full border rounded-lg p-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {cotizError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg font-semibold">
              {cotizError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-2"
          >
            <span>💬</span> Enviar solicitud de cotización
          </button>
        </form>
      </Modal>
      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setActivePhoto(null)}
          >
            <span className="sr-only">Cerrar</span>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={activePhoto}
            alt="Multimedia ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

