import { RequestHandler, Request, Response, NextFunction } from "express";

// Tipos para los middlewares y handlers
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export type SyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Response;

export type ControllerHandler = AsyncRequestHandler | SyncRequestHandler | RequestHandler;

// Definición de métodos HTTP disponibles
export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

// Configuración de rutas
export interface RouteConfig {
  method: HttpMethod;
  url: (name: string) => string;
}

// Métodos estándar del controlador
export interface StandardMethods {
  create?: ControllerHandler | ControllerHandler[];
  show?: ControllerHandler | ControllerHandler[];
  update?: ControllerHandler | ControllerHandler[];
  delete?: ControllerHandler | ControllerHandler[];
  search?: ControllerHandler | ControllerHandler[];
}

// Interface principal del controlador
export interface Controller extends StandardMethods {
  name: string;
  prefix?: string;
  [key: string]: string | ControllerHandler | ControllerHandler[] | undefined;
}

// Mapa de métodos estándar - ahora más flexible
export const MethodMap: Record<string, RouteConfig> = {
  // Métodos CRUD estándar
  create: { method: "post", url: (name: string) => `/${name}` },
  show: { method: "get", url: (name: string) => `/${name}/:id` },
  update: { method: "put", url: (name: string) => `/${name}/:id` },
  delete: { method: "delete", url: (name: string) => `/${name}/:id` },
  search: { method: "get", url: (name: string) => `/${name}/buscar` },
  
  // Métodos específicos para zapatillas
  index: { method: "get", url: (name: string) => `/${name}` },
  activos: { method: "get", url: (name: string) => `/${name}/activos` },
  inactivos: { method: "get", url: (name: string) => `/${name}/inactivos` },
  habilitar: { method: "put", url: (name: string) => `/${name}/habilitar/:id` },
  deshabilitar: { method: "put", url: (name: string) => `/${name}/deshabilitar/:id` },
  
  // Métodos para inventario
  stock: { method: "get", url: (name: string) => `/${name}/stock` },
  stockMinimo: { method: "get", url: (name: string) => `/${name}/stock/minimo` },
  actualizarStock: { method: "put", url: (name: string) => `/${name}/stock/:id` },
  
  // Métodos para ventas
  todasVentas: { method: "get", url: (name: string) => `/${name}` },
  ventasHoy: { method: "get", url: (name: string) => `/${name}/hoy` },
  ventasPorFecha: { method: "get", url: (name: string) => `/${name}/reporte` },
  gananciaDia: { method: "get", url: (name: string) => `/${name}/ganancia` },
  
  // Métodos para clientes
  clientesActivos: { method: "get", url: (name: string) => `/${name}/activos` },
  historialCompras: { method: "get", url: (name: string) => `/${name}/:id/historial` },
} as const;

// Tipo para los nombres de métodos disponibles
export type MethodName = keyof typeof MethodMap;

// Tipo para validar que el controlador tenga la estructura correcta
export type ValidatedController = {
  [K in keyof Controller]: K extends 'name' 
    ? string 
    : K extends 'prefix' 
    ? string | undefined
    : K extends MethodName
    ? ControllerHandler | ControllerHandler[]
    : ControllerHandler | ControllerHandler[] | string | undefined;
};