import { Request, Response, NextFunction } from "express";

// Interfaz para errores personalizados
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Middleware para manejar rutas no encontradas
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error: AppError = new Error(
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  );
  error.statusCode = 404;
  error.isOperational = true;

  next(error);
};

/**
 * Middleware global de manejo de errores
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Log del error (siempre en servidor)
  console.error(`ERROR ${statusCode}:`, {
    message: error.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
    stack: !isProduction ? error.stack : undefined,
  });

  // Respuesta base
  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  };

  // En desarrollo
  if (!isProduction) {
    (errorResponse.error as any).stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Wrapper para funciones async para capturar errores automáticamente
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Función helper para crear errores personalizados
 */
export const createError = (
  message: string,
  statusCode: number = 500
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
