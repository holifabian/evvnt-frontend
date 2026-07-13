import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Star, Clock, CheckCircle, Music, Camera, Utensils, Palette } from 'lucide-react';
import Footer from '../components/Footer';

const PASOS = [
  {
    num: '01',
    titulo: 'Explora proveedores',
    desc: 'Navega el catálogo de proveedores verificados en Loja. Filtra por categoría, precio y disponibilidad.',
    icon: '🔍',
  },
  {
    num: '02',
    titulo: 'Verifica disponibilidad',
    desc: 'Consulta el calendario del proveedor y elige la fecha perfecta para tu evento.',
    icon: '📅',
  },
  {
    num: '03',
    titulo: 'Firma el contrato digital',
    desc: 'Confirma tu identidad con cédula y OTP. El contrato tiene validez legal bajo Ley 67 de Ecuador.',
    icon: '✍️',
  },
  {
    num: '04',
    titulo: 'Disfruta tu evento',
    desc: 'Disfruta de tu evento con el respaldo de un acuerdo formal legalizado digitalmente.',
    icon: '🎉',
  },
];

const TESTIMONIOS = [
  {
    nombre: 'María Fernanda Torres',
    evento: 'Quinceañera',
    texto: 'Contraté al DJ Andrés Quezada a través de Evvnt y fue increíble. El contrato digital me dio total seguridad y el evento fue perfecto.',
    calificacion: 5,
    inicial: 'M',
  },
  {
    nombre: 'Carlos Andrés Mora',
    evento: 'Boda',
    texto: 'La fotógrafa Ximena Bravo capturó momentos únicos. La firma del contrato digital y la seguridad del acuerdo me dieron tranquilidad total.',
    calificacion: 5,
    inicial: 'C',
  },
  {
    nombre: 'Lucía Valeria Pinta',
    evento: 'Cumpleaños infantil',
    texto: 'Inflajuegos Flash hizo que la fiesta de mi hija sea mágica. Los contratos digitales son muy fáciles de entender.',
    calificacion: 5,
    inicial: 'L',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-navy overflow-hidden pt-32 pb-20 px-4">
        {/* Fondo decorativo */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/80 text-xs font-medium">Loja, Ecuador — Proveedores verificados</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
            Planifica tu evento
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">
              con total seguridad
            </span>
          </h1>

          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Conectamos clientes con los mejores proveedores de entretenimiento en Loja. 
            Contratos digitales legales, verificación de identidad y acuerdos con respaldo legal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-accent transition-colors group"
            >
              Ver proveedores
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/auth?modo=registro"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-white/20 transition-colors"
            >
              Registrar mi negocio
            </Link>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              to="/planificador"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-accent transition-colors"
            >
              Planificar con Inteligencia Artificial
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg mx-auto">
            {[
              { num: '9+', label: 'Proveedores' },
              { num: '500+', label: 'Eventos' },
              { num: '4.9', label: 'Calificación' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-black text-white">{stat.num}</p>
                <p className="text-gray-400 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-16 px-4 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-gray-400 text-sm font-semibold mb-8 uppercase tracking-wider">
            Categorías disponibles en Loja
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {[
              { icon: '🎧', label: 'DJ', cat: 'DJ' },
              { icon: '🔊', label: 'Sonido', cat: 'Sonido' },
              { icon: '📷', label: 'Foto', cat: 'Fotografía' },
              { icon: '🎪', label: 'Animación', cat: 'Animación' },
              { icon: '🌸', label: 'Decoración', cat: 'Decoración' },
              { icon: '🍽️', label: 'Catering', cat: 'Catering' },
              { icon: '🎈', label: 'Inflables', cat: 'Animación' },
              { icon: '💡', label: 'Luces', cat: 'Decoración' },
            ].map(item => (
              <Link
                key={item.label}
                to={`/catalogo?categoria=${item.cat}`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-navy mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Desde la búsqueda hasta el evento, todo el proceso está protegido y documentado legalmente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PASOS.map((paso, i) => (
              <div key={paso.num} className="relative">
                {i < PASOS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gray-200 z-0" style={{ width: 'calc(100% - 32px)', left: '50%' }} />
                )}
                <div className="card p-6 text-center relative z-10">
                  <div className="text-3xl mb-3">{paso.icon}</div>
                  <span className="text-xs font-black text-primary/50 tracking-widest">{paso.num}</span>
                  <h3 className="text-sm font-bold text-navy mt-1 mb-2">{paso.titulo}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garantía Legal y de Seguridad */}
      <section className="py-20 px-4 bg-navy">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/20 text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                <Shield size={13} />
                Firma Digital Segura
              </div>
              <h2 className="text-3xl font-black text-white mb-4">
                Seguridad Jurídica
                <br />
                para tu evento
              </h2>
              <p className="text-gray-300 leading-relaxed mb-8">
                Evvnt facilita la formalización de acuerdos digitales robustos y seguros entre organizadores y proveedores locales en Loja.
              </p>

              <div className="space-y-4">
                {[
                  { icon: CheckCircle, label: 'Contratos digitales legales bajo Ley 67 de Ecuador' },
                  { icon: CheckCircle, label: 'Verificación de identidad con cédula y OTP' },
                  { icon: CheckCircle, label: 'Acuerdo digital registrado con IP y timestamp como prueba electrónica' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon size={16} className="text-green-400 shrink-0" />
                    <span className="text-gray-300 text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Flujo visual */}
            <div className="space-y-3">
              {[
                { step: '1', label: 'Selección de servicios', sub: 'Elige al proveedor y define los términos', color: 'bg-blue-500' },
                { step: '2', label: 'Verificación de identidad', sub: 'Confirmación mediante cédula y código OTP', color: 'bg-primary' },
                { step: '3', label: 'Firma electrónica', sub: 'Registro seguro con IP y marcas de tiempo', color: 'bg-indigo-500' },
                { step: '4', label: 'Respaldo legal', sub: 'Descarga inmediata del contrato firmado en PDF', color: 'bg-green-500' },
              ].map((item, i) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className={`${item.color} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {item.step}
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                    <p className="text-white text-sm font-semibold">{item.label}</p>
                    <p className="text-gray-400 text-xs">{item.sub}</p>
                  </div>
                  {i < 3 && <div className="absolute left-8 w-px h-3 bg-white/20" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-navy mb-3">Lo que dicen nuestros clientes</h2>
            <p className="text-gray-500">Experiencias reales de eventos en Loja</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIOS.map(t => (
              <div key={t.nombre} className="card p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.calificacion }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{t.texto}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                  <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{t.inicial}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{t.nombre}</p>
                    <p className="text-xs text-gray-400">{t.evento}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">¿Listo para planificar tu evento?</h2>
          <p className="text-blue-100 mb-8">
            Encuentra el proveedor perfecto entre los mejores de Loja, Ecuador.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
          >
            Explorar proveedores
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Nueva Sección: ¿Cómo funciona el Planificador IA? */}
      <section className="py-20 px-4 bg-navy text-white border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">¿Cómo funciona el Planificador IA?</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Nuestra tecnología de Inteligencia Artificial arma tu evento ideal en segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Cuéntanos tu evento',
                desc: 'Ingresa el tipo de evento, fecha y presupuesto disponible',
              },
              {
                icon: '🤖',
                title: 'La IA trabaja por ti',
                desc: 'Nuestro motor analiza proveedores verificados y genera el paquete ideal para tu presupuesto',
              },
              {
                icon: '✅',
                title: 'Contrata con seguridad',
                desc: 'Acepta el contrato digital legal en segundos con tu código OTP',
              },
            ].map((tarjeta, index) => (
              <div key={index} className="flex flex-row items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors shadow-sm">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-md">
                  {tarjeta.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-base mb-1">{tarjeta.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{tarjeta.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

