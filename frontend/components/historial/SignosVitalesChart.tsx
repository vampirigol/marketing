"use client";

interface SignosVitales {
  id: string;
  fechaRegistro: string;
  temperatura?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  saturacionOxigeno?: number;
  peso?: number;
  glucosa?: number;
}

interface Props {
  signos: SignosVitales[];
}

export default function SignosVitalesChart({ signos }: Props) {
  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
  };

  const calcularRangoValor = (valores: number[]) => {
    if (valores.length === 0) return { min: 0, max: 100 };
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const margen = (max - min) * 0.2;
    return {
      min: Math.floor(min - margen),
      max: Math.ceil(max + margen),
    };
  };

  const pesoData = signos
    .filter((s) => s.peso)
    .reverse()
    .slice(0, 10);
  const temperatureData = signos
    .filter((s) => s.temperatura)
    .reverse()
    .slice(0, 10);
  const presionData = signos
    .filter((s) => s.presionSistolica)
    .reverse()
    .slice(0, 10);

  const pesoValores = pesoData.map((s) => s.peso!);
  const tempValores = temperatureData.map((s) => s.temperatura!);
  const presionSistValores = presionData.map((s) => s.presionSistolica!);

  const pesoRango = calcularRangoValor(pesoValores);
  const tempRango = { min: 35, max: 40 };
  const presionRango = { min: 80, max: 160 };

  const calcularPosicionY = (valor: number, min: number, max: number, alto: number) => {
    const ratio = (valor - min) / (max - min);
    return alto - ratio * alto;
  };

  return (
    <div className="space-y-6">
      {/* Peso */}
      {pesoData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Evolución del Peso (kg)</h4>
          <div className="relative h-32">
            <svg width="100%" height="100%" className="overflow-visible">
              {/* Línea de tendencia */}
              <polyline
                points={pesoData
                  .map((s, i) => {
                    const x = (i / (pesoData.length - 1)) * 100;
                    const y = calcularPosicionY(s.peso!, pesoRango.min, pesoRango.max, 100);
                    return `${x}%,${y}%`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Puntos */}
              {pesoData.map((s, i) => {
                const x = (i / (pesoData.length - 1)) * 100;
                const y = calcularPosicionY(s.peso!, pesoRango.min, pesoRango.max, 100);
                return (
                  <g key={s.id}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill="#8b5cf6"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            {pesoData.map((s) => (
              <span key={s.id}>{formatearFecha(s.fechaRegistro)}</span>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-xl font-bold text-purple-600">
              {pesoData[pesoData.length - 1]?.peso} kg
            </span>
            <span className="ml-2 text-xs text-slate-500">(último registro)</span>
          </div>
        </div>
      )}

      {/* Temperatura */}
      {temperatureData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Temperatura Corporal (°C)
          </h4>
          <div className="flex items-end gap-2">
            {temperatureData.map((s) => {
              const altura = ((s.temperatura! - tempRango.min) / (tempRango.max - tempRango.min)) * 100;
              const esNormal = s.temperatura! >= 36 && s.temperatura! <= 37.5;
              return (
                <div key={s.id} className="flex-1">
                  <div className="flex h-24 items-end">
                    <div
                      className={`w-full rounded-t-lg ${
                        esNormal ? "bg-emerald-400" : "bg-red-400"
                      }`}
                      style={{ height: `${Math.max(altura, 10)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-[10px] text-slate-500">
                    {s.temperatura}°
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Presión Arterial */}
      {presionData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Presión Arterial (mmHg)
          </h4>
          <div className="space-y-2">
            {presionData.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-16 text-xs text-slate-500">
                  {formatearFecha(s.fechaRegistro)}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{
                        width: `${(s.presionSistolica! / presionRango.max) * 100}%`,
                      }}
                    />
                    <span className="text-xs font-semibold text-blue-700">
                      {s.presionSistolica}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                      style={{
                        width: `${(s.presionDiastolica! / presionRango.max) * 100}%`,
                      }}
                    />
                    <span className="text-xs font-semibold text-cyan-700">
                      {s.presionDiastolica}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
