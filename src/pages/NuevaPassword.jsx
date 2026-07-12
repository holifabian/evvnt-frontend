import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Loader, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { showToast } from '../components/Toast';

export default function NuevaPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [passwordForm, setPasswordForm] = useState({
    password_nuevo: '',
    password_confirmacion: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Ojo de contraseña states
  const [showNuevo, setShowNuevo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validación de fuerza de contraseña
  const getPasswordStrength = (password) => {
    if (!password) return { label: '', color: 'bg-gray-200', textClass: 'text-gray-400', width: 'w-0' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      return { label: 'Débil', color: 'bg-red-500', textClass: 'text-red-500', width: 'w-1/3' };
    } else if (score === 2 || score === 3) {
      return { label: 'Media', color: 'bg-amber-500', textClass: 'text-amber-500', width: 'w-2/3' };
    } else {
      return { label: 'Fuerte', color: 'bg-green-500', textClass: 'text-green-500', width: 'w-full' };
    }
  };

  const strength = getPasswordStrength(passwordForm.password_nuevo);

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { password_nuevo, password_confirmacion } = passwordForm;

    if (!password_nuevo || !password_confirmacion) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (password_nuevo !== password_confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password_nuevo.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post(`/auth/nueva-password/${token}`, { password_nuevo });
      setSuccess(true);
      showToast('Contraseña restablecida con éxito.', 'success');
      
      // Redirigir al login en 3 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.');
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
          <p className="text-gray-500 text-sm mt-2">Nueva Contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-navy">Crea una nueva contraseña</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Elige una contraseña segura y fácil de recordar que cumpla con los requisitos.
            </p>
          </div>

          {success ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h3 className="font-black text-navy text-base">¡Contraseña restablecida!</h3>
              <p className="text-xs text-gray-500">
                Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio de sesión en unos segundos...
              </p>
              <Link to="/auth" className="w-full btn-primary py-3 text-center block text-sm font-semibold mt-2">
                Ir al inicio de sesión ahora
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nueva Contraseña */}
              <div>
                <label className="label">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNuevo ? 'text' : 'password'}
                    name="password_nuevo"
                    value={passwordForm.password_nuevo}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNuevo(!showNuevo)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNuevo ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Indicador de Fortaleza */}
                {passwordForm.password_nuevo && (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">Fortaleza:</span>
                      <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all duration-300 ${strength.width}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="label">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="password_confirmacion"
                    value={passwordForm.password_confirmacion}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    placeholder="Repita nueva contraseña"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold leading-relaxed">
                    {error}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Cambiar contraseña'
                )}
              </button>
            </form>
          )}

          {!success && error && (
            <div className="border-t border-gray-100 pt-4 text-center">
              <Link to="/recuperar-password" className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline">
                Solicitar un nuevo enlace de recuperación
              </Link>
            </div>
          )}

          <div className="text-center pt-2">
            <Link to="/auth" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-navy font-bold transition-colors">
              <ArrowLeft size={14} /> Volver al Inicio de Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
