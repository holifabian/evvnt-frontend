import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, LayoutDashboard, LogOut, User, ChevronDown, Menu, X } from 'lucide-react';
import { listar as listarContratos } from '../services/contratos';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const dropRef = useRef(null);

  useEffect(() => {
    if (user && user.rol === 'proveedor') {
      const fetchPendingCount = () => {
        listarContratos()
          .then(res => {
            const pending = res.data.filter(c => c.timestamp_aceptacion && !c.timestamp_proveedor && c.estado !== 'cancelado');
            setPendingCount(pending.length);
          })
          .catch(err => console.error(err));
      };
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 15000);
      return () => clearInterval(interval);
    } else {
      setPendingCount(0);
    }
  }, [user, location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => {
    const isPlanner = label === 'Planificador IA';
    const isDashboard = label === 'Mi Panel';
    return (
      <Link
        to={to}
        className={`text-sm transition-colors flex items-center gap-1.5 relative ${
          isPlanner
            ? 'font-bold text-blue-600 hover:text-blue-700'
            : isActive(to) ? 'font-medium text-primary' : 'font-medium text-gray-600 hover:text-navy'
        }`}
        onClick={() => setMobileOpen(false)}
      >
        {isPlanner && <span>✨</span>}
        {label}
        {isDashboard && pendingCount > 0 && (
          <span className="bg-red-600 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold px-1 animate-pulse">
            {pendingCount}
          </span>
        )}
      </Link>
    );
  };

  const dashboardPath = user?.rol === 'proveedor' ? '/panel-proveedor'
    : user?.rol === 'admin' ? '/admin' : '/panel-cliente';

  const getNavLinks = () => {
    if (!user) {
      return [
        { to: '/', label: 'Inicio' },
        { to: '/catalogo', label: 'Proveedores' },
        { to: '/planificador', label: 'Planificador IA' }
      ];
    } else if (user.rol === 'proveedor') {
      return [
        { to: '/', label: 'Inicio' },
        { to: dashboardPath, label: 'Mi Panel' }
      ];
    } else {
      return [
        { to: '/', label: 'Inicio' },
        { to: '/catalogo', label: 'Proveedores' },
        { to: '/planificador', label: 'Planificador IA' },
        { to: dashboardPath, label: 'Mi Panel' }
      ];
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm tracking-tight">E</span>
            </div>
            <span className="font-black text-navy text-lg tracking-tight">EVVNT</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {getNavLinks().map(link => navLink(link.to, link.label))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            ) : user ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user.rol === 'proveedor' && user.proveedor?.nombre_negocio
                        ? user.proveedor.nombre_negocio.charAt(0).toUpperCase()
                        : user.nombre?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-navy hidden sm:block max-w-[120px] truncate">
                    {user.rol === 'proveedor' && user.proveedor?.nombre_negocio
                      ? user.proveedor.nombre_negocio
                      : user.nombre?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="text-gray-500" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold px-0.5 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-sm font-semibold text-navy truncate">
                        {user.rol === 'proveedor' && user.proveedor?.nombre_negocio
                          ? user.proveedor.nombre_negocio
                          : user.nombre}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to={dashboardPath}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="flex items-center gap-2.5">
                        <LayoutDashboard size={15} className="text-gray-400" />
                        <span>Mi panel</span>
                      </div>
                      {pendingCount > 0 && (
                        <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/perfil/editar"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={15} className="text-gray-400" />
                      Editar perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-navy">
                  Iniciar sesión
                </Link>
                <Link to="/auth?modo=registro" className="btn-primary text-xs sm:text-sm">
                  Registrarse
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3 animate-fade-in">
            {getNavLinks().map(link => navLink(link.to, link.label))}
            {user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 text-sm text-red-600 font-medium text-left mt-2 border-t border-gray-100 pt-2"
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            ) : (
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-2">
                <Link
                  to="/auth"
                  className="text-sm font-medium text-gray-600 hover:text-navy"
                  onClick={() => setMobileOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/auth?modo=registro"
                  className="btn-primary text-center text-xs py-2 animate-none"
                  onClick={() => setMobileOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

