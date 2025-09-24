// Middleware de validaciones
import { TipoPrecio } from "../entities/HistorialPrecio.js";
import { Request, Response, NextFunction } from "express";

export const validarId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    res.status(400).json({
      success: false,
      message: "ID inválido",
    });
    return;
  }

  next();
};

export const validarCargaMasiva = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { productos, idProveedor, aumentoPorcentaje, stockPorDefecto } =
    req.body;

  if (!Array.isArray(productos)) {
    res.status(400).json({
      success: false,
      message: "Se requiere un array de productos",
    });
    return;
  }

  if (productos.length === 0) {
    res.status(400).json({
      success: false,
      message: "El array de productos no puede estar vacío",
    });
    return;
  }

  if (productos.length > 500) {
    res.status(400).json({
      success: false,
      message: "Máximo 500 productos por carga",
    });
    return;
  }

  if (
    idProveedor !== undefined &&
    (typeof idProveedor !== "number" || idProveedor <= 0)
  ) {
    res.status(400).json({
      success: false,
      message: "ID del proveedor debe ser un número positivo",
    });
    return;
  }

  if (
    aumentoPorcentaje !== undefined &&
    (typeof aumentoPorcentaje !== "number" ||
      aumentoPorcentaje < 0 ||
      aumentoPorcentaje > 1000)
  ) {
    res.status(400).json({
      success: false,
      message: "El aumento porcentaje debe estar entre 0 y 1000",
    });
    return;
  }

  if (
    stockPorDefecto !== undefined &&
    (typeof stockPorDefecto !== "number" || stockPorDefecto < 0)
  ) {
    res.status(400).json({
      success: false,
      message: "El stock por defecto debe ser un número positivo o cero",
    });
    return;
  }

  next();
};

export const validarCrearProducto = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { idProveedor, nombre, precioProveedor, precioMiLocal } = req.body;

  if (!idProveedor || !nombre || !precioProveedor || !precioMiLocal) {
    res.status(400).json({
      success: false,
      message:
        "Faltan campos requeridos: idProveedor, nombre, precioProveedor, precioMiLocal",
    });
    return;
  }

  if (typeof precioProveedor !== "number" || precioProveedor <= 0) {
    res.status(400).json({
      success: false,
      message: "El precio del proveedor debe ser un número positivo",
    });
    return;
  }

  if (typeof precioMiLocal !== "number" || precioMiLocal <= 0) {
    res.status(400).json({
      success: false,
      message: "El precio local debe ser un número positivo",
    });
    return;
  }

  next();
};

export const validarActualizarProducto = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { nombre, precioProveedor, precioMiLocal } = req.body;

  if (
    precioProveedor !== undefined &&
    (typeof precioProveedor !== "number" || precioProveedor <= 0)
  ) {
    res.status(400).json({
      success: false,
      message: "El precio del proveedor debe ser un número positivo",
    });
    return;
  }

  if (
    precioMiLocal !== undefined &&
    (typeof precioMiLocal !== "number" || precioMiLocal <= 0)
  ) {
    res.status(400).json({
      success: false,
      message: "El precio local debe ser un número positivo",
    });
    return;
  }

  if (nombre !== undefined && (!nombre || nombre.trim().length === 0)) {
    res.status(400).json({
      success: false,
      message: "El nombre no puede estar vacío",
    });
    return;
  }

  next();
};

export const validarAjustarStock = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { cantidad, motivo } = req.body;

  if (cantidad === undefined || typeof cantidad !== "number") {
    res.status(400).json({
      success: false,
      message: "La cantidad es requerida y debe ser un número",
    });
    return;
  }

  if (!motivo || motivo.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "El motivo es requerido",
    });
    return;
  }

  next();
};

export const validarCambioPrecio = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { precio, tipo } = req.body;

  if (!precio || typeof precio !== "number" || precio <= 0) {
    res.status(400).json({
      success: false,
      message: "El precio debe ser un número positivo",
    });
    return;
  }

  if (!tipo || !Object.values(TipoPrecio).includes(tipo)) {
    res.status(400).json({
      success: false,
      message: "Tipo de precio inválido. Use 'proveedor' o 'mi_local'",
    });
    return;
  }

  next();
};

export const validarImagen = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { url } = req.body;

  if (!url || typeof url !== "string" || url.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "La URL de la imagen es requerida",
    });
    return;
  }

  next();
};
