"use client";

interface Consulta {
  id: string;
  fechaConsulta: string;
  tipoConsulta: string;
  especialidad: string;
  motivoConsulta: string;
  diagnosticos: Array<{ nombre: string }>;
}

interface Props {
  consultas: Consulta[];
  onVerDetalle: (consulta: Consulta) => void;
}

export default function TimelineConsultas({ consultas, onVerDetalle }: Props) {
  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative space-y-6">
      {/* Línea vertical del timeline */}
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-slate-200" />

      {consultas.map((consulta, index) => (
        <div key={consulta.id} className="relative flex gap-4">
          {/* Punto del timeline */}
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center">
            <div
              className={`h-10 w-10 rounded-full border-4 border-white shadow-md ${
                index === 0
                  ? "bg-gradient-to-br from-blue-500 to-blue-600"
                  : index === 1
                  ? "bg-gradient-to-br from-purple-500 to-purple-600"
                  : "bg-gradient-to-br from-slate-400 to-slate-500"
              }`}
            >
              <span className="text-xs text-white">
                {index === 0 ? "🩺" : "📋"}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 pb-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        consulta.tipoConsulta === "Primera_Vez"
                          ? "bg-emerald-100 text-emerald-700"
                          : consulta.tipoConsulta === "Urgencia"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {consulta.tipoConsulta.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatearFecha(consulta.fechaConsulta)}
                    </span>
                  </div>

                  <h4 className="mt-2 font-semibold text-slate-900">
                    {consulta.especialidad}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {consulta.motivoConsulta.length > 100
                      ? consulta.motivoConsulta.substring(0, 100) + "..."
                      : consulta.motivoConsulta}
                  </p>

                  {consulta.diagnosticos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {consulta.diagnosticos.slice(0, 2).map((dx, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800"
                        >
                          {dx.nombre}
                        </span>
                      ))}
                      {consulta.diagnosticos.length > 2 && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          +{consulta.diagnosticos.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onVerDetalle(consulta)}
                  className="ml-4 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Ver detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {consultas.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">Sin consultas previas registradas</p>
        </div>
      )}
    </div>
  );
}
