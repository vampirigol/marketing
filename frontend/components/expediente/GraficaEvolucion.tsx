"use client";

interface SignosVitales {
  id: string;
  fechaRegistro: string;
  peso?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  glucosa?: number;
  temperatura?: number;
}

interface Props {
  signos: SignosVitales[];
  tipo: "peso" | "presion" | "glucosa" | "temperatura";
}

export default function GraficaEvolucion({ signos, tipo }: Props) {
  const getData = () => {
    switch (tipo) {
      case "peso":
        return signos.filter((s) => s.peso).reverse().slice(0, 10);
      case "presion":
        return signos.filter((s) => s.presionSistolica).reverse().slice(0, 10);
      case "glucosa":
        return signos.filter((s) => s.glucosa).reverse().slice(0, 10);
      case "temperatura":
        return signos.filter((s) => s.temperatura).reverse().slice(0, 10);
      default:
        return [];
    }
  };

  const data = getData();
  if (data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
        Sin datos de {tipo}
      </div>
    );
  }

  const getValor = (s: SignosVitales) => {
    switch (tipo) {
      case "peso":
        return s.peso!;
      case "presion":
        return s.presionSistolica!;
      case "glucosa":
        return s.glucosa!;
      case "temperatura":
        return s.temperatura!;
      default:
        return 0;
    }
  };

  const valores = data.map(getValor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;

  const getColor = () => {
    switch (tipo) {
      case "peso":
        return "#8b5cf6";
      case "presion":
        return "#3b82f6";
      case "glucosa":
        return "#f59e0b";
      case "temperatura":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h4 className="mb-4 text-sm font-semibold text-slate-700 capitalize">
        {tipo === "presion" ? "Presión Arterial" : tipo}
      </h4>
      <div className="relative h-48">
        <svg width="100%" height="100%" className="overflow-visible">
          {data.map((s, i) => {
            const x = (i / (data.length - 1)) * 100;
            const valor = getValor(s);
            const y = 100 - ((valor - min) / rango) * 80;

            return (
              <g key={s.id}>
                {i > 0 && (
                  <line
                    x1={`${((i - 1) / (data.length - 1)) * 100}%`}
                    y1={`${100 - ((getValor(data[i - 1]) - min) / rango) * 80}%`}
                    x2={`${x}%`}
                    y2={`${y}%`}
                    stroke={getColor()}
                    strokeWidth="3"
                  />
                )}
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="6"
                  fill={getColor()}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={`${x}%`}
                  y={`${y - 10}%`}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                >
                  {valor}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-4 flex justify-between text-xs text-slate-500">
        {data.map((s) => (
          <span key={s.id}>{formatearFecha(s.fechaRegistro)}</span>
        ))}
      </div>
      <div className="mt-3 text-center">
        <span className="text-2xl font-bold" style={{ color: getColor() }}>
          {getValor(data[data.length - 1])}
        </span>
        <span className="ml-2 text-xs text-slate-500">(último registro)</span>
      </div>
    </div>
  );
}
