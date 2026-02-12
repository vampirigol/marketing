// Utilidad para obtener la capacidad máxima diaria de doctores desde el catálogo
import { Cita } from '@/types';

export interface DoctorCapacidad {
  doctorId: string;
  capacidadEmpalmes: number;
}

export async function obtenerCapacidadPorDoctor(fecha: Date, citas: Cita[]): Promise<Record<string, number>> {
  // Obtener IDs únicos de doctores para ese día
  const doctorIds = Array.from(new Set(
    citas.map(c => (c as Cita & { doctorId?: string }).doctorId || c.medicoAsignado).filter(Boolean)
  ));
  if (doctorIds.length === 0) return {};

  // Llama a la API de catálogo para todos los doctores (puedes optimizar esto según tu backend)
  // Aquí se asume un endpoint que retorna la capacidad para varios doctores
  const params = new URLSearchParams();
  doctorIds.forEach(id => { if (id) params.append('doctorIds', id); });
  const res = await fetch(`/api/catalogo/capacidad?${params.toString()}`);
  if (!res.ok) return {};
  const data = await res.json();
  // data: { capacidades: [{ doctorId, capacidadEmpalmes }] }
  const capacidades: DoctorCapacidad[] = data.capacidades || [];
  const map: Record<string, number> = {};
  capacidades.forEach(d => { map[d.doctorId] = d.capacidadEmpalmes; });
  return map;
}
