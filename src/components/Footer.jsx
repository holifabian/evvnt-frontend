import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">E</span>
              </div>
              <span className="font-black text-lg tracking-tight">EVVNT</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Plataforma de contratación de entretenimiento para eventos en Loja, Ecuador.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-gray-300">Plataforma</h4>
            <ul className="space-y-2">
              {[
                ['/', 'Inicio'],
                ['/catalogo', 'Proveedores'],
                ['/auth', 'Iniciar sesión'],
                ['/auth?modo=registro', 'Registrarse'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-gray-300">Categorías</h4>
            <ul className="space-y-2">
              {['DJ', 'Sonido', 'Fotografía', 'Animación', 'Decoración', 'Catering'].map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/catalogo?categoria=${cat}`}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-gray-300">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Ley 67 de Comercio Electrónico</li>
              <li>LOPDP Ecuador</li>
              <li>Contratos digitales válidos</li>
              <li>Firma digital segura</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Evvnt. Todos los derechos reservados. Loja, Ecuador.
          </p>
          <p className="text-gray-600 text-xs">
            Contratos validados bajo Ley 67 de Comercio Electrónico del Ecuador
          </p>
        </div>
      </div>
    </footer>
  );
}

