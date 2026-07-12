import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProveedorCard from '../components/ProveedorCard';
import { listar } from '../services/proveedores';

const CATEGORIAS = ['Todos', 'DJ', 'Sonido', 'Fotografía', 'Animación', 'Decoración', 'Catering'];

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || 'Todos');
  const [precioMax, setPrecioMax] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (categoria && categoria !== 'Todos') filtros.categoria = categoria;
      if (busqueda) filtros.busqueda = busqueda;
      if (precioMax) filtros.precio_max = precioMax;
      const res = await listar(filtros);
      setProveedores(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [categoria, busqueda, precioMax]);

  useEffect(() => {
    const timer = setTimeout(cargar, 300);
    return () => clearTimeout(timer);
  }, [cargar]);

  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat) setCategoria(cat);
  }, []);

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoria('Todos');
    setPrecioMax('');
  };

  const hayFiltros = busqueda || categoria !== 'Todos' || precioMax;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Banner Planificador IA */}
        <div className="pt-4">
          <Link
            to="/planificador"
            className="flex items-center justify-between bg-blue-50 border border-blue-100 hover:border-blue-200 hover:bg-blue-100/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xs group"
          >
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
              <span>💡 ¿Quieres que la IA arme tu paquete completo? → Usar Planificador IA</span>
            </div>
            <span className="text-xs font-black text-primary group-hover:translate-x-1 transition-transform">
              Ir al Planificador →
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="py-8">
          <h1 className="text-2xl font-black text-navy mb-1">
            Proveedores en Loja
          </h1>
          <p className="text-gray-500 text-sm">
            {loading ? 'Cargando...' : `${proveedores.length} proveedores encontrados`}
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="input-field pl-10"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <input
            type="number"
            value={precioMax}
            onChange={e => setPrecioMax(e.target.value)}
            placeholder="Precio máx. USD"
            className="input-field w-full sm:w-44"
          />
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="text-sm text-primary font-semibold hover:text-accent whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filtros de categoría */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                categoria === cat
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : proveedores.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <h3 className="text-lg font-bold text-navy mb-2">No se encontraron proveedores</h3>
            <p className="text-gray-500 text-sm mb-6">Intenta con otros filtros o términos de búsqueda.</p>
            <button onClick={limpiarFiltros} className="btn-primary">
              Ver todos los proveedores
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {proveedores.map(p => (
              <ProveedorCard key={p.id} proveedor={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

