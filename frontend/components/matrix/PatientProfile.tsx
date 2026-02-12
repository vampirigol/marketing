'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock,
  FileText,
  Plus,
  Edit,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Paciente } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AgendarCitaModal } from './AgendarCitaModal';
import { HistorialPacienteModal } from './HistorialPacienteModal';
import { RegistrarPagoModal } from './RegistrarPagoModal';
import { pacientesService } from '@/lib/pacientes.service';
import { citasService } from '@/lib/citas.service';

interface PatientProfileProps {
  pacienteId?: string;
}

interface CitaHistorial {
  id: string;
  fecha: Date;
  tipo: string;
  doctor: string;
  estado: string;
  esPromocion: boolean;
}

export function PatientProfile({ 
  pacienteId
}: PatientProfileProps) {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historialCitas, setHistorialCitas] = useState<CitaHistorial[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorPaciente, setErrorPaciente] = useState<string | null>(null);
  const [notas, setNotas] = useState<string[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  
  const [modalAgendarCita, setModalAgendarCita] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [modalRegistrarPago, setModalRegistrarPago] = useState(false);

  useEffect(() => {
    if (!pacienteId) {
      setPaciente(null);
      setHistorialCitas([]);
      setErrorPaciente(null);
      return;
    }
    const cargar = async () => {
      setCargando(true);
      setErrorPaciente(null);
      try {
        const [pac, citas] = await Promise.all([
          pacientesService.obtenerPorId(pacienteId).catch(() => null),
          citasService.obtenerPorPaciente(pacienteId).catch(() => []),
        ]);
        setPaciente(pac ?? null);
        const citasMapped: CitaHistorial[] = (citas || []).map((c: any) => ({
          id: c.id,
          fecha: new Date(c.fechaCita || c.fecha),
          tipo: c.especialidad || c.tipoConsulta || 'Consulta',
          doctor: c.medicoAsignado || 'Doctor',
          estado: c.estado || 'Agendada',
          esPromocion: Boolean(c.esPromocion),
        }));
        setHistorialCitas(citasMapped);
      } catch {
        setErrorPaciente('No se pudo cargar el perfil');
        setPaciente(null);
        setHistorialCitas([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [pacienteId]);

  // Escuchar cita agendada para refrescar historial
  useEffect(() => {
    if (!pacienteId) return;
    const handler = () => {
      citasService.obtenerPorPaciente(pacienteId).then((citas: any[]) => {
        const mapped: CitaHistorial[] = (citas || []).map((c: any) => ({
          id: c.id,
          fecha: new Date(c.fechaCita || c.fecha),
          tipo: c.especialidad || c.tipoConsulta || 'Consulta',
          doctor: c.medicoAsignado || 'Doctor',
          estado: c.estado || 'Agendada',
          esPromocion: Boolean(c.esPromocion),
        }));
        setHistorialCitas(mapped);
      }).catch(() => null);
    };
    window.addEventListener('citaAgendada', handler);
    return () => window.removeEventListener('citaAgendada', handler);
  }, [pacienteId]);

  const segmentoPaciente =
    historialCitas.length === 0
      ? 'Nunca atendido'
      : historialCitas.length === 1
      ? 'Atendido 1 vez'
      : 'Múltiples asistencias';

  const timelineContacto = pacienteId ? [
    {
      id: 't1',
      titulo: 'Confirmación T-24h',
      canal: 'WhatsApp',
      fecha: new Date(Date.now() - 26 * 60 * 60 * 1000),
      estado: 'Enviado',
    },
    {
      id: 't2',
      titulo: 'Recordatorio T-3h',
      canal: 'SMS',
      fecha: new Date(Date.now() - 4 * 60 * 60 * 1000),
      estado: 'Entregado',
    },
    {
      id: 't3',
      titulo: 'Check-in recepción',
      canal: 'Recepción',
      fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
      estado: 'Confirmado',
    },
  ] : [];

  const motivoInasistencia = pacienteId ? 'Trabajo' : null;

  // const calcularEdad = (fecha: Date) => {
  //   const hoy = new Date();
  //   let edad = hoy.getFullYear() - fecha.getFullYear();
  //   const mes = hoy.getMonth() - fecha.getMonth();
  //   if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
  //     edad--;
  //   }
  //   return edad;
  // };

  const agregarNota = () => {
    if (nuevaNota.trim()) {
      setNotas([...notas, nuevaNota]);
      setNuevaNota('');
    }
  };

  if (!pacienteId) {
    return (
      <div className="w-[360px] border-l border-gray-200 bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Selecciona una conversación<br />
            para ver el perfil del paciente
          </p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="w-[360px] border-l border-gray-200 bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="w-[360px] border-l border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{errorPaciente || 'Paciente no registrado'}</p>
        </div>
        <Button
          onClick={() => setModalAgendarCita(true)}
          className="w-full mt-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agendar Cita (crear paciente)
        </Button>
        <AgendarCitaModal
          isOpen={modalAgendarCita}
          onClose={() => setModalAgendarCita(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-[360px] border-l border-gray-200 bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">
            Perfil del Paciente
          </h3>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
            {paciente.nombreCompleto.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {paciente.nombreCompleto}
            </h2>
            <p className="text-sm text-gray-600">
              {paciente.edad} años • {paciente.sexo === 'F' ? 'Femenino' : 'Masculino'}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{paciente.telefono}</span>
          </div>
          {paciente.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{paciente.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="w-4 h-4" />
            <span className="font-mono text-xs">{paciente.noAfiliacion}</span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
          ⚡ Acciones Rápidas
        </p>
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={() => setModalAgendarCita(true)}
            className="w-full justify-start"
            size="sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Cita
          </Button>
          <Button
            onClick={() => setModalHistorial(true)}
            variant="secondary"
            className="w-full justify-start"
            size="sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Ver Historial Completo
          </Button>
          <Button
            onClick={() => setModalRegistrarPago(true)}
            variant="secondary"
            className="w-full justify-start"
            size="sm"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
        </div>
      </div>

      {/* Segmento y preferencias */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            Segmento
          </p>
          <Badge variant="outline" className="text-xs">
            {segmentoPaciente}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="bg-blue-100 text-blue-700">
            Preferencia: WhatsApp
          </Badge>
          <Badge variant="default" className="bg-emerald-100 text-emerald-700">
            Consentimiento OK
          </Badge>
        </div>
      </div>

      {/* Historial de Citas */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            📊 Historial de Citas
          </p>
          <Badge variant="outline" className="text-xs">
            {historialCitas.length} citas
          </Badge>
        </div>
        
        <div className="space-y-3">
          {historialCitas.slice(0, 3).map((cita) => (
            <div key={cita.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {cita.tipo}
                  </p>
                  <p className="text-xs text-gray-600">
                    {cita.doctor}
                  </p>
                </div>
                {cita.esPromocion && (
                  <Badge variant="default" className="bg-purple-100 text-purple-700 text-xs">
                    🎁 Promo
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {new Date(cita.fecha).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <Badge variant="outline" className="text-xs">
                  {cita.estado}
                </Badge>
              </div>
            </div>
          ))}
          
          {historialCitas.length > 3 && (
            <button
              onClick={() => setModalHistorial(true)}
              className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              Ver todas ({historialCitas.length} citas) →
            </button>
          )}
        </div>
      </div>

      {/* Timeline de contacto */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            🧭 Timeline de contacto
          </p>
        </div>
        <div className="space-y-3">
          {timelineContacto.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.titulo}</p>
                <p className="text-xs text-gray-500">
                  {item.canal} · {item.fecha.toLocaleString('es-MX')}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {item.estado}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Etiquetas */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            🎯 Etiquetas
          </p>
          <Button variant="ghost" size="sm">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="bg-purple-100 text-purple-700">
            🎁 Promoción
          </Badge>
          <Badge variant="default" className="bg-green-100 text-green-700">
            ✅ Recurrente
          </Badge>
          <Badge variant="default" className="bg-blue-100 text-blue-700">
            ⭐ VIP
          </Badge>
        </div>
      </div>

      {/* Información Médica */}
      {(paciente.alergias || paciente.padecimientos) && (
        <div className="p-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
            🏥 Información Médica
          </p>
          
          {paciente.alergias && paciente.alergias.trim() && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Alergias:</p>
              <div className="flex flex-wrap gap-1">
                {paciente.alergias.split(',').map((alergia, idx) => (
                  <Badge key={idx} variant="default" className="bg-red-100 text-red-700 text-xs">
                    ⚠️ {alergia.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {paciente.padecimientos && paciente.padecimientos.trim() && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Padecimientos:</p>
              <div className="flex flex-wrap gap-1">
                {paciente.padecimientos.split(',').map((padecimiento, idx) => (
                  <Badge key={idx} variant="default" className="bg-orange-100 text-orange-700 text-xs">
                    {padecimiento.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notas */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            📌 Notas
          </p>
        </div>
        
        <div className="space-y-2 mb-3">
          {notas.map((nota, idx) => (
            <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-sm text-gray-700">{nota}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date().toLocaleDateString('es-MX')}
              </p>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && agregarNota()}
            placeholder="Agregar nota..."
            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={agregarNota}
            size="sm"
            disabled={!nuevaNota.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Motivo de inasistencia */}
      {motivoInasistencia && (
        <div className="p-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
            Motivo de inasistencia
          </p>
          <Badge variant="default" className="bg-rose-100 text-rose-700">
            {motivoInasistencia}
          </Badge>
        </div>
      )}

      {/* Modales */}
      <AgendarCitaModal
        isOpen={modalAgendarCita}
        onClose={() => setModalAgendarCita(false)}
        pacienteId={paciente.id}
        pacienteNombre={paciente.nombreCompleto}
      />

      <HistorialPacienteModal
        isOpen={modalHistorial}
        onClose={() => setModalHistorial(false)}
        pacienteId={pacienteId}
        pacienteNombre={paciente.nombreCompleto}
      />

      <RegistrarPagoModal
        isOpen={modalRegistrarPago}
        onClose={() => setModalRegistrarPago(false)}
        pacienteId={pacienteId}
        pacienteNombre={paciente.nombreCompleto}
      />
    </div>
  );
}
