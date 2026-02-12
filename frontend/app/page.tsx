import Image from 'next/image';
import Link from 'next/link';

const modules = [
  {
    href: '/dashboard',
    title: 'Dashboard',
    description: 'Vista general del sistema',
    icon: '📊',
    tint: 'border-blue-200/70 bg-blue-50/60',
    gradient: 'from-blue-500 to-sky-500',
  },
  {
    href: '/pacientes',
    title: 'Pacientes',
    description: 'Gestión de pacientes',
    icon: '👥',
    tint: 'border-indigo-200/70 bg-indigo-50/60',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    href: '/citas',
    title: 'Citas',
    description: 'Calendario de citas',
    icon: '📅',
    tint: 'border-purple-200/70 bg-purple-50/60',
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  {
    href: '/matrix',
    title: 'Keila IA',
    description: 'Contact Center',
    icon: '💬',
    tint: 'border-emerald-200/70 bg-emerald-50/60',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    href: '/finanzas',
    title: 'Finanzas',
    description: 'Abonos y cortes de caja',
    icon: '💰',
    tint: 'border-orange-200/70 bg-orange-50/60',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    href: '/reportes',
    title: 'Reportes',
    description: 'Análisis y estadísticas',
    icon: '📈',
    tint: 'border-pink-200/70 bg-pink-50/60',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    href: '/doctores',
    title: 'Doctores',
    description: 'Acceso a la versión móvil web',
    icon: '🩺',
    tint: 'border-cyan-200/70 bg-cyan-50/60',
    gradient: 'from-cyan-500 to-sky-500',
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 rounded-full bg-purple-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur">
          Sistema CRM
        </div>

        <div className="mt-8 flex flex-col items-center gap-6 lg:flex-row lg:gap-10">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-slate-200/70 bg-white/90 p-3 shadow-xl backdrop-blur md:h-32 md:w-32">
            <Image
              src="/logo-clinicas.png"
              alt="Clínicas Adventistas"
              className="h-full w-full object-contain"
              width={128}
              height={128}
              priority
            />
          </div>
          <div className="space-y-4 text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Red de Clínicas Adventistas
            </p>
            <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl lg:text-6xl">
              Plataforma integral para la gestión clínica
            </h1>
            <p className="max-w-2xl text-base text-slate-600 md:text-lg">
              Gestión integral de pacientes, citas y finanzas para la red de clínicas médicas con una
              experiencia moderna y segura.
            </p>
          </div>
        </div>

        <div className="mt-12 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.href} href={module.href} className="group h-full">
              <div
                className={`flex h-full flex-col justify-between rounded-2xl border ${module.tint} p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:bg-white/90 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${module.gradient} text-2xl text-white shadow-md transition duration-300 group-hover:scale-105`}
                  >
                    <span aria-hidden="true">{module.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Módulo</span>
                </div>
                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">{module.title}</h3>
                  <p className="text-sm text-slate-600">{module.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-14 flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          API Backend en http://localhost:3000
        </div>
      </div>
    </div>
  );
}
