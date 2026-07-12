import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import PerfilProveedor from './pages/PerfilProveedor';
import Auth from './pages/Auth';
import Verificacion from './pages/Verificacion';
import Contrato from './pages/Contrato';
import PanelCliente from './pages/PanelCliente';
import PanelProveedor from './pages/PanelProveedor';
import Admin from './pages/Admin';
import Planificador from './pages/Planificador';
import EditarPerfil from './pages/EditarPerfil';
import VerificarContrato from './pages/VerificarContrato';
import RecuperarPassword from './pages/RecuperarPassword';
import NuevaPassword from './pages/NuevaPassword';
import './index.css';

function PrivateRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (roles.length > 0 && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/proveedor/:id" element={<PerfilProveedor />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/planificador" element={<Planificador />} />
        <Route path="/verificar/:id" element={<VerificarContrato />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/recuperar-password/:token" element={<NuevaPassword />} />

        {/* Protegidas */}
        <Route
          path="/perfil/editar"
          element={
            <PrivateRoute roles={['cliente', 'proveedor']}>
              <EditarPerfil />
            </PrivateRoute>
          }
        />
        <Route
          path="/verificacion"
          element={
            <PrivateRoute roles={['proveedor']}>
              <Verificacion />
            </PrivateRoute>
          }
        />
        <Route
          path="/contratar/:proveedorId"
          element={
            <PrivateRoute roles={['cliente']}>
              <Contrato />
            </PrivateRoute>
          }
        />
        <Route
          path="/panel-cliente"
          element={
            <PrivateRoute roles={['cliente']}>
              <PanelCliente />
            </PrivateRoute>
          }
        />
        <Route
          path="/panel-proveedor"
          element={
            <PrivateRoute roles={['proveedor']}>
              <PanelProveedor />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={['admin']}>
              <Admin />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

