import { z } from "zod";

export const crearProductoSchema = z.object({
  idProveedor: z.number().positive("Proveedor es requerido"),
  nombre: z.string().min(3, "Nombre debe tener al menos 3 caracteres").max(255),
  descripcion: z.string().nullable().optional(),
  precioProveedor: z.number().positive("Precio de proveedor debe ser positivo"),
  precioMiLocal: z.number().positive("Precio de venta debe ser positivo"),
  stockActual: z.number().int().min(0, "Stock no puede ser negativo"),
  stockMinimo: z.number().int().min(0).optional(),
});

export const actualizarProductoSchema = z.object({
  idProveedor: z.number().positive().optional(),
  nombre: z.string().min(3).max(255).optional(),
  descripcion: z.string().nullable().optional(),
  precioProveedor: z.number().positive().optional(),
  precioMiLocal: z.number().positive().optional(),
  stockActual: z.number().int().min(0).optional(),
  stockMinimo: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

export const ajustarStockSchema = z.object({
  cantidad: z.number().int("Cantidad debe ser un número entero"),
  motivo: z.string().min(5, "Motivo debe tener al menos 5 caracteres"),
});

export const cambiarPrecioSchema = z.object({
  precio: z.number().positive("Precio debe ser positivo"),
  tipo: z.enum(["proveedor", "local"], {
    message: 'Tipo debe ser "proveedor" o "local"',
  }),
});

export const agregarImagenSchema = z.object({
  url: z.string().url("URL inválida"),
});

export const cargaMasivaSchema = z.object({
  productos: z
    .array(
      z.object({
        nombre: z.string().min(1),
        descripcion: z.string().optional(),
        precio: z.union([z.string(), z.number()]),
      })
    )
    .min(1, "Debe incluir al menos un producto"),
  idProveedor: z.number().positive().optional(),
  aumentoPorcentaje: z.number().min(0).max(100).optional(),
  stockPorDefecto: z.number().int().min(0).optional(),
});

export type CrearProductoForm = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoForm = z.infer<typeof actualizarProductoSchema>;
export type AjusteStockForm = z.infer<typeof ajustarStockSchema>;
export type CambioPrecioForm = z.infer<typeof cambiarPrecioSchema>;
export type AgregarImagenForm = z.infer<typeof agregarImagenSchema>;
export type CargaMasivaForm = z.infer<typeof cargaMasivaSchema>;
