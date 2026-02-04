/**
 * Middleware: Autorización por Roles
 * Valida que el usuario tenga los permisos necesarios
 */

import { Request, Response, NextFunction } from 'express';
import { Rol, PERMISOS_POR_ROL } from '../../core/entities/UsuarioSistema';

/**
 * Middleware que requiere uno o más roles específicos
 * 
 * @example
 * router.delete('/citas/:id', autenticar, requiereRol('Admin', 'Supervisor'), controller.eliminar)
 */
export const requiereRol = (...rolesPermitidos: Rol[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        codigo: 'NO_AUTENTICADO'
      });
      return;
    }

    // Verificar que tenga el rol permitido
    if (!rolesPermitidos.includes(req.user.rol)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción',
        codigo: 'ACCESO_DENEGADO',
        requerido: rolesPermitidos,
        actual: req.user.rol
      });
      return;
    }

    next();
  };
};

/**
 * Middleware que requiere permiso específico en un módulo
 * 
 * @example
 * router.post('/citas', autenticar, requierePermiso('citas', 'crear'), controller.crear)
 */
export const requierePermiso = (
  modulo: string,
  accion: 'crear' | 'leer' | 'actualizar' | 'eliminar'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        codigo: 'NO_AUTENTICADO'
      });
      return;
    }

    // Admin tiene todos los permisos
    if (req.user.rol === 'Admin') {
      next();
      return;
    }

    // Obtener permisos del rol
    const permisos = PERMISOS_POR_ROL[req.user.rol];
    const permiso = permisos?.find(p => p.modulo === modulo);

    if (!permiso || !permiso.acciones.includes(accion)) {
      res.status(403).json({
        success: false,
        error: `No tienes permiso para ${accion} en ${modulo}`,
        codigo: 'PERMISO_DENEGADO',
        requerido: { modulo, accion },
        rol: req.user.rol
      });
      return;
    }

    next();
  };
};

/**
 * Middleware que requiere que el usuario pertenezca a una sucursal específica
 * o sea Admin/Supervisor
 */
export const requiereSucursal = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Usuario no autenticado',
      codigo: 'NO_AUTENTICADO'
    });
    return;
  }

  // Admin y Supervisor pueden acceder a todas las sucursales
  if (req.user.rol === 'Admin' || req.user.rol === 'Supervisor') {
    next();
    return;
  }

  // Otros roles deben tener sucursal asignada
  if (!req.user.sucursalId) {
    res.status(403).json({
      success: false,
      error: 'No tienes sucursal asignada',
      codigo: 'SIN_SUCURSAL'
    });
    return;
  }

  next();
};

/**
 * Middleware que verifica que el usuario solo acceda a datos de su sucursal
 */
export const validarSucursalPropia = (paramName: string = 'sucursalId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        codigo: 'NO_AUTENTICADO'
      });
      return;
    }

    // Admin y Supervisor pueden acceder a cualquier sucursal
    if (req.user.rol === 'Admin' || req.user.rol === 'Supervisor') {
      next();
      return;
    }

    // Obtener sucursalId del request (params, query o body)
    const sucursalIdSolicitada = 
      req.params[paramName] || 
      req.query[paramName] || 
      (req.body && req.body[paramName]);

    // Si no se solicita sucursal específica, está OK
    if (!sucursalIdSolicitada) {
      next();
      return;
    }

    // Verificar que sea su propia sucursal
    if (req.user.sucursalId !== sucursalIdSolicitada) {
      res.status(403).json({
        success: false,
        error: 'Solo puedes acceder a datos de tu sucursal',
        codigo: 'SUCURSAL_NO_AUTORIZADA'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware que solo permite acceso a Admin
 */
export const soloAdmin = requiereRol('Admin');

/**
 * Middleware que permite acceso a Admin o Supervisor
 */
export const adminOSupervisor = requiereRol('Admin', 'Supervisor');

/**
 * Middleware que permite acceso a personal operativo
 */
export const personalOperativo = requiereRol('Admin', 'Supervisor', 'Recepcion', 'Contact_Center');
