import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-slate-200">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-800">
          Página no encontrada
        </h2>
        <p className="mt-2 text-slate-600">
          La ruta que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
