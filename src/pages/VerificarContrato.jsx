import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileText, Upload, Calendar, Clock, User, CheckCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { showToast } from '../components/Toast';

export default function VerificarContrato() {
  const { id } = useParams();
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de verificación de archivo
  const [archivo, setArchivo] = useState(null);
  const [hashCalculado, setHashCalculado] = useState('');
  const [verificandoArchivo, setVerificandoArchivo] = useState(false);
  const [resultadoVerificacion, setResultadoVerificacion] = useState(null); // 'valido' | 'invalido' | null

  useEffect(() => {
    const cargarContratoPublico = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/contratos/verificar/${id}`);
        setContrato(res.data);
      } catch (err) {
        console.error(err);
        setError('El enlace de verificación es inválido o el contrato no existe.');
      } finally {
        setLoading(false);
      }
    };
    cargarContratoPublico();
  }, [id]);

  // Calcular Hash SHA-256 del PDF subido
  const calcularHashSHA256 = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArchivo(file);
    setVerificandoArchivo(true);
    setResultadoVerificacion(null);

    try {
      const hash = await calcularHashSHA256(file);
      setHashCalculado(hash);
      
      // Comparar con el hash del contrato
      if (contrato && contrato.hash_documento) {
        if (hash.toLowerCase() === contrato.hash_documento.toLowerCase()) {
          setResultadoVerificacion('valido');
          showToast('Contrato verificado: Auténtico', 'success');
        } else {
          setResultadoVerificacion('invalido');
          showToast('Advertencia: El documento ha sido alterado', 'error');
        }
      } else {
        showToast('El contrato no cuenta con un hash registrado para comparar.', 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast('Error procesando el archivo para verificación.', 'error');
    } finally {
      setVerificandoArchivo(false);
    }
  };

  const getEstadoBadge = (estado, hasClientSig, hasProvSig) => {
    if (estado === 'cancelado') {
      return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">Cancelado</span>;
    }
    if (hasClientSig && hasProvSig) {
      return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">Firmado (Válido)</span>;
    }
    return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Pendiente de firmas</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !contrato) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full card p-8 text-center">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-navy mb-2">Error de Verificación</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'No se pudo cargar la información del contrato.'}</p>
          <Link to="/" className="btn-primary inline-block w-full">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const numContrato = `EVV-${String(contrato.id).padStart(6, '0')}-${new Date(contrato.created_at).getFullYear()}`;
  const totalPagos = parseFloat(contrato.precio_total || 0);
  const anticipoPagos = parseFloat(contrato.anticipo || 0);
  const saldoPagos = totalPagos - anticipoPagos;

  const hasClientSig = !!contrato.cliente_timestamp;
  const hasProvSig = !!contrato.proveedor_timestamp;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Encabezado Principal de Verificación */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 text-primary font-black text-2xl tracking-tight mb-2">
            <span>EVVNT</span>
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md font-semibold tracking-normal uppercase">Verificación</span>
          </div>
          <h1 className="text-xl font-bold text-navy">Verificación Pública de Contrato</h1>
          <p className="text-xs text-gray-400 mt-1">Valida la autenticidad y estado de firmas en la plataforma</p>
        </div>

        {/* Tarjeta 1: Estado y Resumen */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
            <div>
              <span className="text-[10px] uppercase text-gray-400 tracking-wider font-semibold block">Código de Documento</span>
              <span className="text-base font-black text-navy">{numContrato}</span>
            </div>
            <div>
              {getEstadoBadge(contrato.estado, hasClientSig, hasProvSig)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-400 text-xs block">Fecha de Generación</span>
                <span className="text-navy font-semibold">{new Date(contrato.created_at).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText size={16} className="text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-400 text-xs block">Servicio / Evento</span>
                <span className="text-navy font-semibold">{contrato.tipo_evento} ({contrato.proveedor_nombre})</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-400 text-xs block">Firma Cliente (Aceptado)</span>
                {hasClientSig ? (
                  <span className="text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle size={14} /> {new Date(contrato.cliente_timestamp).toLocaleString('es-EC')}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold mt-0.5 block">Pendiente de firma</span>
                )}
                <span className="text-[10px] text-gray-400 block mt-0.5">OTP: {contrato.cliente_otp} | IP: {contrato.cliente_ip}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-400 text-xs block">Firma Proveedor (Aceptado)</span>
                {hasProvSig ? (
                  <span className="text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle size={14} /> {new Date(contrato.proveedor_timestamp).toLocaleString('es-EC')}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold mt-0.5 block">Pendiente de firma</span>
                )}
                <span className="text-[10px] text-gray-400 block mt-0.5">OTP: {contrato.proveedor_otp} | IP: {contrato.proveedor_ip}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-5 pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <span className="text-[10px] text-gray-400 font-bold block">Valor Total</span>
                <span className="text-sm font-black text-navy">$ {totalPagos.toFixed(2)}</span>
              </div>
              <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-3">
                <span className="text-[10px] text-blue-600 font-bold block">Anticipo</span>
                <span className="text-sm font-black text-primary">$ {anticipoPagos.toFixed(2)}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <span className="text-[10px] text-gray-400 font-bold block">Saldo al Evento</span>
                <span className="text-sm font-black text-navy">$ {saldoPagos.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Verificación de Integridad de PDF */}
        <div className="card p-6">
          <h2 className="text-sm font-black text-navy mb-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            Verificación de integridad del archivo
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-5">
            Los contratos de Evvnt cuentan con una firma digital encriptada mediante un hash SHA-256 exclusivo. 
            Carga el archivo PDF original de tu contrato para comprobar que no ha sido alterado desde su firma.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-5">
            {/* Input file dropzone */}
            <div className="flex-1 w-full">
              <label className="border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 block bg-gray-50/50">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-navy block">
                  {archivo ? archivo.name : 'Subir archivo PDF del contrato'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">Haz clic para buscar en tu dispositivo</span>
              </label>
            </div>

            {/* Panel de resultado */}
            <div className="w-full md:w-80 shrink-0">
              {verificandoArchivo ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-center flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs text-navy font-semibold">Calculando firma SHA-256...</span>
                </div>
              ) : resultadoVerificacion === 'valido' ? (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-green-600 shrink-0" />
                    <span className="text-xs font-black text-green-900">CONTRATO AUTÉNTICO</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Este contrato es auténtico y no ha sido alterado. El hash SHA-256 del documento cargado coincide plenamente con los registros de la plataforma.
                  </p>
                </div>
              ) : resultadoVerificacion === 'invalido' ? (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={20} className="text-red-600 shrink-0" />
                    <span className="text-xs font-black text-red-900">ADVERTENCIA</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    <strong>ADVERTENCIA: Este contrato puede haber sido modificado.</strong> El hash SHA-256 del documento cargado NO coincide con nuestra base de datos.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <HelpCircle size={20} className="text-gray-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-500 font-semibold block">Esperando documento...</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Sube el PDF para compararlo</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-100/50 border border-gray-100 rounded-xl p-3.5 mt-5 font-mono text-[10px] break-all leading-normal text-gray-500">
            <span className="font-bold text-gray-700 block mb-1">Hash SHA-256 de Registro:</span>
            {contrato.hash_documento || 'No registrado'}
            {hashCalculado && (
              <>
                <span className="font-bold text-gray-700 block mt-2.5 mb-1">Hash SHA-256 de Archivo Subido:</span>
                <span className={resultadoVerificacion === 'valido' ? 'text-green-600 font-bold' : resultadoVerificacion === 'invalido' ? 'text-red-600 font-bold' : ''}>
                  {hashCalculado}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Botón Volver al inicio */}
        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-navy font-bold transition-colors">
            <ArrowLeft size={14} /> Volver al Inicio
          </Link>
        </div>

      </div>
    </div>
  );
}
