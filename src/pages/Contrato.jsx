import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, AlertCircle, FileText, Send, Download,
  ShieldCheck, Clock, ChevronRight, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { obtener as obtenerProveedor } from '../services/proveedores';
import { generarOTP, verificarOTP } from '../services/otp';
import { crear as crearContrato, descargarPDF } from '../services/contratos';
import api from '../services/api';
import { showToast } from '../components/Toast';

const TIPOS_EVENTO = ['Boda', 'Quinceañera', 'Cumpleaños', 'Bautizo', 'Graduación',
  'Corporativo', 'Infantil', 'Reunión familiar', 'Aniversario', 'Otro'];

export default function Contrato() {
  const { proveedorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [paso, setPaso] = useState(1);
  const [proveedor, setProveedor] = useState(null);
  const [esPaquete, setEsPaquete] = useState(proveedorId === 'paquete');
  const [paqueteInfo, setPaqueteInfo] = useState(null);
  const [contratosCreados, setContratosCreados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [contratoCreado, setContratoCreado] = useState(null);

  // Form datos
  const [form, setForm] = useState({
    tipo_evento: '',
    fecha_evento: '',
    hora_evento: '12:00',
    lugar_evento: '',
    descripcion: '',
    precio_total: '',
    anticipo: '',
    domicilio_cliente: '',
    telefono_cliente: '',
  });

  // Paso 2 - Cédula
  const [cedula, setCedula] = useState('');
  const [cedulaValida, setCedulaValida] = useState(false);
  const [verificandoCedula, setVerificandoCedula] = useState(false);

  // Paso 3 - OTP
  const [otpEnviado, setOtpEnviado] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerificado, setOtpVerificado] = useState(false);
  const [enviandoOtp, setEnviandoOtp] = useState(false);
  const [otpCode, setOtpCode] = useState(''); // código verificado
  const [devOtp, setDevOtp] = useState('');
  const [anticipoPct, setAnticipoPct] = useState(50);
  const [fechasOcupadas, setFechasOcupadas] = useState([]);

  useEffect(() => {
    const total = parseFloat(form.precio_total || 0);
    const calculatedAnticipo = ((total * anticipoPct) / 100).toFixed(2);
    setForm(prev => ({
      ...prev,
      anticipo: calculatedAnticipo
    }));
  }, [form.precio_total, anticipoPct]);

  // Checkboxes para Paso 4
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [checkedElectronic, setCheckedElectronic] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    
    if (proveedorId === 'paquete') {
      const state = location.state;
      if (!state || !state.paquete) {
        navigate('/planificador');
        return;
      }
      setEsPaquete(true);
      setPaqueteInfo(state.paquete);
      setForm({
        tipo_evento: state.formOriginal.tipo_evento,
        fecha_evento: state.formOriginal.fecha_evento,
        hora_evento: state.formOriginal.hora_evento || '12:00',
        lugar_evento: state.formOriginal.lugar_evento || '',
        descripcion: state.formOriginal.descripcion || '',
        precio_total: state.formOriginal.precio_total,
        anticipo: '',
        domicilio_cliente: '',
        telefono_cliente: user?.telefono || '',
      });
      setLoading(false);
      // Limpiar sessionStorage
      sessionStorage.removeItem('evvnt_pending_package');
    } else {
      obtenerProveedor(proveedorId)
        .then(res => {
          setProveedor(res.data);
          setForm(prev => ({ 
            ...prev, 
            precio_total: '',
            telefono_cliente: user?.telefono || '',
            domicilio_cliente: '',
          }));
          
          api.get(`/proveedores/${proveedorId}/disponibilidad`)
            .then(dispRes => setFechasOcupadas(dispRes.data))
            .catch(err => console.error('Error cargando disponibilidad pública:', err));
        })
        .catch(() => navigate('/catalogo'))
        .finally(() => setLoading(false));
    }
  }, [proveedorId, user]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const verificarCedula = async () => {
    if (cedula.length !== 10) { setError('La cédula debe tener 10 dígitos'); return; }
    setVerificandoCedula(true);
    setError('');
    try {
      await api.post('/verificacion/cedula', { cedula });
      setCedulaValida(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Cédula inválida');
      setCedulaValida(false);
    } finally {
      setVerificandoCedula(false);
    }
  };

  const enviarOTP = async () => {
    setEnviandoOtp(true);
    setError('');
    setDevOtp('');
    try {
      const res = await generarOTP();
      setOtpEnviado(true);
      if (res.data && res.data.fallback && res.data.codigo) {
        setDevOtp(res.data.codigo);
        showToast('Modo desarrollo: código generado en pantalla', 'info');
      } else {
        showToast('Código OTP enviado a tu correo', 'success');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error enviando OTP');
    } finally {
      setEnviandoOtp(false);
    }
  };

  const confirmarOTP = async () => {
    if (otp.length !== 6) { setError('El código debe tener 6 dígitos'); return; }
    setEnviandoOtp(true);
    setError('');
    try {
      await verificarOTP(otp);
      setOtpVerificado(true);
      setOtpCode(otp);
      showToast('Código verificado correctamente', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto o expirado');
    } finally {
      setEnviandoOtp(false);
    }
  };

  const numContratoPreview = `EVT-${new Date().getFullYear()}-XXXXXX`;
  const fechaGeneracionStr = new Date().toLocaleString('es-EC');

  const contenidoContrato = `CONTRATO DE PRESTACIÓN DE SERVICIOS DE ENTRETENIMIENTO
Número de contrato: ${numContratoPreview}
Fecha de generación: ${fechaGeneracionStr}
Versión: 1.0

I. PARTES CONTRATANTES
CLIENTE:
- Nombre completo: ${user?.nombre || ''}
- Cédula de identidad: ${cedula}
- Correo electrónico: ${user?.email || ''}
- Teléfono: ${form.telefono_cliente}
- Domicilio: ${form.domicilio_cliente}
- Tipo de persona: Natural

PROVEEDOR:
- Nombre del negocio: ${esPaquete ? 'Múltiples Proveedores (Paquete IA)' : (proveedor?.nombre_negocio || '')}
- Categoría: ${esPaquete ? 'Paquete Inteligente' : (proveedor?.categoria || '')}
- Correo: ${esPaquete ? 'Múltiples correos' : (proveedor?.email || '')}
- Teléfono: ${esPaquete ? 'Múltiples teléfonos' : (proveedor?.telefono || '')}
- Ciudad: Loja, Ecuador

II. OBJETO DEL CONTRATO
Tipo de evento: ${form.tipo_evento}
Descripción detallada del servicio: ${form.descripcion || 'Servicio de entretenimiento contratado'}
Fecha del evento: ${form.fecha_evento ? new Date(form.fecha_evento + 'T00:00:00').toLocaleDateString('es-EC') : ''}
Hora del evento: ${form.hora_evento}
Lugar del evento: ${form.lugar_evento}

III. OBLIGACIONES DE LAS PARTES
OBLIGACIONES DEL CLIENTE:
1. Realizar el pago acordado directamente al proveedor antes o en la fecha del evento.
2. Proporcionar el espacio y condiciones necesarias para la prestación del servicio.
3. Notificar cualquier cambio con al menos 72 horas de anticipación.

OBLIGACIONES DEL PROVEEDOR:
1. Presentarse puntualmente en el lugar y hora acordados.
2. Prestar el servicio con la calidad y características descritas en este contrato.
3. Notificar al cliente con al menos 48 horas de anticipación si existe algún impedimento.

IV. PRECIO Y CONDICIONES DE PAGO
Precio total del servicio: USD $${parseFloat(form.precio_total || 0).toFixed(2)}
Anticipo acordado (${anticipoPct}%): USD $${((parseFloat(form.precio_total || 0) * anticipoPct) / 100).toFixed(2)} — a cancelarse previo al evento como reserva de fecha
Saldo restante (${100 - anticipoPct}%): USD $${(parseFloat(form.precio_total || 0) - ((parseFloat(form.precio_total || 0) * anticipoPct) / 100)).toFixed(2)} — a cancelarse el día del evento
Impuestos (IVA): $0 (persona natural no obligada a llevar contabilidad)
Método de pago: Pago directo entre las partes
Nota: Evvnt actúa únicamente como facilitador del acuerdo digital. El pago se realiza directamente entre cliente y proveedor.

V. POLÍTICA DE CANCELACIÓN
En caso de cancelación imputable al Contratante:
- Con más de 72 horas de anticipación: el anticipo será devuelto en su totalidad.
- Entre 24 y 72 horas antes del evento: el anticipo quedará como indemnización al Proveedor.
- Con menos de 24 horas de anticipación: el Contratante deberá cancelar el 100% del valor total del servicio.
En caso de cancelación imputable al Proveedor sin causa justificada: deberá devolver el anticipo recibido más un 20% adicional como compensación al Contratante.

VI. LUGAR Y FECHA DE PERFECCIONAMIENTO
Ciudad: Loja
Provincia: Loja
País: Ecuador
Fecha: ${new Date().toLocaleDateString('es-EC')}
Hora: ${new Date().toLocaleTimeString('es-EC')}

VII. JURISDICCIÓN Y RESOLUCIÓN DE CONFLICTOS
Las partes acuerdan que cualquier controversia derivada del presente contrato será resuelta en la jurisdicción de Loja, Ecuador, mediante mediación como primer mecanismo de resolución. En caso de no llegar a un acuerdo, se acudirá a los tribunales competentes de la ciudad de Loja.

VIII. MARCO LEGAL
Este contrato tiene validez jurídica conforme a:
- Ley 67 de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos del Ecuador
- Código Civil Ecuatoriano — requisitos de validez contractual
- LOPDP — Ley Orgánica de Protección de Datos Personales
Los mensajes de datos tienen igual valor jurídico que los documentos escritos (Art. 1 y Art. 6, Ley 67).`;

  const crearContratoFinal = async () => {
    setEnviando(true);
    setError('');
    try {
      const navegador = navigator.userAgent;
      const sistemaOperativo = navigator.platform || navigator.userAgentData?.platform || 'Desconocido';

      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contenidoContrato));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashDocumento = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (esPaquete) {
        const payload = {
          contratos: paqueteInfo.servicios.map(s => {
            const totalPaquete = paqueteInfo.servicios.reduce((acc, curr) => acc + curr.precio, 0);
            const userAnticipo = parseFloat(form.anticipo || 0);
            const propAnticipo = totalPaquete > 0 ? (s.precio / totalPaquete) * userAnticipo : 0;
            return {
              proveedor_id: s.provider_id || s.proveedor_id,
              precio_total: s.precio,
              descripcion_servicio: s.descripcion_servicio || form.descripcion,
              anticipo: propAnticipo,
              saldo: s.precio - propAnticipo
            };
          }),
          tipo_evento: form.tipo_evento,
          fecha_evento: form.fecha_evento,
          hora_evento: form.hora_evento,
          lugar_evento: form.lugar_evento,
          descripcion: form.descripcion,
          cedula_cliente: cedula,
          otp_codigo: otpCode,
          domicilio_cliente: form.domicilio_cliente,
          telefono_cliente: form.telefono_cliente,
          navegador_cliente: navegador,
          sistema_operativo: sistemaOperativo,
          hash_documento: hashDocumento,
          acepto_terminos: true,
          acepto_medios_electronicos: true,
          anticipo: parseFloat(form.anticipo || 0),
          saldo: parseFloat(form.precio_total || 0) - parseFloat(form.anticipo || 0),
        };

        const res = await api.post('/contratos/paquete', payload);
        setContratosCreados(res.data.contratos);
        setContratoCreado(res.data.contratos[0]); // fallback
        setPaso(5);
        showToast('¡Contratos de paquete creados y firmados exitosamente!', 'success');

        // Descargar PDFs automáticamente
        for (const c of res.data.contratos) {
          try {
            await descargarPDF(c.id);
          } catch (e) {
            console.error('Error descargando PDF automático:', e);
          }
        }
      } else {
        const res = await api.post('/contratos', {
          proveedor_id: parseInt(proveedorId),
          tipo_evento: form.tipo_evento,
          fecha_evento: form.fecha_evento,
          hora_evento: form.hora_evento,
          lugar_evento: form.lugar_evento,
          descripcion: form.descripcion,
          precio_total: parseFloat(form.precio_total),
          anticipo: parseFloat(form.anticipo || 0),
          saldo: parseFloat(form.precio_total || 0) - parseFloat(form.anticipo || 0),
          cedula_cliente: cedula,
          otp_codigo: otpCode,
          domicilio_cliente: form.domicilio_cliente,
          telefono_cliente: form.telefono_cliente,
          navegador_cliente: navegador,
          sistema_operativo: sistemaOperativo,
          hash_documento: hashDocumento,
          acepto_terminos: true,
          acepto_medios_electronicos: true,
        });
        setContratoCreado(res.data.contrato);
        setPaso(5);
        showToast('Contrato creado exitosamente', 'success');
        // Descargar PDF automáticamente
        try {
          await descargarPDF(res.data.contrato.id);
        } catch (e) {
          console.error('Error descargando PDF automático:', e);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error creando los contratos');
    } finally {
      setEnviando(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className="flex items-center gap-1 sm:gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            paso > n ? 'bg-green-500 text-white' :
            paso === n ? 'bg-primary text-white' :
            'bg-gray-200 text-gray-500'
          }`}>
            {paso > n ? <CheckCircle size={14} /> : n}
          </div>
          {n < 5 && <div className={`w-6 sm:w-10 h-px transition-colors ${paso > n ? 'bg-green-400' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {paso < 5 && <StepIndicator />}

        {/* PASO 1: Detalles del evento */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-navy px-6 py-5">
              <h1 className="text-white font-bold text-base">Detalles del evento</h1>
              <p className="text-gray-400 text-xs mt-0.5">
                {esPaquete ? (
                  <span>Configurando el paquete de eventos inteligente: <span className="text-blue-300 font-bold">{paqueteInfo?.nombre}</span></span>
                ) : (
                  <span>Contratando a: <span className="text-blue-300 font-bold">{proveedor?.nombre_negocio}</span></span>
                )}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {!esPaquete && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-2.5 items-start">
                  <span className="text-lg mt-0.5 shrink-0">⚠️</span>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Usa este formulario solo si ya coordinaste el precio y los detalles del servicio con el proveedor por WhatsApp.
                  </p>
                </div>
              )}

              {/* Resumen de proveedores */}
              {esPaquete ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                  <p className="font-bold text-navy text-sm">Servicios incluidos en el paquete:</p>
                  <div className="space-y-2">
                    {paqueteInfo?.servicios?.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
                        <div>
                          <span className="font-bold text-navy">{s.nombre_negocio}</span>
                          <span className="text-gray-400 block text-[10px] uppercase font-black tracking-wider">{s.categoria}</span>
                        </div>
                        <span className="font-black text-primary font-mono">${s.precio} USD</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {proveedor?.nombre_negocio?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm">{proveedor?.nombre_negocio}</p>
                    <p className="text-xs text-gray-500">{proveedor?.categoria} · desde ${parseFloat(proveedor?.precio_base || 0).toFixed(0)} USD</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo de evento</label>
                  <select name="tipo_evento" value={form.tipo_evento} onChange={handleChange} className="input-field" required>
                    <option value="">Seleccionar...</option>
                    {TIPOS_EVENTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Precio total acordado (USD)</label>
                  <input
                    name="precio_total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio_total}
                    onChange={handleChange}
                    className="input-field disabled:bg-gray-100 disabled:text-gray-500 font-mono font-bold text-navy"
                    placeholder="Ingresa el precio acordado con el proveedor por WhatsApp"
                    disabled={esPaquete}
                  />
                  {esPaquete && (
                    <span className="text-[10px] text-gray-400 font-semibold block mt-1">Precio fijado por el paquete de IA</span>
                  )}
                </div>
                <div>
                  <label className="label">Fecha del evento</label>
                  <input
                    name="fecha_evento"
                    type="date"
                    value={form.fecha_evento}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Hora del evento</label>
                  <input
                    name="hora_evento"
                    type="time"
                    value={form.hora_evento}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Lugar del evento</label>
                <input
                  name="lugar_evento"
                  type="text"
                  value={form.lugar_evento}
                  onChange={handleChange}
                  placeholder="Dirección completa del evento en Loja"
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Domicilio del cliente</label>
                  <input
                    name="domicilio_cliente"
                    type="text"
                    value={form.domicilio_cliente}
                    onChange={handleChange}
                    placeholder="Tu dirección de domicilio"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Teléfono del cliente</label>
                  <input
                    name="telefono_cliente"
                    type="text"
                    value={form.telefono_cliente}
                    onChange={handleChange}
                    placeholder="Tu número de teléfono"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Descripción del servicio requerido</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe los detalles específicos que necesitas..."
                  className="input-field resize-none"
                />
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider block">Porcentaje de Anticipo</label>
                  <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{anticipoPct}%</span>
                </div>
                
                <div className="flex items-center gap-4 text-left">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={anticipoPct}
                    onChange={e => setAnticipoPct(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <input
                    type="number"
                    min="30"
                    max="100"
                    value={anticipoPct}
                    onChange={e => {
                      const val = Math.max(30, Math.min(100, parseInt(e.target.value) || 30));
                      setAnticipoPct(val);
                    }}
                    className="w-16 border rounded-lg text-center font-bold text-sm py-1 bg-white text-navy focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-gray-400 font-bold">%</span>
                </div>

                <div className="border-t border-gray-200/60 pt-3 grid grid-cols-2 gap-4 text-xs font-bold text-navy">
                  <div className="bg-white border border-gray-200/60 rounded-xl p-3 shadow-2xs">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Anticipo a pagar ({anticipoPct}%)</span>
                    <span className="text-sm font-black text-primary font-mono">
                      ${((parseFloat(form.precio_total || 0) * anticipoPct) / 100).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="bg-white border border-gray-200/60 rounded-xl p-3 shadow-2xs">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Saldo el día del evento ({100 - anticipoPct}%)</span>
                    <span className="text-sm font-black text-navy font-mono">
                      ${(parseFloat(form.precio_total || 0) - ((parseFloat(form.precio_total || 0) * anticipoPct) / 100)).toFixed(2)} USD
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  * El anticipo se abona directamente al proveedor para reservar la fecha. El saldo se cancela el día de la ejecución del evento.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (!form.tipo_evento || !form.fecha_evento || !form.hora_evento || !form.lugar_evento || !form.precio_total || !form.domicilio_cliente || !form.telefono_cliente) {
                    setError('Por favor completa todos los campos requeridos, incluyendo domicilio y teléfono');
                    return;
                  }
                  const antic = parseFloat(form.anticipo || 0);
                  const total = parseFloat(form.precio_total || 0);
                  if (!esPaquete && fechasOcupadas.includes(form.fecha_evento)) {
                    setError('⚠️ El proveedor no está disponible en esta fecha. Por favor elige otra fecha o contáctalo para confirmar.');
                    return;
                  }
                  if (total > 0 && (antic / total) < 0.299) {
                    setError('El anticipo mínimo es del 30% para garantizar la reserva de fecha.');
                    return;
                  }
                  if (antic > total) {
                    setError('El anticipo no puede ser mayor que el precio total del contrato.');
                    return;
                  }
                  setError('');
                  setPaso(2);
                }}
                className="w-full btn-primary py-3"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Cédula */}
        {paso === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-navy px-6 py-5">
              <h1 className="text-white font-bold text-base">Verificación de identidad</h1>
              <p className="text-gray-400 text-xs mt-0.5">Ingresa tu cédula para confirmar tu identidad</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Número de cédula ecuatoriana</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cedula}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setCedula(v);
                      setCedulaValida(false);
                      setError('');
                    }}
                    placeholder="10 dígitos"
                    maxLength={10}
                    className={`input-field flex-1 font-mono text-base tracking-widest ${
                      cedulaValida ? 'border-green-400' : ''
                    }`}
                  />
                  <button
                    onClick={verificarCedula}
                    disabled={cedula.length !== 10 || verificandoCedula}
                    className="btn-primary"
                  >
                    {verificandoCedula ? <Loader size={15} className="animate-spin" /> : 'Verificar'}
                  </button>
                </div>
                {cedulaValida && (
                  <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                    <CheckCircle size={15} />
                    <span>Cédula válida</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                Tu cédula quedará registrada como parte de la firma digital del contrato, con validez legal bajo la Ley 67 de Ecuador.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaso(1)} className="btn-secondary py-3">Volver</button>
                <button
                  disabled={!cedulaValida}
                  onClick={() => { setError(''); setPaso(3); }}
                  className="btn-primary py-3 disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: OTP */}
        {paso === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-navy px-6 py-5">
              <h1 className="text-white font-bold text-base">Código de verificación</h1>
              <p className="text-gray-400 text-xs mt-0.5">Te enviaremos un código OTP a tu correo registrado</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Se enviará el código a:</p>
                <p className="font-bold text-navy">{user?.email}</p>
              </div>

              {!otpEnviado ? (
                <button
                  onClick={enviarOTP}
                  disabled={enviandoOtp}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {enviandoOtp ? (
                    <><Loader size={15} className="animate-spin" /> Enviando...</>
                  ) : (
                    <><Send size={15} /> Enviar código OTP</>
                  )}
                </button>
              ) : (
                <>
                  <div>
                    <label className="label">Ingresa el código de 6 dígitos</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(v);
                        setError('');
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className={`input-field font-mono text-2xl tracking-widest text-center ${
                        otpVerificado ? 'border-green-400' : ''
                      }`}
                      disabled={otpVerificado}
                    />
                    {devOtp && import.meta.env.MODE === 'development' && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 font-bold text-center">
                        Modo desarrollo — tu código es: {devOtp}
                      </div>
                    )}
                  </div>

                  {!otpVerificado && (
                    <>
                      <button
                        onClick={confirmarOTP}
                        disabled={otp.length !== 6 || enviandoOtp}
                        className="w-full btn-primary py-3"
                      >
                        {enviandoOtp ? 'Verificando...' : 'Confirmar código'}
                      </button>
                      <button
                        onClick={enviarOTP}
                        disabled={enviandoOtp}
                        className="w-full text-sm text-primary hover:text-accent font-semibold"
                      >
                        Reenviar código
                      </button>
                    </>
                  )}

                  {otpVerificado && (
                    <div className="flex items-center gap-2 text-green-600 text-sm justify-center">
                      <CheckCircle size={15} />
                      <span>Código verificado correctamente</span>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock size={13} />
                El código es válido por 10 minutos
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaso(2)} className="btn-secondary py-3">Volver</button>
                <button
                  disabled={!otpVerificado}
                  onClick={() => { setError(''); setPaso(4); }}
                  className="btn-primary py-3 disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 4: Leer contrato completo */}
        {paso === 4 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-navy px-6 py-5">
              <h1 className="text-white font-bold text-base">Revisa tu contrato completo</h1>
              <p className="text-gray-400 text-xs mt-0.5">Lee las cláusulas legales obligatorias conforme a la Ley 67 de Ecuador</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="overflow-y-scroll h-64 border border-gray-200 p-4 rounded-xl bg-gray-50 text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap select-text">
                {contenidoContrato}
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkedTerms}
                    onChange={e => setCheckedTerms(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 shrink-0"
                  />
                  <span>He leído y acepto todos los términos y condiciones del contrato.</span>
                </label>

                <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkedElectronic}
                    onChange={e => setCheckedElectronic(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 shrink-0"
                  />
                  <span>Acepto expresamente el uso de medios electrónicos para la celebración de este contrato, conforme a la Ley 67 de Ecuador.</span>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setPaso(3)} disabled={enviando} className="btn-secondary py-3">Volver</button>
                <button
                  disabled={!checkedTerms || !checkedElectronic || enviando}
                  onClick={crearContratoFinal}
                  className="btn-primary py-3 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <><Loader size={15} className="animate-spin" /> Procesando...</>
                  ) : (
                    'Confirmar contrato'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 5: Éxito */}
        {paso === 5 && contratoCreado && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center animate-fade-in">
            <div className="bg-green-600 px-6 py-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={36} className="text-white" />
              </div>
              <h1 className="text-white font-black text-xl mb-1">
                {esPaquete ? '¡Paquete contratado!' : '¡Contrato firmado!'}
              </h1>
              <p className="text-green-100 text-sm">Tu evento está confirmado</p>
            </div>
            <div className="p-6 space-y-5">
              {esPaquete ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs font-semibold">
                    ¡Se crearon y firmaron {contratosCreados.length} contratos con éxito! Los contratos quedan pendientes de firma por parte de los proveedores. Podrás descargar los PDF y se enviarán por email una vez completada la firma de ambas partes.
                  </div>
                  
                  <div className="text-left space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Documentos de contratos:</p>
                    {contratosCreados.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                        <div>
                          <p className="font-bold text-navy">{c.proveedor_nombre}</p>
                          <p className="text-xs font-mono text-gray-500">
                            EVV-{String(c.id).padStart(6, '0')}-{new Date(c.created_at || new Date()).getFullYear()}
                          </p>
                        </div>
                        <button
                          onClick={() => showToast('El contrato estará listo para descarga cuando el proveedor lo firme.', 'warning')}
                          className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs opacity-50 cursor-not-allowed"
                        >
                          <Download size={13} /> Pendiente
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs font-semibold">
                    El contrato ha sido firmado digitalmente por ti. Queda pendiente de firma por parte del proveedor. Podrás descargar el PDF y se enviará a tu correo una vez firmado por ambas partes.
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Número de contrato</p>
                    <p className="font-black text-navy text-lg font-mono">
                      EVV-{String(contratoCreado.id).padStart(6, '0')}-{new Date(contratoCreado.created_at || new Date()).getFullYear()}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-left space-y-2.5 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha del evento</span>
                  <span className="font-semibold text-navy">{form.fecha_evento ? new Date(form.fecha_evento + 'T00:00:00').toLocaleDateString('es-EC') : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hora</span>
                  <span className="font-semibold text-navy">{form.hora_evento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lugar</span>
                  <span className="font-semibold text-navy truncate max-w-[200px]">{form.lugar_evento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Monto total</span>
                  <span className="font-bold text-primary font-mono">USD ${parseFloat(form.precio_total).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 leading-relaxed text-center">
                El pago se realiza directamente entre las partes. Evvnt actúa únicamente como facilitador del acuerdo digital. El proveedor confirmará la recepción del pago desde su panel.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {!esPaquete && (
                  <button
                    onClick={() => showToast('El contrato estará listo para descarga cuando el proveedor lo firme.', 'warning')}
                    className="btn-secondary flex items-center justify-center gap-2 py-3 opacity-50 cursor-not-allowed"
                  >
                    <Download size={15} />
                    PDF (Pendiente firma)
                  </button>
                )}
                <button
                  onClick={() => navigate('/panel-cliente')}
                  className="btn-primary py-3 col-span-1 sm:col-span-2"
                >
                  Ver todos mis contratos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
