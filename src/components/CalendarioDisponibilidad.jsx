import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function CalendarioDisponibilidad({
  disponibilidad = [],
  fechasOcupadas = [],
  editable = false,
  onToggle,
}) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const disponMap = {};
  disponibilidad.forEach(d => {
    disponMap[d.fecha] = d.disponible;
  });

  const primerDia = new Date(anio, mes, 1).getDay();
  const totalDias = new Date(anio, mes + 1, 0).getDate();

  const prevMes = () => {
    if (mes === 0) { setMes(11); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };

  const nextMes = () => {
    if (mes === 11) { setMes(0); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };

  const fechaStr = (dia) => {
    const d = String(dia).padStart(2, '0');
    const m = String(mes + 1).padStart(2, '0');
    return `${anio}-${m}-${d}`;
  };

  const esPassado = (dia) => {
    const f = new Date(anio, mes, dia);
    const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return f < h;
  };

  const cells = [];
  for (let i = 0; i < primerDia; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    const fStr = fechaStr(dia);
    let disponible = disponMap[fStr];
    
    // Override if occupied in contracts
    const ocupadoPorContrato = fechasOcupadas.includes(fStr);
    if (ocupadoPorContrato) {
      disponible = false;
    }

    const passado = esPassado(dia);

    let classes = 'w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ';

    if (passado) {
      classes += 'text-gray-300 cursor-default';
    } else if (disponible === false) {
      classes += editable
        ? 'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer'
        : 'bg-red-100 text-red-700 font-bold';
    } else {
      classes += editable
        ? (disponible === undefined
            ? 'text-gray-400 hover:bg-gray-100 cursor-pointer'
            : 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer')
        : 'bg-green-100 text-green-700 font-bold';
    }

    cells.push(
      <button
        key={dia}
        className={classes}
        disabled={passado || !editable}
        onClick={() => editable && !passado && onToggle && onToggle(fStr, disponible)}
        title={
          passado ? 'Fecha pasada'
          : disponible === false ? 'Ocupado'
          : 'Disponible'
        }
      >
        {dia}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      {/* Header del mes */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMes} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <h3 className="text-sm font-bold text-navy">
          {MESES[mes]} {anio}
        </h3>
        <button onClick={nextMes} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Días de semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-100" />
          <span className="text-xs text-gray-500">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100" />
          <span className="text-xs text-gray-500">Ocupado</span>
        </div>
        {editable && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <span className="text-xs text-gray-500">Sin registro</span>
          </div>
        )}
      </div>
    </div>
  );
}

