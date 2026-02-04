import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center space-y-8 max-w-6xl px-4">
        {/* Logo y Título */}
        <div className="space-y-6 animate-fade-in">
          <div className="w-28 h-28 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
            <span className="text-6xl">🏥</span>
          </div>
          <h1 className="text-6xl font-display font-bold bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sistema CRM
          </h1>
          <p className="text-3xl text-gray-700 font-semibold">
            Red de Clínicas Adventistas
          </p>
        </div>

        {/* Descripción */}
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Gestión integral de pacientes, citas y finanzas para la red de clínicas médicas
        </p>

        {/* Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <Link href="/dashboard" className="group">
            <div className="card-hover bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Dashboard</h3>
                <p className="text-sm text-gray-600 text-center">
                  Vista general del sistema
                </p>
              </div>
            </div>
          </Link>

          <Link href="/pacientes" className="group">
            <div className="card-hover bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Pacientes</h3>
                <p className="text-sm text-gray-600 text-center">
                  Gestión de pacientes
                </p>
              </div>
            </div>
          </Link>

          <Link href="/citas" className="group">
            <div className="card-hover bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">📅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Citas</h3>
                <p className="text-sm text-gray-600 text-center">
                  Calendario de citas
                </p>
              </div>
            </div>
          </Link>

          <Link href="/matrix" className="group">
            <div className="card-hover bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Keila IA</h3>
                <p className="text-sm text-gray-600 text-center">
                  Contact Center
                </p>
              </div>
            </div>
          </Link>

          <Link href="/finanzas" className="group">
            <div className="card-hover bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">💰</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Finanzas</h3>
                <p className="text-sm text-gray-600 text-center">
                  Abonos y cortes de caja
                </p>
              </div>
            </div>
          </Link>

          <Link href="/reportes" className="group">
            <div className="card-hover bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">📈</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Reportes</h3>
                <p className="text-sm text-gray-600 text-center">
                  Análisis y estadísticas
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Estado del API */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <span className="font-medium">API Backend en http://localhost:3000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
