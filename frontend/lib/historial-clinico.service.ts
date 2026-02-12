const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface ConsultaMedica {
  id: string;
  citaId?: string;
  pacienteId: string;
  doctorId: string;
  fechaConsulta: string;
  tipoConsulta: string;
  especialidad: string;
  motivoConsulta: string;
  signosVitales?: any;
  exploracionFisica?: string;
  diagnosticos: Array<{ nombre: string; tipo: string }>;
  planTratamiento?: string;
  indicaciones?: string;
  notasEvolucion?: string;
  firmado: boolean;
}

export interface SignosVitales {
  id: string;
  pacienteId: string;
  fechaRegistro: string;
  temperatura?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  saturacionOxigeno?: number;
  peso?: number;
  talla?: number;
  glucosa?: number;
}

export interface AntecedenteMedico {
  id: string;
  pacienteId: string;
  tipoAntecedente: string;
  descripcion: string;
  estaActivo: boolean;
  fechaDiagnostico?: string;
}

export interface MedicamentoActual {
  id: string;
  pacienteId: string;
  nombreMedicamento: string;
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  esCronico: boolean;
}

export const historialClinicoService = {
  async obtenerHistorialCompleto(pacienteId: string, token: string) {
    const resp = await fetch(
      `${API_URL}/historial-clinico/paciente/${pacienteId}/completo`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!resp.ok) throw new Error("Error al cargar historial");
    return await resp.json();
  },

  async crearConsulta(consulta: any, token: string) {
    const resp = await fetch(`${API_URL}/historial-clinico/consultas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(consulta),
    });
    if (!resp.ok) throw new Error("Error al crear consulta");
    return await resp.json();
  },

  async registrarSignosVitales(signos: any, token: string) {
    const resp = await fetch(`${API_URL}/historial-clinico/signos-vitales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(signos),
    });
    if (!resp.ok) throw new Error("Error al registrar signos vitales");
    return await resp.json();
  },

  async agregarAntecedente(antecedente: any, token: string) {
    const resp = await fetch(`${API_URL}/historial-clinico/antecedentes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(antecedente),
    });
    if (!resp.ok) throw new Error("Error al agregar antecedente");
    return await resp.json();
  },

  async agregarMedicamento(medicamento: any, token: string) {
    const resp = await fetch(`${API_URL}/historial-clinico/medicamentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(medicamento),
    });
    if (!resp.ok) throw new Error("Error al agregar medicamento");
    return await resp.json();
  },
};
