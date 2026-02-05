"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportesOcupacion } from "@/components/citas/ReportesOcupacion";
import { Cita } from "@/types";
import { Calendar, TrendingUp, Activity, AlertCircle } from "lucide-react";

const ESTADOS_DEMO: Cita["estado"][] = [
  "Agendada",
  "Pendiente_Confirmacion",
  "Confirmada",
  "Reagendada",
  "Llegó",
  "En_Atencion",
  "En_Espera",
  "Finalizada",
  "Cancelada",
  "Inasistencia",
  "Perdido",
];

function generarCitasDemo(): Cita[] {
  const citas: Cita[] = [];
  const hoy = new Date();
  const nombres = [
    "María González",
    "Pedro López",
    "Ana Martínez",
    "Carlos Rodríguez",
    "Laura Fernández",
    "Juan Sánchez",
    "Sofia Torres",
    "Diego Ramírez",
    "Valentina Pérez",
    "Mateo García",
  ];
  const medicos = ["Dr. López", "Dra. Ramírez", "Dr. González", "Dra. Torres"];
  const sucursales = [
    { id: "suc-1", nombre: "Guadalajara" },
    { id: "suc-2", nombre: "Ciudad Juárez" },
    { id: "suc-3", nombre: "Ciudad Obregón" },
  ];

  for (let dia = 0; dia < 30; dia += 1) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - dia);
    const citasDia = Math.floor(Math.random() * 6) + 6;

    for (let i = 0; i < citasDia; i += 1) {
      const hora = Math.floor(Math.random() * 11) + 8;
      const minuto = Math.random() > 0.5 ? 0 : 30;
      const horaCita = `${hora.toString().padStart(2, "0")}:${minuto
        .toString()
        .padStart(2, "0")}`;
      const sucursal = sucursales[Math.floor(Math.random() * sucursales.length)];
      const esPromocion = Math.random() > 0.7;
      const costoConsulta = esPromocion ? 250 : 500;
      const estado = ESTADOS_DEMO[Math.floor(Math.random() * ESTADOS_DEMO.length)];
      const montoAbonado =
        estado === "Finalizada" ? costoConsulta : Math.floor(costoConsulta / 2);

      citas.push({
        id: `rep-${dia}-${i}`,
        pacienteId: `pac-${Math.floor(Math.random() * 900 + 100)}`,
        pacienteNombre: nombres[Math.floor(Math.random() * nombres.length)],
        pacienteTelefono: `555-${Math.floor(Math.random() * 9000 + 1000)}`,
        pacienteEmail: "paciente@email.com",
        pacienteNoAfiliacion: `RCA-2024-${String(
          Math.floor(Math.random() * 9000 + 1000)
        ).padStart(4, "0")}`,
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        fechaCita: fecha,
        horaCita,
        duracionMinutos: 30,
        tipoConsulta: "Consulta General",
        especialidad: "Medicina General",
        medicoAsignado: medicos[Math.floor(Math.random() * medicos.length)],
        estado,
        esPromocion,
        reagendaciones: Math.random() > 0.85 ? 1 : 0,
        costoConsulta,
        montoAbonado,
        saldoPendiente: costoConsulta - montoAbonado,
        fechaCreacion: new Date(),
        ultimaActualizacion: new Date(),
      });
    }
  }

  return citas;
}

export default function ReportesPage() {
  const router = useRouter();
  const [citasDemo, setCitasDemo] = useState<Cita[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setCitasDemo(generarCitasDemo());
    setIsHydrated(true);
  }, []);

  const resumen = useMemo(() => {
    const total = citasDemo.length;
    const confirmadas = citasDemo.filter((c) => c.estado === "Confirmada").length;
    const finalizadas = citasDemo.filter((c) => c.estado === "Finalizada").length;
    const inasistencias = citasDemo.filter(
      (c) => c.estado === "Inasistencia" || c.estado === "No_Asistio"
    ).length;
    const ingresos = citasDemo.reduce((acc, c) => acc + (c.montoAbonado || 0), 0);

    return {
      total,
      confirmadas,
      showRate: confirmadas > 0 ? (finalizadas / confirmadas) * 100 : 0,
      noShowRate: confirmadas > 0 ? (inasistencias / confirmadas) * 100 : 0,
      ingresos,
    };
  }, [citasDemo]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📈 Reportes</h1>
            <p className="text-gray-500 mt-1">
              Indicadores clave y desempeño operativo (demo)
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Modo Demo:</strong> métricas generadas con datos simulados
            para 30 días.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{resumen.total}</span>
            </div>
            <p className="text-sm text-gray-500">Total Citas</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-6 h-6 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{resumen.confirmadas}</span>
            </div>
            <p className="text-sm text-gray-500">Confirmadas</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-sky-600" />
              <span className="text-2xl font-bold text-gray-900">
                {resumen.showRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-gray-500">Show Rate</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              <span className="text-2xl font-bold text-gray-900">
                {resumen.noShowRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-gray-500">No-show</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-900">
                ${resumen.ingresos.toLocaleString("es-MX")}
              </span>
            </div>
            <p className="text-sm text-gray-500">Ingresos</p>
          </div>
        </div>

        {isHydrated && (
          <ReportesOcupacion
            citas={citasDemo}
            onClose={() => router.back()}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
