/**
 * Entidad: Usuario
 * Representa a los usuarios del sistema (Antonio, Yaretzi, Keila, etc.)
 */
export interface Usuario {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  
  // Autenticación
  password: string; // Hash
  
  // Roles y permisos
  rol: 'Admin' | 'Finanzas' | 'Contact_Center' | 'Recepcion' | 'Medico';
  permisos: string[];
  
  // Asignación
  sucursalAsignada?: string;
  sucursalesAcceso: string[]; // IDs de sucursales a las que tiene acceso
  
  // Estado
  activo: boolean;
  ultimoAcceso?: Date;
  
  // Metadata
  fechaCreacion: Date;
  creadoPor?: string;
}

export type RolPermisos = {
  [key: string]: string[];
};

export const PERMISOS_POR_ROL: RolPermisos = {
  Admin: [
    'crear_usuarios',
    'editar_usuarios',
    'ver_reportes_completos',
    'configurar_sistema',
    'acceso_todas_sucursales',
    'gestionar_finanzas',
    'gestionar_citas',
    'gestionar_pacientes',
  ],
  Finanzas: [
    'ver_cortes',
    'generar_reportes_financieros',
    'ver_abonos',
    'registrar_abonos',
    'acceso_sucursal_asignada',
  ],
  Contact_Center: [
    'gestionar_citas',
    'gestionar_pacientes',
    'enviar_mensajes_whatsapp',
    'ver_calendario',
    'acceso_todas_sucursales',
  ],
  Recepcion: [
    'marcar_llegadas',
    'ver_citas_dia',
    'registrar_abonos',
    'imprimir_recibos',
    'acceso_sucursal_asignada',
  ],
  Medico: [
    'ver_citas_asignadas',
    'actualizar_historial_medico',
    'ver_pacientes',
    'acceso_sucursal_asignada',
  ],
};

export class UsuarioEntity implements Usuario {
  id!: string;
  nombreCompleto!: string;
  email!: string;
  telefono!: string;
  password!: string;
  rol!: 'Admin' | 'Finanzas' | 'Contact_Center' | 'Recepcion' | 'Medico';
  permisos!: string[];
  sucursalAsignada?: string;
  sucursalesAcceso!: string[];
  activo!: boolean;
  ultimoAcceso?: Date;
  fechaCreacion!: Date;
  creadoPor?: string;

  constructor(data: Usuario) {
    Object.assign(this, data);
    
    // Asignar permisos basados en el rol si no se especifican
    if (!this.permisos || this.permisos.length === 0) {
      this.permisos = PERMISOS_POR_ROL[this.rol] || [];
    }
  }

  tienePermiso(permiso: string): boolean {
    return this.permisos.includes(permiso);
  }

  tieneAccesoSucursal(sucursalId: string): boolean {
    // Admin tiene acceso a todas
    if (this.rol === 'Admin' || this.rol === 'Contact_Center') {
      return true;
    }
    
    return this.sucursalesAcceso.includes(sucursalId);
  }

  registrarAcceso(): void {
    this.ultimoAcceso = new Date();
  }
}
