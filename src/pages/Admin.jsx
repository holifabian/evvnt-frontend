import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, FileText, TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showToast } from '../components/Toast';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [proveedores, setProveedores] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('proveedores');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (user.rol !== 'admin') { navigate('/'); return; }
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/proveedores'),
        api.get('/contratos'),
      ]);
      setProveedores(pRes.data);
      setContratos(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const aprobarProveedor = async (id) => {
    try {
      await api.put(`/proveedores`, { verificado: true });
      showToast('Proveedor aprobado', 'success');
      cargar();
    } catch (err) {
      showToast('Error aprobando proveedor', 'error');
    }
  };

  const provPendientes = proveedores.filter(p => !p.verificado);
  const provVerificados = proveedores.filter(p => p.verificado);
  const totalIngresos = contratos
    .filter(c => c.estado === 'completado')
    .reduce((s, c) => s + parseFloat(c.precio_total || 0) * 0.05, 0);

  const stats = [
    { label: 'Proveedores', val: proveedores.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pendientes aprobación', val: provPendientes.length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Contratos totales', val: contratos.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Comisiones generadas', val: `$${totalIngresos.toFixed(2)}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck size={22} className="text-primary" />
            <h1 className="text-2xl font-black text-navy">Panel de Administración</h1>
          </div>
          <p className="text-gray-500 text-sm">Evvnt — Control y gestión de la plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-black text-navy">{val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-1">
          {[
            { key: 'proveedores', label: `Proveedores (${proveedores.length})` },
            { key: 'pendientes', label: `Pendientes (${provPendientes.length})` },
            { key: 'contratos', label: `Contratos (${contratos.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-navy'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Proveedores */}
            {tab === 'proveedores' && (
              <div className="space-y-3">
                {proveedores.map(p => (
                  <div key={p.id} className="card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">
                          {p.nombre_negocio?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy text-sm truncate">{p.nombre_negocio}</p>
                        <p className="text-xs text-gray-500">{p.categoria} · {p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        p.plan === 'premium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.plan}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        p.verificado ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {p.verificado ? 'Verificado' : 'Sin verificar'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pendientes */}
            {tab === 'pendientes' && (
              <div className="space-y-3">
                {provPendientes.length === 0 ? (
                  <div className="card p-10 text-center text-gray-400">
                    <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
                    <p className="font-semibold">No hay proveedores pendientes de aprobación</p>
                  </div>
                ) : (
                  provPendientes.map(p => (
                    <div key={p.id} className="card p-4 border-amber-200 bg-amber-50/20">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">{p.nombre_negocio?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-bold text-navy text-sm">{p.nombre_negocio}</p>
                            <p className="text-xs text-gray-600">{p.categoria}</p>
                            <p className="text-xs text-gray-500">{p.email} · {p.telefono}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Registrado: {new Date(p.created_at).toLocaleDateString('es-EC')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => aprobarProveedor(p.id)}
                            className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle size={13} /> Aprobar
                          </button>
                          <button className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-100 transition-colors">
                            <XCircle size={13} /> Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Contratos */}
            {tab === 'contratos' && (
              <div className="space-y-3">
                {contratos.map(c => (
                  <div key={c.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-navy">{c.cliente_nombre}</p>
                          <span className="text-gray-400 text-xs">→</span>
                          <p className="text-sm font-semibold text-primary">{c.proveedor_nombre}</p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span>{c.tipo_evento}</span>
                          <span>{new Date(c.fecha_evento + 'T00:00:00').toLocaleDateString('es-EC')}</span>
                          <span>{c.lugar_evento}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-navy">${parseFloat(c.precio_total || 0).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          c.estado === 'completado' ? 'bg-green-50 text-green-700' :
                          c.estado === 'activo' ? 'bg-blue-50 text-blue-700' :
                          c.estado === 'cancelado' ? 'bg-red-50 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {c.estado}
                        </span>
                        {c.checkin_realizado && (
                          <p className="text-xs text-green-600 mt-0.5">Check-in ✓</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

