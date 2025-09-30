import type { Producto } from "../types/producto.types";

/**
 * Calcula el margen de ganancia de un producto
 */
export const calcularMargen = (producto: Producto): number => {
  const margen = producto.precioMiLocal - producto.precioProveedor;
  return margen;
};

/**
 * Calcula el porcentaje de ganancia de un producto
 */
export const calcularPorcentajeGanancia = (producto: Producto): number => {
  if (producto.precioProveedor === 0) return 0;
  const porcentaje =
    ((producto.precioMiLocal - producto.precioProveedor) /
      producto.precioProveedor) *
    100;
  return Math.round(porcentaje * 100) / 100;
};

/**
 * Verifica si un producto tiene stock bajo
 */
export const tieneStockBajo = (producto: Producto): boolean => {
  const minimo = producto.stockMinimo || 5;
  return producto.stockActual <= minimo;
};

/**
 * Formatea un precio en formato de moneda
 */
export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(precio);
};

/**
 * Formatea una fecha en formato local
 */
export const formatearFecha = (fecha: string | Date): string => {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  return fechaObj.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calcula el valor total del inventario de un producto
 */
export const calcularValorInventario = (producto: Producto): number => {
  return producto.stockActual * producto.precioProveedor;
};

/**
 * Calcula el valor de venta total del inventario
 */
export const calcularValorVenta = (producto: Producto): number => {
  return producto.stockActual * producto.precioMiLocal;
};

/**
 * Obtiene el estado del stock
 */
export const obtenerEstadoStock = (
  producto: Producto
): "critico" | "bajo" | "normal" | "alto" => {
  const minimo = producto.stockMinimo || 5;

  if (producto.stockActual === 0) return "critico";
  if (producto.stockActual <= minimo / 2) return "critico";
  if (producto.stockActual <= minimo) return "bajo";
  if (producto.stockActual > minimo * 3) return "alto";
  return "normal";
};

/**
 * Genera un reporte resumido de productos
 */
export const generarResumenProductos = (productos: Producto[]) => {
  const total = productos.length;
  const activos = productos.filter((p) => p.activo).length;
  const inactivos = total - activos;
  const stockBajo = productos.filter(tieneStockBajo).length;

  const valorTotalInventario = productos.reduce(
    (sum, p) => sum + calcularValorInventario(p),
    0
  );

  const valorTotalVenta = productos.reduce(
    (sum, p) => sum + calcularValorVenta(p),
    0
  );

  const gananciaEstimada = valorTotalVenta - valorTotalInventario;

  return {
    total,
    activos,
    inactivos,
    stockBajo,
    valorTotalInventario,
    valorTotalVenta,
    gananciaEstimada,
  };
};

/**
 * Filtra productos por criterios múltiples
 */
export const filtrarProductos = (
  productos: Producto[],
  filtros: {
    busqueda?: string;
    soloActivos?: boolean;
    soloStockBajo?: boolean;
    idProveedor?: number;
    precioMin?: number;
    precioMax?: number;
  }
): Producto[] => {
  let resultado = [...productos];

  if (filtros.busqueda) {
    const termino = filtros.busqueda.toLowerCase();
    resultado = resultado.filter(
      (p) =>
        p.nombre.toLowerCase().includes(termino) ||
        p.descripcion?.toLowerCase().includes(termino)
    );
  }

  if (filtros.soloActivos) {
    resultado = resultado.filter((p) => p.activo);
  }

  if (filtros.soloStockBajo) {
    resultado = resultado.filter(tieneStockBajo);
  }

  if (filtros.idProveedor) {
    resultado = resultado.filter((p) => p.idProveedor === filtros.idProveedor);
  }

  if (filtros.precioMin !== undefined) {
    resultado = resultado.filter((p) => p.precioMiLocal >= filtros.precioMin!);
  }

  if (filtros.precioMax !== undefined) {
    resultado = resultado.filter((p) => p.precioMiLocal <= filtros.precioMax!);
  }

  return resultado;
};

/**
 * Ordena productos por diferentes criterios
 */
export const ordenarProductos = (
  productos: Producto[],
  criterio: "nombre" | "precio" | "stock" | "margen"
): Producto[] => {
  const copia = [...productos];

  switch (criterio) {
    case "nombre":
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));

    case "precio":
      return copia.sort((a, b) => a.precioMiLocal - b.precioMiLocal);

    case "stock":
      return copia.sort((a, b) => a.stockActual - b.stockActual);

    case "margen":
      return copia.sort(
        (a, b) => calcularPorcentajeGanancia(b) - calcularPorcentajeGanancia(a)
      );

    default:
      return copia;
  }
};
