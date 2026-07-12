import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Eye, EyeOff, Save, Key, AlertTriangle, CheckCircle, Loader, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showToast } from '../components/Toast';

export default function EditarPerfil() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Sección 1 - Info Personal States
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cedula: '',
    domicilio: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Sección 2 - Password States
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    password_nuevo: '',
    password_confirmacion: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Ojo de contraseña states
  const [showActual, setShowActual] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Iniciales del avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  // Cargar datos actuales
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchPerfil = async () => {
      setLoadingProfile(true);
      try {
        const res = await api.get('/usuarios/perfil');
        setProfileForm({
          nombre: res.data.nombre || '',
          email: res.data.email || '',
          telefono: res.data.telefono || '',
          cedula: res.data.cedula || '',
          domicilio: res.data.domicilio || ''
        });
      } catch (err) {
        setProfileError('No se pudieron cargar los datos de tu perfil.');
        showToast('Error cargando datos de perfil', 'error');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchPerfil();
  }, [user, navigate]);

  // Manejo de cambios en formulario de perfil
  const handleProfileChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileError('');
    setProfileSuccess('');
  };

  // Manejo de cambios en contraseña
  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

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

  // Guardar cambios de perfil
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.nombre || !profileForm.email) {
      setProfileError('El nombre y el correo electrónico son obligatorios.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await api.put('/usuarios/perfil', profileForm);
      setProfileSuccess(res.data.mensaje || 'Perfil actualizado correctamente.');
      showToast('Perfil actualizado con éxito', 'success');
      
      // Actualizar el estado global del usuario
      updateUser({
        nombre: res.data.user.nombre,
        email: res.data.user.email,
        telefono: res.data.user.telefono,
        cedula: res.data.user.cedula,
        domicilio: res.data.user.domicilio
      });
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al actualizar el perfil.';
      setProfileError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Guardar contraseña nueva
  const handleSavePassword = async (e) => {
    e.preventDefault();
    const { password_actual, password_nuevo, password_confirmacion } = passwordForm;

    if (!password_actual || !password_nuevo || !password_confirmacion) {
      setPasswordError('Todos los campos de contraseña son obligatorios.');
      return;
    }

    if (password_nuevo !== password_confirmacion) {
      setPasswordError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (password_nuevo.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const res = await api.put('/usuarios/cambiar-password', passwordForm);
      setPasswordSuccess(res.data.mensaje || 'Contraseña actualizada correctamente.');
      showToast('Contraseña actualizada con éxito', 'success');
      setPasswordForm({
        password_actual: '',
        password_nuevo: '',
        password_confirmacion: ''
      });
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cambiar la contraseña.';
      setPasswordError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const dashboardPath = user?.rol === 'proveedor' ? '/panel-proveedor'
    : user?.rol === 'admin' ? '/admin' : '/panel-cliente';

  if (loadingProfile) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Enlace de regreso */}
        <button
          onClick={() => navigate(dashboardPath)}
          className="flex items-center gap-2 text-gray-500 hover:text-navy text-sm font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a Mi Panel
        </button>

        <h1 className="text-2xl font-black text-navy mb-8">Editar Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Foto de Perfil & Avatar */}
          <div className="md:col-span-1">
            <div className="card p-6 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-black shadow-md mb-4 border-4 border-white">
                {getInitials(profileForm.nombre)}
              </div>
              <h2 className="font-bold text-navy text-base truncate max-w-full">
                {profileForm.nombre || user?.nombre}
              </h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-semibold">
                Rol: {user?.rol}
              </p>
              
              <button
                type="button"
                className="mt-6 btn-secondary w-full text-xs py-2 px-3 opacity-60 cursor-not-allowed"
                disabled
              >
                Cambiar foto
              </button>
              <span className="text-[10px] text-gray-400 mt-1 block">Soporte para fotos próximamente</span>
            </div>
          </div>

          {/* Columna Derecha: Formularios de Edición */}
          <div className="md:col-span-2 space-y-6">
            
            {/* SECCIÓN 1 — INFORMACIÓN PERSONAL */}
            <div className="card p-6">
              <h2 className="text-base font-bold text-navy mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                <User size={18} className="text-primary" />
                Información Personal
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="label">Nombre completo</label>
                  <input
                    type="text"
                    name="nombre"
                    value={profileForm.nombre}
                    onChange={handleProfileChange}
                    className="input-field"
                    placeholder="Tu nombre"
                    required
                  />
                </div>

                <div>
                  <label className="label">Correo electrónico</label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="input-field"
                    placeholder="ejemplo@correo.com"
                    required
                  />
                  <div className="flex items-start gap-2 mt-2 bg-amber-50 border border-amber-100 text-amber-800 p-2.5 rounded-lg text-xs leading-relaxed">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                    <span><strong>Advertencia:</strong> Cambiar tu correo afectará el envío de códigos OTP para firmar contratos.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Teléfono</label>
                    <input
                      type="text"
                      name="telefono"
                      value={profileForm.telefono}
                      onChange={handleProfileChange}
                      className="input-field"
                      placeholder="Ej: 0987654321"
                    />
                  </div>
                  <div>
                    <label className="label">Cédula de identidad</label>
                    <input
                      type="text"
                      name="cedula"
                      value={profileForm.cedula}
                      onChange={handleProfileChange}
                      className="input-field font-mono"
                      placeholder="10 dígitos"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Domicilio / Dirección</label>
                  <input
                    type="text"
                    name="domicilio"
                    value={profileForm.domicilio}
                    onChange={handleProfileChange}
                    className="input-field"
                    placeholder="Tu dirección residencial en Loja"
                  />
                </div>

                {profileSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
                    <CheckCircle size={16} className="text-green-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar cambios
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* SECCIÓN 2 — CAMBIAR CONTRASEÑA */}
            <div className="card p-6">
              <h2 className="text-base font-bold text-navy mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Key size={18} className="text-primary" />
                Cambiar Contraseña
              </h2>

              <form onSubmit={handleSavePassword} className="space-y-4">
                
                {/* Contraseña Actual */}
                <div>
                  <label className="label">Contraseña actual</label>
                  <div className="relative">
                    <input
                      type={showActual ? 'text' : 'password'}
                      name="password_actual"
                      value={passwordForm.password_actual}
                      onChange={handlePasswordChange}
                      className="input-field pr-10"
                      placeholder="Ingrese contraseña actual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowActual(!showActual)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showActual ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Contraseña Nueva */}
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
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fortaleza:</span>
                        <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} transition-all duration-300 ${strength.width}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="label">Confirmar nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="password_confirmacion"
                      value={passwordForm.password_confirmacion}
                      onChange={handlePasswordChange}
                      className="input-field pr-10"
                      placeholder="Repita nueva contraseña"
                      required
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

                {passwordSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
                    <CheckCircle size={16} className="text-green-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full btn-primary bg-navy hover:bg-slate-800 text-white py-3 flex items-center justify-center gap-2"
                >
                  {savingPassword ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Actualizar contraseña
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
