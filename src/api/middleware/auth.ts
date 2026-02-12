/**
 * Middleware: Autenticación JWT
 * Valida el token JWT y extrae la información del usuario
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Rol } from '../../core/entities/UsuarioSistema';

// Extender Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        rol: Rol;
        sucursalId?: string;
        nombreCompleto?: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'rca-crm-secret-key-2026';

/**
 * Middleware de autenticación
 * Verifica que el token JWT sea válido
 */
export const autenticar = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación',
        codigo: 'NO_TOKEN'
      });
      return;
    }

    // 2. Extraer token (formato: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token inválido',
        codigo: 'INVALID_TOKEN_FORMAT'
      });
      return;
    }

    // 3. Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      rol: Rol;
      sucursalId?: string;
    };

    // 4. Agregar usuario al request
    req.user = decoded;

    // 5. Continuar
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expirado',
        codigo: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Token inválido',
        codigo: 'INVALID_TOKEN'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error en autenticación',
      codigo: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware de autenticación opcional
 * No falla si no hay token, pero si hay uno lo valida
 */
export const autenticarOpcional = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No hay token, continuar sin usuario
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      next();
      return;
    }

    // Verificar token si existe
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      rol: Rol;
      sucursalId?: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    // Si hay error, continuar sin usuario
    next();
  }
};

/**
 * Genera un token JWT
 */
export const generarToken = (payload: {
  id: string;
  username: string;
  rol: Rol;
  sucursalId?: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '8h' // Token válido por 8 horas
  });
};

/**
 * Verifica un token JWT
 */
export const verificarToken = (token: string): {
  valido: boolean;
  usuario?: {
    id: string;
    username: string;
    rol: Rol;
    sucursalId?: string;
  };
  error?: string;
} => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      rol: Rol;
      sucursalId?: string;
    };

    return {
      valido: true,
      usuario: decoded
    };
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valido: false, error: 'Token expirado' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valido: false, error: 'Token inválido' };
    }
    return { valido: false, error: 'Error desconocido' };
  }
};
