import { Request, Response } from 'express';
import { SucursalRepositoryPostgres } from '../../infrastructure/database/repositories/SucursalRepository';

interface CatalogoSucursal {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  direccion: string;
  telefono: string;
  email?: string;
  zonaHoraria: string;
  activo: boolean;
}

interface CatalogoEspecialidad {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface CatalogoDoctor {
  id: string;
  nombre: string;
  especialidadId: string;
  sucursalId: string;
  horario: {
    inicio: string; // HH:mm
    fin: string; // HH:mm
    intervaloMin: number;
  };
  capacidadEmpalmes: number;
  activo: boolean;
}

interface CatalogoServicio {
  id: string;
  nombre: string;
  especialidadId: string;
  doctorId?: string;
  precioBase: number;
  duracionMinutos: number;
  promocionActiva?: boolean;
  codigoPromocion?: string;
  precioPromocion?: number;
}

interface CatalogoPromocion {
  id: string;
  codigo: string;
  nombre: string;
  descuentoPorcentaje?: number;
  montoFinal?: number;
  especialidadId?: string;
  doctorId?: string;
  vigenciaInicio: string; // YYYY-MM-DD
  vigenciaFin: string; // YYYY-MM-DD
  aplicaPrimeraVez?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Fallback para cuando no hay DB
const sucursalesFallback: CatalogoSucursal[] = [
  {
    id: 'suc-1',
    nombre: 'Valle de la Trinidad',
    ciudad: 'Aguascalientes',
    estado: 'Aguascalientes',
    direccion: 'Valle de la Trinidad',
    telefono: '+52 449 000 0001',
    email: 'valletrinidad@rca.com',
    zonaHoraria: 'America/Mexico_City',
    activo: true,
  },
  {
    id: 'suc-2',
    nombre: 'Guadalajara',
    ciudad: 'Guadalajara',
    estado: 'Jalisco',
    direccion: 'Guadalajara Centro',
    telefono: '+52 33 2000 0002',
    email: 'gdl@rca.com',
    zonaHoraria: 'America/Mexico_City',
    activo: true,
  },
  {
    id: 'suc-3',
    nombre: 'Ciudad Obregón',
    ciudad: 'Ciudad Obregón',
    estado: 'Sonora',
    direccion: 'Ciudad Obregón Centro',
    telefono: '+52 644 000 0003',
    email: 'obregon@rca.com',
    zonaHoraria: 'America/Hermosillo',
    activo: true,
  },
  {
    id: 'suc-4',
    nombre: 'Ciudad Juárez',
    ciudad: 'Ciudad Juárez',
    estado: 'Chihuahua',
    direccion: 'Ciudad Juárez Centro',
    telefono: '+52 656 000 0004',
    email: 'juarez@rca.com',
    zonaHoraria: 'America/Chihuahua',
    activo: true,
  },
  {
    id: 'suc-5',
    nombre: 'Loreto Héroes',
    ciudad: 'Aguascalientes',
    estado: 'Aguascalientes',
    direccion: 'Loreto Héroes',
    telefono: '+52 449 000 0005',
    email: 'loretoh@rca.com',
    zonaHoraria: 'America/Mexico_City',
    activo: true,
  },
  {
    id: 'suc-6',
    nombre: 'Loreto Centro',
    ciudad: 'Aguascalientes',
    estado: 'Aguascalientes',
    direccion: 'Loreto Centro',
    telefono: '+52 449 000 0006',
    email: 'loretoc@rca.com',
    zonaHoraria: 'America/Mexico_City',
    activo: true,
  },
  {
    id: 'suc-7',
    nombre: 'Clínica Adventista Virtual',
    ciudad: 'Virtual',
    estado: 'Nacional',
    direccion: 'Servicio en Línea',
    telefono: '+52 800 000 0007',
    email: 'virtual@rca.com',
    zonaHoraria: 'America/Mexico_City',
    activo: true,
  },
  {
    id: 'suc-8',
    nombre: 'Valle de la Trinidad',
    ciudad: 'Valle de la Trinidad',
    estado: 'Baja California',
    direccion: 'Valle de la Trinidad Centro',
    telefono: '+52 646 300 0008',
    email: 'valle@rca.com',
    zonaHoraria: 'America/Mexico_City',
    activo: true,
  },
];

const especialidades: CatalogoEspecialidad[] = [
  { id: 'esp-1', nombre: 'Medicina Integral', descripcion: 'Consulta integral y diagnóstico' },
  { id: 'esp-2', nombre: 'Medicina Integral en Línea', descripcion: 'Consulta integral virtual' },
  { id: 'esp-3', nombre: 'Odontología', descripcion: 'Limpieza, resinas, implantes' },
  { id: 'esp-4', nombre: 'Oftalmología', descripcion: 'Salud visual y diagnóstico' },
  { id: 'esp-5', nombre: 'Fisioterapia', descripcion: 'Rehabilitación y terapia física' },
  { id: 'esp-6', nombre: 'Psicología', descripcion: 'Salud mental y bienestar emocional' },
  { id: 'esp-7', nombre: 'Psicología en Línea', descripcion: 'Terapia psicológica virtual' },
  { id: 'esp-8', nombre: 'Nutrición', descripcion: 'Planes alimenticios y asesoría nutricional' },
  { id: 'esp-9', nombre: 'Nutrición en Línea', descripcion: 'Asesoría nutricional virtual' },
  { id: 'esp-10', nombre: 'Laboratorio Clínico', descripcion: 'Análisis clínicos y estudios' },
  { id: 'esp-11', nombre: 'Laboratorio Dental', descripcion: 'Prótesis y trabajos dentales' },
  { id: 'esp-12', nombre: 'Óptica', descripcion: 'Lentes y accesorios visuales' },
  { id: 'esp-13', nombre: 'Consejería Pastoral', descripcion: 'Acompañamiento y orientación' },
];

const doctores: CatalogoDoctor[] = [
  // Ciudad Obregón
  { id: 'doc-1', nombre: 'Aslysh Aboyte', especialidadId: 'esp-3', sucursalId: 'suc-3', horario: { inicio: '09:00', fin: '18:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-2', nombre: 'Daniel Balderas', especialidadId: 'esp-3', sucursalId: 'suc-3', horario: { inicio: '10:00', fin: '19:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-3', nombre: 'Adriana Moreno', especialidadId: 'esp-3', sucursalId: 'suc-3', horario: { inicio: '08:30', fin: '17:30', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-4', nombre: 'Fernanda Mendoza', especialidadId: 'esp-3', sucursalId: 'suc-3', horario: { inicio: '09:30', fin: '18:30', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-5', nombre: 'Rubén Mexía', especialidadId: 'esp-3', sucursalId: 'suc-3', horario: { inicio: '11:00', fin: '19:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-6', nombre: 'Miguel Ahumada', especialidadId: 'esp-3', sucursalId: 'suc-3', horario: { inicio: '08:00', fin: '16:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-7', nombre: 'Eliasib Pérez', especialidadId: 'esp-3', sucursalId: 'suc-3', horario: { inicio: '10:30', fin: '18:30', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-8', nombre: 'Alejandro Vargas', especialidadId: 'esp-4', sucursalId: 'suc-3', horario: { inicio: '08:00', fin: '16:30', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-9', nombre: 'Alexis Colleti', especialidadId: 'esp-4', sucursalId: 'suc-3', horario: { inicio: '09:00', fin: '17:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-10', nombre: 'Stephania Vélez', especialidadId: 'esp-8', sucursalId: 'suc-3', horario: { inicio: '09:00', fin: '17:00', intervaloMin: 45 }, capacidadEmpalmes: 2, activo: true },

  // Ciudad Juárez
  { id: 'doc-11', nombre: 'Edni González', especialidadId: 'esp-3', sucursalId: 'suc-4', horario: { inicio: '09:00', fin: '18:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-12', nombre: 'Iván Oros', especialidadId: 'esp-4', sucursalId: 'suc-4', horario: { inicio: '08:00', fin: '16:30', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-13', nombre: 'Iván Ornelas', especialidadId: 'esp-4', sucursalId: 'suc-4', horario: { inicio: '10:00', fin: '18:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-14', nombre: 'Dr. José Ricardo Espinoza Vargas', especialidadId: 'esp-4', sucursalId: 'suc-4', horario: { inicio: '07:30', fin: '15:30', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-15', nombre: 'Samseri Sandoval', especialidadId: 'esp-12', sucursalId: 'suc-4', horario: { inicio: '11:00', fin: '19:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-16', nombre: 'Missael Fuentes', especialidadId: 'esp-13', sucursalId: 'suc-4', horario: { inicio: '12:00', fin: '19:00', intervaloMin: 60 }, capacidadEmpalmes: 1, activo: true },
  { id: 'doc-17', nombre: 'Swwlet Abigail Barrientos', especialidadId: 'esp-6', sucursalId: 'suc-4', horario: { inicio: '09:00', fin: '17:00', intervaloMin: 60 }, capacidadEmpalmes: 1, activo: true },
  { id: 'doc-18', nombre: 'Claudia Córdova', especialidadId: 'esp-6', sucursalId: 'suc-4', horario: { inicio: '13:00', fin: '20:00', intervaloMin: 60 }, capacidadEmpalmes: 1, activo: true },

  // Clínica Adventista Virtual
  { id: 'doc-19', nombre: 'Dra. Tirsa Abisag Espinoza', especialidadId: 'esp-2', sucursalId: 'suc-7', horario: { inicio: '09:00', fin: '17:00', intervaloMin: 30 }, capacidadEmpalmes: 3, activo: true },
  { id: 'doc-20', nombre: 'Yamila Arredondo', especialidadId: 'esp-2', sucursalId: 'suc-7', horario: { inicio: '12:00', fin: '20:00', intervaloMin: 30 }, capacidadEmpalmes: 3, activo: true },
  { id: 'doc-21', nombre: 'Lidia Miranda', especialidadId: 'esp-7', sucursalId: 'suc-7', horario: { inicio: '10:00', fin: '18:00', intervaloMin: 60 }, capacidadEmpalmes: 2, activo: true },

  // Loreto Héroes
  { id: 'doc-22', nombre: 'Gregorio Pérez', especialidadId: 'esp-3', sucursalId: 'suc-5', horario: { inicio: '09:00', fin: '18:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
  { id: 'doc-23', nombre: 'Gladys López', especialidadId: 'esp-3', sucursalId: 'suc-5', horario: { inicio: '10:00', fin: '19:00', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },

  // Loreto Centro
  { id: 'doc-24', nombre: 'Nancy Grijalva', especialidadId: 'esp-3', sucursalId: 'suc-6', horario: { inicio: '09:30', fin: '18:30', intervaloMin: 30 }, capacidadEmpalmes: 2, activo: true },
];

const servicios: CatalogoServicio[] = [
  // Medicina Integral
  { id: 'srv-1', nombre: 'Consulta Medicina Integral', especialidadId: 'esp-1', precioBase: 500, duracionMinutos: 30, promocionActiva: true, codigoPromocion: 'PRIMERA_VEZ_2026', precioPromocion: 250 },
  { id: 'srv-2', nombre: 'Consulta Medicina Integral en Línea', especialidadId: 'esp-2', precioBase: 450, duracionMinutos: 30, promocionActiva: true, codigoPromocion: 'VIRTUAL_2026', precioPromocion: 225 },
  
  // Odontología
  { id: 'srv-3', nombre: 'Consulta Odontológica', especialidadId: 'esp-3', precioBase: 400, duracionMinutos: 30 },
  { id: 'srv-4', nombre: 'Limpieza Dental', especialidadId: 'esp-3', precioBase: 600, duracionMinutos: 45, promocionActiva: true, codigoPromocion: 'SONRISA_2026', precioPromocion: 300 },
  { id: 'srv-5', nombre: 'Resina Dental', especialidadId: 'esp-3', precioBase: 800, duracionMinutos: 60 },
  
  // Oftalmología
  { id: 'srv-6', nombre: 'Consulta Oftalmológica', especialidadId: 'esp-4', precioBase: 500, duracionMinutos: 30 },
  { id: 'srv-7', nombre: 'Examen Visual Completo', especialidadId: 'esp-4', precioBase: 350, duracionMinutos: 30 },
  
  // Fisioterapia
  { id: 'srv-8', nombre: 'Sesión de Fisioterapia', especialidadId: 'esp-5', precioBase: 450, duracionMinutos: 30 },
  { id: 'srv-9', nombre: 'Paquete 5 Sesiones Fisioterapia', especialidadId: 'esp-5', precioBase: 2000, duracionMinutos: 30, promocionActiva: true, codigoPromocion: 'PAQUETE_FISIO', precioPromocion: 1800 },
  
  // Psicología
  { id: 'srv-10', nombre: 'Consulta Psicológica', especialidadId: 'esp-6', precioBase: 600, duracionMinutos: 60 },
  { id: 'srv-11', nombre: 'Consulta Psicológica en Línea', especialidadId: 'esp-7', precioBase: 550, duracionMinutos: 60 },
  
  // Nutrición
  { id: 'srv-12', nombre: 'Consulta Nutricional', especialidadId: 'esp-8', precioBase: 500, duracionMinutos: 45 },
  { id: 'srv-13', nombre: 'Consulta Nutricional en Línea', especialidadId: 'esp-9', precioBase: 450, duracionMinutos: 45 },
  { id: 'srv-14', nombre: 'Plan Nutricional Personalizado', especialidadId: 'esp-8', precioBase: 800, duracionMinutos: 60 },
  
  // Laboratorio Clínico
  { id: 'srv-15', nombre: 'Análisis Clínicos Básicos', especialidadId: 'esp-10', precioBase: 350, duracionMinutos: 15 },
  { id: 'srv-16', nombre: 'Análisis Clínicos Completos', especialidadId: 'esp-10', precioBase: 800, duracionMinutos: 20 },
  
  // Laboratorio Dental
  { id: 'srv-17', nombre: 'Prótesis Dental', especialidadId: 'esp-11', precioBase: 3000, duracionMinutos: 30 },
  { id: 'srv-18', nombre: 'Corona Dental', especialidadId: 'esp-11', precioBase: 2500, duracionMinutos: 30 },
  
  // Óptica
  { id: 'srv-19', nombre: 'Graduación de Lentes', especialidadId: 'esp-12', precioBase: 300, duracionMinutos: 30 },
  { id: 'srv-20', nombre: 'Venta de Lentes', especialidadId: 'esp-12', precioBase: 1500, duracionMinutos: 20 },

  // Consejería Pastoral
  { id: 'srv-21', nombre: 'Consejería Pastoral', especialidadId: 'esp-13', precioBase: 300, duracionMinutos: 60 },
];

const promociones: CatalogoPromocion[] = [
  {
    id: 'promo-1',
    codigo: 'PRIMERA_VEZ_2026',
    nombre: 'Primera Vez - Medicina Integral',
    descuentoPorcentaje: 50,
    especialidadId: 'esp-1',
    vigenciaInicio: '2026-01-01',
    vigenciaFin: '2026-12-31',
    aplicaPrimeraVez: true,
  },
  {
    id: 'promo-2',
    codigo: 'VIRTUAL_2026',
    nombre: 'Consultas Virtuales',
    descuentoPorcentaje: 50,
    especialidadId: 'esp-2',
    vigenciaInicio: '2026-01-01',
    vigenciaFin: '2026-12-31',
    aplicaPrimeraVez: true,
  },
  {
    id: 'promo-3',
    codigo: 'SONRISA_2026',
    nombre: 'Mes de la Sonrisa - Febrero',
    descuentoPorcentaje: 50,
    especialidadId: 'esp-3',
    vigenciaInicio: '2026-02-01',
    vigenciaFin: '2026-02-28',
    aplicaPrimeraVez: true,
  },
  {
    id: 'promo-4',
    codigo: 'PAQUETE_FISIO',
    nombre: 'Paquete Fisioterapia',
    descuentoPorcentaje: 10,
    especialidadId: 'esp-5',
    vigenciaInicio: '2026-01-01',
    vigenciaFin: '2026-12-31',
    aplicaPrimeraVez: false,
  },
];

const construirEspecialidadesPorSucursal = (lista: CatalogoDoctor[]) => {
  const mapa: Record<string, string[]> = {};
  lista.forEach((doc) => {
    if (!mapa[doc.sucursalId]) {
      mapa[doc.sucursalId] = [];
    }
    if (!mapa[doc.sucursalId].includes(doc.especialidadId)) {
      mapa[doc.sucursalId].push(doc.especialidadId);
    }
  });
  return mapa;
};

export class CatalogoController {
  async obtenerCatalogo(req: Request, res: Response): Promise<void> {
    const { sucursalId } = req.query;

    const sucursalRepo = new SucursalRepositoryPostgres();
    const sucursalesDb = await sucursalRepo.obtenerActivas();
    const sucursalesCatalogo = sucursalesDb.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      ciudad: s.ciudad,
      estado: s.estado,
      direccion: s.direccion,
      telefono: s.telefono,
      email: s.emailContacto,
      zonaHoraria: s.zonaHoraria,
      activo: s.activa,
    }));
    const ordenSucursales = [
      'Ciudad Obregón',
      'Ciudad Juárez',
      'Loreto Héroes',
      'Loreto Centro',
      'Valle de la Trinidad',
      'Guadalajara',
      'Clínica Adventista Virtual',
    ];
    sucursalesCatalogo.sort((a, b) => {
      const i = ordenSucursales.indexOf(a.nombre);
      const j = ordenSucursales.indexOf(b.nombre);
      if (i === -1 && j === -1) return a.nombre.localeCompare(b.nombre);
      if (i === -1) return 1;
      if (j === -1) return -1;
      return i - j;
    });

    const legacyToName: Record<string, string> = {
      'suc-1': 'Valle de la Trinidad',
      'suc-2': 'Guadalajara',
      'suc-3': 'Ciudad Obregón',
      'suc-4': 'Ciudad Juárez',
      'suc-5': 'Loreto Héroes',
      'suc-6': 'Loreto Centro',
      'suc-7': 'Clínica Adventista Virtual',
      'suc-8': 'Valle de la Trinidad',
    };
    const legacyAlternates: Record<string, string[]> = {
      'suc-7': ['Clínica Virtual Adventista'],
    };

    const dbIdByName = new Map(sucursalesDb.map((s) => [s.nombre, s.id]));
    const mapLegacyToDbId = (legacyId: string) => {
      const name = legacyToName[legacyId];
      const directId = name ? dbIdByName.get(name) : undefined;
      if (directId) return directId;
      const alternates = legacyAlternates[legacyId] || [];
      for (const altName of alternates) {
        const altId = dbIdByName.get(altName);
        if (altId) return altId;
      }
      return undefined;
    };

    const doctoresMapped = doctores
      .map((doc) => {
        const dbId = mapLegacyToDbId(doc.sucursalId);
        if (!dbId) return null;
        return { ...doc, sucursalId: dbId };
      })
      .filter(Boolean) as CatalogoDoctor[];

    const especialidadesPorSucursalDb = construirEspecialidadesPorSucursal(doctoresMapped);

    // Filtrar especialidades por sucursal si se proporciona
    let especialidadesFiltradas = especialidades;
    let doctoresFiltrados = doctoresMapped;
    let serviciosFiltrados = servicios;

    if (sucursalId && typeof sucursalId === 'string') {
      const especialidadesIds = especialidadesPorSucursalDb[sucursalId] || [];
      especialidadesFiltradas = especialidades.filter(esp => 
        especialidadesIds.includes(esp.id)
      );
      doctoresFiltrados = doctoresMapped.filter(doc => 
        doc.sucursalId === sucursalId
      );
      serviciosFiltrados = servicios.filter(srv => 
        especialidadesIds.includes(srv.especialidadId)
      );
    }

    res.json({
      success: true,
      catalogo: {
        sucursales: sucursalesCatalogo,
        especialidades: especialidadesFiltradas,
        doctores: doctoresFiltrados,
        servicios: serviciosFiltrados,
        promociones,
      },
    });
  }

  /**
   * @deprecated La ruta GET /api/catalogo/disponibilidad delega a CitaController.obtenerDisponibilidad
   * (lógica real de citas y bloqueos). Este método ya no se usa.
   */
  async obtenerDisponibilidad(_req: Request, _res: Response): Promise<void> {
    // Delegado en src/api/routes/catalogo.ts a CitaController
  }

  async agendarCita(req: Request, res: Response): Promise<void> {
    const { 
      sucursalId, 
      especialidadId, 
      doctorId, 
      servicioId,
      fecha, 
      hora,
      paciente 
    } = req.body;

    // Generar ID único para la cita
    const citaId = `cita-${Date.now()}`;

    // Crear objeto de cita
    const nuevaCita = {
      id: citaId,
      paciente: {
        id: paciente?.id || `pac-${Date.now()}`,
        nombre: paciente?.nombre || 'Paciente',
        telefono: paciente?.telefono || '',
        email: paciente?.email || '',
      },
      sucursalId,
      especialidadId,
      doctorId,
      servicioId,
      fecha,
      hora,
      estado: 'agendada',
      fechaCreacion: new Date().toISOString(),
    };

    // Simular guardado en base de datos
    console.log('📅 Nueva cita agendada:', nuevaCita);

    // Simular notificación
    console.log('🔔 Notificación: Nueva cita agendada para', paciente?.nombre || 'Paciente', 'el', fecha, 'a las', hora);

    res.json({
      success: true,
      message: 'Cita agendada exitosamente',
      cita: nuevaCita,
    });
  }
}

export default new CatalogoController();
