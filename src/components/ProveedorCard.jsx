import { Link } from 'react-router-dom';
import { Star, CheckCircle, Crown, MapPin, Calendar } from 'lucide-react';

const CATEGORIA_ICONS = {
  DJ: '🎧',
  Sonido: '🔊',
  Fotografía: '📷',
  Animación: '🎪',
  Decoración: '🌸',
  Catering: '🍽️',
  Inflables: '🎈',
};

const CATEGORIA_COLORS = {
  DJ: 'bg-purple-50 text-purple-700',
  Sonido: 'bg-blue-50 text-blue-700',
  Fotografía: 'bg-pink-50 text-pink-700',
  Animación: 'bg-yellow-50 text-yellow-700',
  Decoración: 'bg-emerald-50 text-emerald-700',
  Catering: 'bg-orange-50 text-orange-700',
  Inflables: 'bg-cyan-50 text-cyan-700',
};

export default function ProveedorCard({ proveedor }) {
  const { id, nombre_negocio, categoria, descripcion, precio_base, precio_maximo, calificacion, total_eventos, verificado, plan, ciudad } = proveedor;

  const icon = CATEGORIA_ICONS[categoria] || '🎉';
  const colorClass = CATEGORIA_COLORS[categoria] || 'bg-gray-50 text-gray-700';

  const initials = nombre_negocio
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'EV';

  return (
    <Link to={`/proveedor/${id}`} className="block">
      <div className="card p-5 h-full flex flex-col group cursor-pointer">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
            <span className="text-white font-bold text-sm">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-navy text-sm leading-tight truncate group-hover:text-primary transition-colors">
              {nombre_negocio}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                {icon} {categoria}
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {verificado && (
            <span className="badge-verificado">
              <CheckCircle size={11} />
              Verificado
            </span>
          )}
          {plan === 'premium' && (
            <span className="badge-premium">
              <Crown size={11} />
              Premium
            </span>
          )}
          {ciudad && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={10} />
              {ciudad}
            </span>
          )}
        </div>

        {/* Descripción */}
        <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-2">
          {descripcion}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Desde</p>
            <p className="text-base font-bold text-navy">
              ${parseFloat(precio_base || 0).toFixed(0)}
              <span className="text-xs text-gray-400 font-normal"> USD</span>
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-navy">
                {parseFloat(calificacion || 0).toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {total_eventos || 0} eventos
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

