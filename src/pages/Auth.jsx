import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();

  const [modo, setModo] = useState(searchParams.get('modo') === 'registro' ? 'registro' : 'login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    rol: 'cliente',
  });

  useEffect(() => {
    if (user) {
      if (user.rol === 'proveedor') {
        if (user.cedula_verificada) navigate('/panel-proveedor');
        else navigate('/verificacion');
      }
      else if (user.rol === 'admin') navigate('/admin');
      else navigate('/panel-cliente');
    }
  }, [user]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (modo === 'login') {
        const u = await login(form.email, form.password);
        showToast(`Bienvenido, ${u.nombre.split(' ')[0]}`, 'success');
        
        const pending = sessionStorage.getItem('evvnt_pending_package');
        if (pending && u.rol === 'cliente') {
          navigate('/contratar/paquete', { state: JSON.parse(pending) });
          return;
        }

        if (u.rol === 'proveedor') {
          if (u.cedula_verificada) navigate('/panel-proveedor');
          else navigate('/verificacion');
        }
        else if (u.rol === 'admin') navigate('/admin');
        else navigate('/catalogo');
      } else {
        if (!form.nombre || !form.email || !form.password) {
          setError('Todos los campos son requeridos');
          return;
        }
        if (form.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          return;
        }
        const u = await register(form);
        showToast('Cuenta creada exitosamente', 'success');
        
        const pending = sessionStorage.getItem('evvnt_pending_package');
        if (pending && u.rol === 'cliente') {
          navigate('/contratar/paquete', { state: JSON.parse(pending) });
          return;
        }

        if (u.rol === 'proveedor') {
          if (u.cedula_verificada) navigate('/panel-proveedor');
          else navigate('/verificacion');
        }
        else navigate('/catalogo');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">E</span>
            </div>
            <span className="font-black text-navy text-xl tracking-tight">EVVNT</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Plataforma de entretenimiento para eventos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-gray-100">
            {[
              { key: 'login', label: 'Iniciar sesión' },
              { key: 'registro', label: 'Registrarse' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setModo(tab.key); setError(''); }}
                className={`py-4 text-sm font-semibold transition-colors ${
                  modo === tab.key
                    ? 'text-primary border-b-2 border-primary bg-blue-50/30'
                    : 'text-gray-500 hover:text-navy'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {modo === 'registro' && (
              <>
                <div>
                  <label className="label">Nombre completo</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="nombre"
                      type="text"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Tu nombre completo"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Teléfono (opcional)</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="telefono"
                      type="tel"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="09XXXXXXXX"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Tipo de cuenta</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'cliente', label: 'Soy cliente', desc: 'Quiero contratar servicios', icon: '👤' },
                      { val: 'proveedor', label: 'Soy proveedor', desc: 'Ofrezco servicios de entretenimiento', icon: '🎪' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, rol: opt.val }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          form.rol === opt.val
                            ? 'border-primary bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg block mb-1">{opt.icon}</span>
                        <p className="text-xs font-bold text-navy">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {modo === 'login' && (
              <div className="text-right">
                <Link to="/recuperar-password" className="text-xs font-semibold text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : (
                modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
              )}
            </button>

            {modo === 'registro' && form.rol === 'proveedor' && (
              <p className="text-xs text-gray-500 text-center">
                Al registrarte como proveedor, deberás verificar tu identidad con cédula y reconocimiento facial.
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Al usar Evvnt aceptas nuestros Términos de Servicio y Política de Privacidad.
        </p>
      </div>
    </div>
  );
}

