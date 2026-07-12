import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';

export default function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/auth/recuperar-password', { email });
      setSuccess(res.data.mensaje || 'Si tu email está registrado, recibirás las instrucciones en breve.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.');
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
          <p className="text-gray-500 text-sm mt-2">Recuperación de Contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-navy">¿Olvidaste tu contraseña?</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Ingresa la dirección de correo electrónico asociada a tu cuenta. Te enviaremos un enlace seguro para restablecerla.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-relaxed">
                  {success}
                </div>
              </div>
              <Link to="/auth" className="w-full btn-primary py-3 text-center block text-sm font-semibold">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Correo electrónico</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="tu@correo.com"
                    className="input-field pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-red-700 text-xs font-semibold">{error}</p>
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
                    Enviando instrucciones...
                  </>
                ) : (
                  'Enviar instrucciones'
                )}
              </button>
            </form>
          )}

          <div className="border-t border-gray-100 pt-4 text-center">
            <Link to="/auth" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-navy font-bold transition-colors">
              <ArrowLeft size={14} /> Volver al Inicio de Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
