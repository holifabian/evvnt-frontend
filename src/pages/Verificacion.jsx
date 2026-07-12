import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Camera, Loader, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showToast } from '../components/Toast';

export default function Verificacion() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paso, setPaso] = useState(1);
  const [cedula, setCedula] = useState('');
  const [cedulaValida, setCedulaValida] = useState(null);
  const [cedulaLoading, setCedulaLoading] = useState(false);
  const [rostroLoading, setRostroLoading] = useState(false);
  const [rostroVerificado, setRostroVerificado] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!user || user.rol !== 'proveedor') {
      navigate('/');
    } else if (user.cedula_verificada) {
      navigate('/panel-proveedor');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const verificarCedula = async () => {
    if (cedula.length !== 10) {
      setError('La cédula debe tener 10 dígitos');
      return;
    }
    setCedulaLoading(true);
    setError('');
    try {
      const res = await api.post('/verificacion/cedula', { cedula });
      setCedulaValida(true);
      showToast('Cédula verificada correctamente', 'success');
    } catch (err) {
      setCedulaValida(false);
      setError(err.response?.data?.error || 'Cédula inválida');
    } finally {
      setCedulaLoading(false);
    }
  };

  const activarCamara = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCamaraActiva(true);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Acceso denegado a la cámara. Por favor, concede permisos de cámara en tu navegador para realizar la verificación facial.');
      } else {
        setError('No se pudo acceder a la cámara. Asegúrate de que no esté siendo usada por otra aplicación y que los permisos estén habilitados.');
      }
    }
  };

  const verificarRostro = async () => {
    setRostroLoading(true);
    setError('');
    try {
      await api.post('/verificacion/rostro');
      setRostroVerificado(true);
      // Detener cámara
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      showToast('Verificación biométrica completada', 'success');
    } catch (err) {
      setError('Error en la verificación. Inténtalo de nuevo.');
    } finally {
      setRostroLoading(false);
    }
  };

  const irAlPanel = () => navigate('/panel-proveedor');

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Pasos */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                paso > n ? 'bg-green-500 text-white' :
                paso === n ? 'bg-primary text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {paso > n ? <CheckCircle size={16} /> : n}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${paso === n ? 'text-navy' : 'text-gray-400'}`}>
                {n === 1 ? 'Verificar cédula' : 'Verificar rostro'}
              </span>
              {n < 2 && <ChevronRight size={16} className="text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-navy px-6 py-5">
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} className="text-blue-300" />
              <div>
                <h1 className="text-white font-bold text-base">
                  {paso === 1 ? 'Verificación de identidad' : 'Verificación biométrica'}
                </h1>
                <p className="text-gray-400 text-xs">
                  {paso === 1
                    ? 'Ingresa tu cédula ecuatoriana para validar tu identidad'
                    : 'Captura tu rostro para completar la verificación'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* PASO 1: Cédula */}
            {paso === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="label">Número de cédula ecuatoriana</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cedula}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setCedula(v);
                        setCedulaValida(null);
                        setError('');
                      }}
                      placeholder="10 dígitos"
                      maxLength={10}
                      className={`input-field flex-1 font-mono text-base tracking-widest ${
                        cedulaValida === true ? 'border-green-400 focus:border-green-400' :
                        cedulaValida === false ? 'border-red-400 focus:border-red-400' : ''
                      }`}
                    />
                    <button
                      onClick={verificarCedula}
                      disabled={cedula.length !== 10 || cedulaLoading}
                      className="btn-primary whitespace-nowrap"
                    >
                      {cedulaLoading ? (
                        <Loader size={16} className="animate-spin" />
                      ) : 'Verificar'}
                    </button>
                  </div>

                  {cedulaValida === true && (
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                      <CheckCircle size={15} />
                      <span>Cédula válida — Registro Civil del Ecuador</span>
                    </div>
                  )}
                  {cedulaValida === false && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <AlertCircle size={15} />
                      <span>Cédula inválida. Verifica el número.</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4 text-xs text-blue-700 leading-relaxed">
                  <strong>¿Por qué verificamos tu cédula?</strong><br />
                  Evvnt valida la identidad de todos los proveedores para garantizar la seguridad de los clientes. 
                  Tu información está protegida bajo la LOPDP (Ley Orgánica de Protección de Datos Personales).
                </div>

                <button
                  disabled={!cedulaValida}
                  onClick={() => setPaso(2)}
                  className="w-full btn-primary py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar a verificación facial
                </button>
              </div>
            )}

            {/* PASO 2: Rostro */}
            {paso === 2 && (
              <div className="space-y-5">
                {!rostroVerificado ? (
                  <>
                    {/* Viewfinder de cámara */}
                    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                      {camaraActiva ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          {/* Óvalo de encuadre */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg width="200" height="240" viewBox="0 0 200 240">
                              <ellipse
                                cx="100" cy="120" rx="85" ry="105"
                                fill="none"
                                stroke="rgba(255,255,255,0.8)"
                                strokeWidth="2.5"
                                strokeDasharray="8 4"
                              />
                            </svg>
                          </div>
                          <div className="absolute bottom-3 left-0 right-0 text-center">
                            <p className="text-white text-xs bg-black/50 inline-block px-3 py-1 rounded-full">
                              Centra tu rostro en el óvalo
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-white p-6">
                          <Camera size={40} className="mx-auto mb-3 text-gray-400" />
                          <p className="text-sm text-gray-300">La cámara no está activa</p>
                        </div>
                      )}

                      {rostroLoading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                          <Loader size={32} className="text-white animate-spin" />
                          <p className="text-white text-sm font-semibold">Verificando identidad...</p>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {!camaraActiva ? (
                        <button
                          onClick={activarCamara}
                          className="col-span-2 btn-secondary py-3 flex items-center justify-center gap-2"
                        >
                          <Camera size={16} />
                          Activar cámara
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setPaso(1)}
                            className="btn-secondary py-3"
                          >
                            Volver
                          </button>
                          <button
                            onClick={verificarRostro}
                            disabled={rostroLoading}
                            className="btn-primary py-3 flex items-center justify-center gap-2"
                          >
                            {rostroLoading ? (
                              <Loader size={16} className="animate-spin" />
                            ) : (
                              <>
                                <ShieldCheck size={16} />
                                Verificar rostro
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  /* Éxito */
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-lg font-black text-navy mb-2">¡Verificación completada!</h2>
                    <p className="text-gray-500 text-sm mb-6">
                      Tu identidad ha sido verificada. Ya puedes acceder a tu panel de proveedor y comenzar a recibir solicitudes.
                    </p>
                    <button onClick={irAlPanel} className="btn-primary px-8 py-3">
                      Ir a mi panel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

