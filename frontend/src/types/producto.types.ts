export interface Producto {
  id: number;
  idProveedor: number;
  nombre: string;
  descripcion: string | null;
  precioProveedor: number;
  precioMiLocal: number;
  stockActual: number;
  stockMinimo?: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearProductoDTO {
  idProveedor: number;
  nombre: string;
  descripcion?: string | null;
  precioProveedor: number;
  precioMiLocal: number;
  stockActual: number;
  stockMinimo?: number;
}

export interface ActualizarProductoDTO {
  idProveedor?: number;
  nombre?: string;
  descripcion?: string | null;
  precioProveedor?: number;
  precioMiLocal?: number;
  stockActual?: number;
  stockMinimo?: number;
  activo?: boolean;
}

export interface AjustarStockDTO {
  cantidad: number;
  motivo: string;
}

export interface CambiarPrecioDTO {
  precio: number;
  tipo: "proveedor" | "local";
}

export interface AgregarImagenDTO {
  url: string;
}

export interface HistorialPrecio {
  id: number;
  idProducto: number;
  precio: string;
  fechaCambio: string;
  tipo: string;
}

export interface ImagenProducto {
  id: number;
  idProducto: number;
  url: string;
  createdAt: string;
}

export interface CargaMasivaDTO {
  productos: Array<{
    nombre: string;
    descripcion?: string;
    precio: string | number;
  }>;
  idProveedor?: number;
  aumentoPorcentaje?: number;
  stockPorDefecto?: number;
}

export interface ResultadoCargaMasiva {
  procesados: number;
  creados: number;
  errores: number;
  duplicados: number;
  detalles: Array<{
    index: number;
    nombre: string;
    estado: "creado" | "error" | "duplicado";
    mensaje?: string;
    id?: number;
    precioFinal?: number;
  }>;
}

export interface FiltrosProductos {
  proveedor?: number;
  stockBajo?: boolean;
  limite?: number;
  busqueda?: string;
}
