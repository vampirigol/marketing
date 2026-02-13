"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { citasService } from "@/lib/citas.service";
import Link from "next/link";

export default function ConfirmarCitaPage() {
  return (
    <Suspense fallback={<div>Confirmando su cita...</div>}>
      <SearchParamsWrapper>
        {(searchParams) => <ConfirmarCitaPageContent searchParams={searchParams} />}
      </SearchParamsWrapper>
    </Suspense>
  );
}

function SearchParamsWrapper({ children }: { children: (searchParams: ReturnType<typeof useSearchParams>) => JSX.Element }) {
  const searchParams = useSearchParams();
  return children(searchParams);
}


function ConfirmarCitaPageContent({ searchParams }: { searchParams: ReturnType<typeof useSearchParams> }) {
  const token = searchParams.get("token") ?? "";
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      setMensaje("Falta el enlace de confirmación.");
      return;
    }
    citasService
      .confirmarPorToken(token)
      .then((data) => {
        if (data.ok) {
          setEstado("ok");
          setMensaje(data.mensaje ?? "Cita confirmada correctamente.");
        } else {
          setEstado("error");
          setMensaje(data.error ?? "No se pudo confirmar la cita.");
        }
      })
      .catch(() => {
        setEstado("error");
        setMensaje("No se pudo confirmar la cita. Verifique el enlace o intente más tarde.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        {estado === "cargando" && (
          <p className="text-center text-slate-600">Confirmando su cita...</p>
        )}
        {estado === "ok" && (
          <>
            <div className="text-center text-green-600 text-5xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-center text-slate-800 mb-2">
              Cita confirmada
            </h1>
            <p className="text-slate-600 text-center mb-6">{mensaje}</p>
            <Link
              href="/"
              className="block w-full text-center rounded-lg bg-slate-800 text-white py-2.5"
            >
              Volver al inicio
            </Link>
          </>
        )}
        {estado === "error" && (
          <>
            <div className="text-center text-red-500 text-5xl mb-4">✕</div>
            <h1 className="text-xl font-semibold text-center text-slate-800 mb-2">
              No se pudo confirmar
            </h1>
            <p className="text-slate-600 text-center mb-6">{mensaje}</p>
            <Link
              href="/"
              className="block w-full text-center rounded-lg bg-slate-800 text-white py-2.5"
            >
              Volver al inicio
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
