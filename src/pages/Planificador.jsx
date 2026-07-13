import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generarRecomendacion } from '../services/api';
import { showToast } from '../components/Toast';
import {
  Brain, Calendar, Users, DollarSign, FileText, Check, Loader,
  ChevronRight, Crown, AlertCircle, Compass, Heart, Award, ArrowRight
} from 'lucide-react';
import Modal from '../components/Modal';

const TIPOS_EVENTO_IA = [
  { id: 'Fiesta infantil', titulo: 'Fiesta Infantil', desc: 'Juegos, diversión y payasos para niños', emoji: '🎈', color: 'border-pink-200 hover:border-pink-400 bg-pink-50/20' },
  { id: 'Fiesta juvenil', titulo: 'Fiesta Juvenil', desc: 'Música moderna, luces y sonido vibrante', emoji: '🎧', color: 'border-purple-200 hover:border-purple-400 bg-purple-50/20' },
  { id: 'Boda', titulo: 'Boda', desc: 'Decoración elegante y momentos mágicos', emoji: '💍', color: 'border-amber-200 hover:border-amber-400 bg-amber-50/20' },
  { id: 'Evento corporativo', titulo: 'Evento Corporativo', desc: 'Catering premium y sonido para empresas', emoji: '💼', color: 'border-blue-200 hover:border-blue-400 bg-blue-50/20' },
];

export default function Planificador() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.rol === 'proveedor') {
      showToast('El planificador es para clientes organizadores.', 'warning');
      navigate('/panel-proveedor');
    }
  }, [user, navigate]);

  // Estados del Formulario
  const [tipoEvento, setTipoEvento] = useState('');
  const [fecha, setFecha] = useState('');
  const [invitados, setInvitados] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [requerimientos, setRequerimientos] = useState('');

  // Estados de carga e IA
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Verificando disponibilidad...');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [loginModal, setLoginModal] = useState(false);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);

  // Intervalo para rotar mensajes de carga
  useEffect(() => {
    if (!loading) return;
    const mensajes = [
      'Verificando disponibilidad de proveedores...',
      'Filtrando por presupuesto en Loja...',
      'Optimizando combinaciones con IA...',
      'Generando paquetes personalizados básicos, recomendados y premium...'
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % mensajes.length;
      setLoadingMessage(mensajes[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipoEvento) {
      setError('Por favor selecciona un tipo de evento');
      return;
    }
    if (!fecha) {
      setError('Por favor selecciona una fecha');
      return;
    }
    if (!invitados) {
      setError('Por favor selecciona el número de invitados');
      return;
    }
    if (presupuesto === '' || presupuesto === undefined) {
      setError('Por favor ingresa tu presupuesto');
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);

    try {
      const res = await generarRecomendacion({
        tipo_evento: tipoEvento,
        fecha,
        num_invitados: invitados,
        presupuesto: parseFloat(presupuesto),
        requerimientos_especiales: requerimientos
      });
      setResultado(res.data);
      showToast('¡Paquetes generados con éxito!', 'success');
      // Scroll automático al resultado
      setTimeout(() => {
        document.getElementById('resultados-ia')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con la IA de Claude. Verifica tu API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPaquete = (paquete) => {
    const datosContrato = {
      paquete,
      formOriginal: {
        tipo_evento: tipoEvento,
        fecha_evento: fecha,
        hora_evento: '12:00', // hora default
        lugar_evento: '',
        descripcion: `Contratación de paquete inteligente "${paquete.nombre}" para ${tipoEvento}. Requerimientos: ${requerimientos || 'Ninguno'}.`,
        precio_total: paquete.precio_total,
      }
    };

    if (!user) {
      // Guardar en sessionStorage para recuperarlo luego del login
      sessionStorage.setItem('evvnt_pending_package', JSON.stringify(datosContrato));
      setPaqueteSeleccionado(paquete);
      setLoginModal(true);
    } else {
      if (user.rol !== 'cliente') {
        showToast('Debes iniciar sesión con una cuenta de Cliente para contratar', 'warning');
        return;
      }
      navigate('/contratar/paquete', { state: datosContrato });
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Banner Hero */}
        <div className="relative bg-navy rounded-3xl overflow-hidden shadow-xl p-8 sm:p-12 mb-12 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e3a8a,transparent)] opacity-60 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full text-xs font-medium mb-4">
              Planificador inteligente
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
              Diseña tu evento perfecto con inteligencia artificial
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Dinos qué necesitas y nuestro recomendador inteligente optimizará proveedores activos, verificados y disponibles en Loja que se ajusten exactamente a tu presupuesto.
            </p>
          </div>
        </div>

        {/* Sección Formulario */}
        <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-sm rounded-2xl mb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de evento */}
            <div>
              <label className="label text-navy text-base font-bold mb-3">1. Tipo de evento</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {TIPOS_EVENTO_IA.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setTipoEvento(item.id); setError(''); }}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 ${item.color} ${
                      tipoEvento === item.id
                        ? 'border-primary ring-2 ring-primary/20 scale-[1.02] shadow-sm'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{item.emoji}</span>
                    <h3 className="font-bold text-navy text-sm mb-1">{item.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-snug">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha y Número de Invitados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label text-navy font-bold">2. Fecha del evento</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => { setFecha(e.target.value); setError(''); }}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Mínimo mañana
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label text-navy font-bold">3. ¿Cuántos invitados aproximadamente?</label>
                <div className="relative">
                  <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 150"
                    value={invitados}
                    onChange={(e) => { setInvitados(e.target.value); setError(''); }}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Presupuesto */}
            <div>
              <label className="label text-navy font-bold">4. ¿Cuánto tienes de presupuesto? (USD)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 500"
                  value={presupuesto}
                  onChange={(e) => { setPresupuesto(e.target.value); setError(''); }}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Requerimientos especiales */}
            <div>
              <label className="label text-navy font-bold">5. Requerimientos especiales (opcional)</label>
              <textarea
                value={requerimientos}
                onChange={(e) => setRequerimientos(e.target.value)}
                rows={3}
                placeholder="Por ejemplo: 'Necesito que el DJ toque música rock clásico', 'decoración tematica de color azul', 'Catering con opciones vegetarianas'..."
                className="input-field resize-none"
              />
            </div>

            {/* Errores */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <AlertCircle size={18} className="shrink-0 text-red-500" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Procesando requerimientos...</span>
                </>
              ) : (
                <>
                  <Brain size={16} />
                  <span>Generar paquetes con IA</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loader Animado */}
        {loading && (
          <div className="card p-10 text-center flex flex-col items-center justify-center space-y-4 animate-fade-in bg-white border border-gray-100">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
              <Brain className="absolute inset-0 m-auto text-primary" size={24} />
            </div>
            <h3 className="text-navy font-bold text-lg">Procesando los mejores proveedores</h3>
            <p className="text-gray-500 text-sm max-w-sm font-medium">{loadingMessage}</p>
          </div>
        )}

        {/* Sección de Resultados */}
        {resultado && resultado.paquetes && (
          <div id="resultados-ia" className="space-y-10 animate-slide-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-navy">Tus paquetes personalizados están listos</h2>
              <p className="text-gray-500 text-sm mt-1">Compara las opciones generadas por la inteligencia artificial en base a tus requerimientos</p>
            </div>

            {/* Fila de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {resultado.paquetes.map((p, idx) => {
                // Asignar colores según paquete
                const esRec = p.recomendado;
                const isPremium = idx === 2;
                const isBasic = idx === 0;

                return (
                  <div
                    key={idx}
                    className={`card relative overflow-hidden flex flex-col bg-white border h-full transition-all duration-300 hover:scale-[1.01] ${
                      esRec
                        ? 'border-primary ring-1 ring-primary/20 shadow-md scale-[1.01]'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Highlight recomendado */}
                    {esRec && (
                      <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl flex items-center gap-1 shadow-sm">
                        <Crown size={12} /> Recomendado
                      </div>
                    )}
                    {isPremium && !esRec && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl flex items-center gap-1">
                        <Award size={12} /> Premium
                      </div>
                    )}
                    {isBasic && !esRec && (
                      <div className="absolute top-0 right-0 bg-slate-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl flex items-center gap-1">
                        <Compass size={12} /> Esencial
                      </div>
                    )}

                    {/* Cabecera Tarjeta */}
                    <div className="p-6 pb-4 border-b border-gray-100">
                      <h3 className="font-bold text-navy text-lg pr-20">{p.nombre}</h3>
                      <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{p.descripcion}</p>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-navy font-mono">${p.precio_total}</span>
                        <span className="text-xs font-semibold text-gray-400">USD</span>
                      </div>
                    </div>

                    {/* Cuerpo - Servicios Desglosados */}
                    <div className="p-6 flex-1 space-y-4">
                      <h4 className="text-xs font-bold text-gray-400">Servicios incluidos</h4>
                      <div className="space-y-3.5">
                        {p.servicios && p.servicios.map((s, sidx) => (
                          <div key={sidx} className="flex gap-2.5">
                            <div className="w-5 h-5 bg-green-50 rounded-full border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={11} className="text-green-600" />
                            </div>
                            <div className="flex-1 text-xs">
                              <div className="flex justify-between items-baseline gap-1">
                                <span className="font-bold text-navy">{s.nombre_negocio}</span>
                                <span className="font-semibold text-gray-500 font-mono">${s.precio}</span>
                              </div>
                              <p className="text-gray-400 text-[10px] font-bold mt-0.5">{s.categoria}</p>
                              {s.descripcion_servicio && (
                                <p className="text-gray-600 mt-0.5 leading-relaxed">{s.descripcion_servicio}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Tarjeta */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto">
                      <button
                        onClick={() => handleSeleccionarPaquete(p)}
                        className={`w-full py-2.5 text-xs flex items-center justify-center gap-2 ${
                          esRec ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        <span>Seleccionar este paquete</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nota de la IA */}
            {resultado.nota_ia && (
              <div className="card p-5 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Brain size={18} className="text-white" />
                </div>
                <div>
                  <h4 className="text-navy font-bold text-sm mb-1">Análisis de la inteligencia artificial</h4>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed italic">
                    "{resultado.nota_ia}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Login Requerido */}
        <Modal open={loginModal} onClose={() => setLoginModal(false)} title="Iniciar sesión">
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown size={24} className="text-primary" />
            </div>
            <h3 className="font-black text-navy text-base mb-2">¡Casi listo para reservar!</h3>
            <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
              Debes registrarte o iniciar sesión con una cuenta de Cliente para poder formalizar la contratación y firmar los contratos del paquete digitalmente.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 btn-secondary py-2.5"
                onClick={() => setLoginModal(false)}
              >
                Volver
              </button>
              <button
                className="flex-1 btn-primary py-2.5"
                onClick={() => navigate('/auth')}
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
