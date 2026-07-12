import { useState } from 'react';

const ContratoResumen = ({ contrato, onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  if (accepted) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
        <p className="text-green-800">✅ Has aceptado el contrato. Procediendo con la generación...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Resumen del Contrato</h3>
      <div className="space-y-4">
        <div>
          <p className="font-bold">Número de Contrato:</p>
          <p className="pl-2">{contrato.id}</p>
        </div>
        <div>
          <p className="font-bold">Tipo de Evento:</p>
          <p className="pl-2">{contrato.tipo_evento}</p>
        </div>
        <div>
          <p className="font-bold">Fecha del Evento:</p>
          <p className="pl-2">{new Date(contrato.fecha_evento).toLocaleDateString('es-EC')}</p>
        </div>
        <div>
          <p className="font-bold">Hora del Evento:</p>
          <p className="pl-2">{contrato.hora_evento}</p>
        </div>
        <div>
          <p className="font-bold">Lugar del Evento:</p>
          <p className="pl-2">{contrato.lugar_evento}</p>
        </div>
        <div>
          <p className="font-bold">Descripción:</p>
          <p className="pl-2">{contrato.descripcion}</p>
        </div>
        <div>
          <p className="font-bold">Precio Total:</p>
          <p className="pl-2">$${contrato.precio_total}</p>
        </div>
        <div>
          <p className="font-bold">Cliente:</p>
          <p className="pl-2">{contrato.cliente_nombre}</p>
        </div>
        <div>
          <p className="font-bold">Proveedor:</p>
          <p className="pl-2">{contrato.proveedor_nombre_negocio}</p>
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleAccept}
          className="bg-accent text-white px-6 py-2 rounded hover:bg-opacity-90"
          disabled={accepted}
        >
          {accepted ? 'Aceptado' : 'Acepto el Contrato'}
        </button>
      </div>
    </div>
  );
};

export default ContratoResumen;