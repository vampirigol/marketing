/**
 * Entidad: Usuario del Sistema (Autenticación)
 * Representa un usuario del sistema con roles y permisos
 */

export type Rol = 
  | 'Admin'
  | 'Recepcion'
  | 'Contact_Center'
  | 'Medico'
  | 'Supervisor';

export type EstadoUsuario = 
  | 'Activo'
  | 'Inactivo'
  | 'Suspendido';

export interface Permiso {
  modulo: string; // 'citas', 'pacientes', 'abonos', etc.
  acciones: ('crear' | 'leer' | 'actualizar' | 'eliminar')[];
}

export interface UsuarioSistema {
  id: string;
  username: string;
  password: string; // Hash
  email: string;
  
  // Información personal
  nombreCompleto: string;
  telefono?: string;
  
  // Rol y permisos
  rol: Rol;
  permisos: Permiso[];
  
  // Asignación
  sucursalId?: string; // Sucursal asignada (si aplica)
  sucursalNombre?: string;
  
  // Estado
  estado: EstadoUsuario;
  ultimoAcceso?: Date;
  
  // Metadata
  creadoPor: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
}

/**
 * Entidad con lógica de negocio
 */
export class UsuarioSistemaEntity implements UsuarioSistema {
  id: string;
  username: string;
  password: string;
  email: string;
  nombreCompleto: string;
  telefono?: string;
  rol: Rol;
  permisos: Permiso[];
  sucursalId?: string;
  sucursalNombre?: string;
  estado: EstadoUsuario;
  ultimoAcceso?: Date;
  creadoPor: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;

  constructor(data: UsuarioSistema) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password;
    this.email = data.email;
    this.nombreCompleto = data.nombreCompleto;
    this.telefono = data.telefono;
    this.rol = data.rol;
    this.permisos = data.permisos;
    this.sucursalId = data.sucursalId;
    this.sucursalNombre = data.sucursalNombre;
    this.estado = data.estado;
    this.ultimoAcceso = data.ultimoAcceso;
    this.creadoPor = data.creadoPor;
    this.fechaCreacion = data.fechaCreacion;
    this.ultimaActualizacion = data.ultimaActualizacion;
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  tienePermiso(modulo: string, accion: 'crear' | 'leer' | 'actualizar' | 'eliminar'): boolean {
    // Admin tiene todos los permisos
    if (this.rol === 'Admin') return true;

    const permiso = this.permisos.find(p => p.modulo === modulo);
    return permiso ? permiso.acciones.includes(accion) : false;
  }

  /**
   * Verifica si el usuario puede acceder a un módulo
   */
  puedeAccederModulo(modulo: string): boolean {
    if (this.rol === 'Admin') return true;
    return this.permisos.some(p => p.modulo === modulo);
  }

  /**
   * Actualiza el último acceso
   */
  registrarAcceso(): void {
    this.ultimoAcceso = new Date();
    this.ultimaActualizacion = new Date();
  }

  /**
   * Suspende el usuario
   */
  suspender(): void {
    this.estado = 'Suspendido';
    this.ultimaActualizacion = new Date();
  }

  /**
   * Activa el usuario
   */
  activar(): void {
    this.estado = 'Activo';
    this.ultimaActualizacion = new Date();
  }

  /**
   * Obtiene representación sin password
   */
  toSafeObject(): Omit<UsuarioSistema, 'password'> {
    const { password, ...safe } = this;
    return safe;
  }

  /**
   * Verifica si el usuario está activo
   */
  estaActivo(): boolean {
    return this.estado === 'Activo';
  }
}

/**
 * Configuración de permisos por rol
 */
export const PERMISOS_POR_ROL: Record<Rol, Permiso[]> = {
  Admin: [
    { modulo: 'citas', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
    { modulo: 'pacientes', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
    { modulo: 'abonos', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
    { modulo: 'inasistencias', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
    { modulo: 'contactos', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
    { modulo: 'usuarios', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
    { modulo: 'configuracion', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
  ],
  
  Recepcion: [
    { modulo: 'citas', acciones: ['leer', 'actualizar'] },
    { modulo: 'pacientes', acciones: ['crear', 'leer', 'actualizar'] },
    { modulo: 'abonos', acciones: ['crear', 'leer'] },
    { modulo: 'inasistencias', acciones: ['leer'] },
  ],
  
  Contact_Center: [
    { modulo: 'citas', acciones: ['crear', 'leer', 'actualizar'] },
    { modulo: 'pacientes', acciones: ['crear', 'leer', 'actualizar'] },
    { modulo: 'inasistencias', acciones: ['crear', 'leer', 'actualizar'] },
    { modulo: 'contactos', acciones: ['crear', 'leer', 'actualizar'] },
  ],
  
  Medico: [
    { modulo: 'citas', acciones: ['leer', 'actualizar'] },
    { modulo: 'pacientes', acciones: ['leer', 'actualizar'] },
    { modulo: 'abonos', acciones: ['leer'] },
  ],
  
  Supervisor: [
    { modulo: 'citas', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
    { modulo: 'pacientes', acciones: ['crear', 'leer', 'actualizar'] },
    { modulo: 'abonos', acciones: ['crear', 'leer', 'actualizar'] },
    { modulo: 'inasistencias', acciones: ['crear', 'leer', 'actualizar'] },
    { modulo: 'contactos', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
    { modulo: 'usuarios', acciones: ['leer'] },
  ],
};

/**
 * Obtiene permisos para un rol
 */
export function obtenerPermisosPorRol(rol: Rol): Permiso[] {
  return PERMISOS_POR_ROL[rol] || [];
}

/**
 * Descripción de roles
 */
export interface DescripcionRol {
  rol: Rol;
  nombre: string;
  descripcion: string;
  acceso: string[];
}

export const DESCRIPCION_ROLES: DescripcionRol[] = [
  {
    rol: 'Admin',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    acceso: ['Todos los módulos', 'Gestión de usuarios', 'Configuración']
  },
  {
    rol: 'Recepcion',
    nombre: 'Recepción',
    descripcion: 'Personal de recepción de sucursal',
    acceso: ['Marcar llegadas', 'Registrar pacientes', 'Abonos']
  },
  {
    rol: 'Contact_Center',
    nombre: 'Contact Center (KEILA)',
    descripcion: 'Agentes de contact center',
    acceso: ['Agendar citas', 'Gestionar inasistencias', 'Contactos', 'Remarketing']
  },
  {
    rol: 'Medico',
    nombre: 'Médico',
    descripcion: 'Personal médico',
    acceso: ['Ver agenda', 'Actualizar consultas', 'Historial pacientes']
  },
  {
    rol: 'Supervisor',
    nombre: 'Supervisor',
    descripcion: 'Supervisor de sucursal o área',
    acceso: ['Gestión operativa', 'Reportes', 'Asignación de tareas']
  }
];
