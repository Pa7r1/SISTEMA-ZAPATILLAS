import { Request, Response, NextFunction } from "express";
import { ProductoService } from "../services/ProductoService.js";
import { TipoPrecio } from "../entities/HistorialPrecio.js";
import { asyncHandler, createError } from "../utils/errorHandlers.js";
import { Controller } from "../types/controller.types.js";
import { uploadJSON } from "../utils/uploadMiddleware.js";

const productoService = new ProductoService();

// Helper para parsear precios desde formato de catálogo
const parsePrecioFromCatalog = (precioStr: string): number => {
  if (!precioStr || precioStr.toLowerCase().includes("sin precio")) {
    throw new Error("Precio inválido");
  }

  const precioTexto = precioStr.replace(/[^\d,\.]/g, "");
  let valorNumerico = NaN;

  if (precioTexto.includes(",") && precioTexto.includes(".")) {
    if (precioTexto.indexOf(",") > precioTexto.indexOf(".")) {
      valorNumerico = parseFloat(
        precioTexto.replace(/\./g, "").replace(",", ".")
      );
    } else {
      valorNumerico = parseFloat(precioTexto.replace(/,/g, ""));
    }
  } else if (precioTexto.includes(",")) {
    const partes = precioTexto.split(",");
    if (partes[1]?.length === 2) {
      valorNumerico = parseFloat(precioTexto.replace(",", "."));
    } else {
      valorNumerico = parseFloat(precioTexto.replace(/,/g, ""));
    }
  } else {
    valorNumerico = parseFloat(precioTexto.replace(/\./g, ""));
  }

  if (isNaN(valorNumerico) || valorNumerico < 100) {
    throw new Error("Precio demasiado bajo o inválido");
  }

  return Math.round(valorNumerico * 100) / 100; // Redondear a 2 decimales
};

// Helper para normalizar nombres para detectar duplicados
const normalizeProductName = (nombre: string): string => {
  return nombre
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");
};

// Handlers del controlador
const obtenerTodosProductos = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const productos = await productoService.obtenerTodos();

    res.status(200).json({
      success: true,
      data: productos,
      total: productos.length,
    });
  }
);

const cargaMasivaProductos = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      productos,
      idProveedor = 1,
      aumentoPorcentaje = 0,
      stockPorDefecto = 1,
    } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
      throw createError("Se requiere un array de productos", 400);
    }

    const resultados = {
      procesados: 0,
      creados: 0,
      errores: 0,
      duplicados: 0,
      detalles: [] as any[],
    };

    const productosExistentes = await productoService.obtenerTodos();
    const nombresExistentes = new Set(
      productosExistentes.map((p) => normalizeProductName(p.nombre))
    );

    for (const [index, producto] of productos.entries()) {
      resultados.procesados++;

      try {
        const { nombre, descripcion, precio } = producto;

        if (!nombre || !precio) {
          throw new Error("Nombre y precio son requeridos");
        }

        // Verificar duplicados
        const nombreNormalizado = normalizeProductName(nombre);
        if (nombresExistentes.has(nombreNormalizado)) {
          resultados.duplicados++;
          resultados.detalles.push({
            index: index + 1,
            nombre: nombre,
            estado: "duplicado",
            mensaje: "Producto ya existe con nombre similar",
          });
          continue;
        }

        // Parsear y ajustar precio
        let precioNumerico: number;
        try {
          precioNumerico = parsePrecioFromCatalog(precio);

          // Aplicar aumento si se especifica
          if (aumentoPorcentaje > 0) {
            precioNumerico = precioNumerico * (1 + aumentoPorcentaje / 100);
            precioNumerico = Math.round(precioNumerico * 100) / 100;
          }
        } catch (error) {
          throw new Error(
            `Error parseando precio "${precio}": ${error instanceof Error ? error.message : "Error desconocido"}`
          );
        }

        // Limpiar descripción
        const descripcionLimpia = descripcion
          ? descripcion
              .replace(/(?:\*{2}.*?\*{2}|\*{1,2})/g, "") // Remover ** texto **
              .replace(/[\r\n]+/g, " ") // Reemplazar saltos de línea con espacios
              .trim()
          : null;

        // Crear producto
        const nuevoProducto = await productoService.crear({
          idProveedor: idProveedor,
          nombre: nombre.trim(),
          descripcion: descripcionLimpia,
          precioProveedor: precioNumerico * 0.7, // Precio proveedor estimado (30% menos)
          precioMiLocal: precioNumerico,
          stockActual: stockPorDefecto,
        });

        resultados.creados++;
        nombresExistentes.add(nombreNormalizado); // Agregar para evitar duplicados en el mismo lote

        resultados.detalles.push({
          index: index + 1,
          nombre: nombre,
          estado: "creado",
          id: nuevoProducto.id,
          precioFinal: precioNumerico,
        });
      } catch (error) {
        resultados.errores++;
        resultados.detalles.push({
          index: index + 1,
          nombre: producto.nombre || "Nombre no disponible",
          estado: "error",
          mensaje: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Carga masiva completada",
      resultados,
      resumen: {
        total: resultados.procesados,
        exitosos: resultados.creados,
        errores: resultados.errores,
        duplicados: resultados.duplicados,
        porcentajeExito: Math.round(
          (resultados.creados / resultados.procesados) * 100
        ),
      },
    });
  }
);

const cargaMasivaDesdeArchivo = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw createError("No subio archivos", 400);
    }
    try {
      const contenidoArchivo = req.file.buffer.toString("utf-8");
      const datosJSON = JSON.parse(contenidoArchivo);

      const idProveedor = req.body.idProveedor
        ? parseInt(req.body.idProveedor)
        : 1;
      const aumentoPorcentaje = req.body.aumentoPorcentaje
        ? parseFloat(req.body.aumentoPorcentaje)
        : 0;
      const stockPorDefecto = req.body.stockPorDefecto
        ? parseInt(req.body.stockPorDefecto)
        : 1;

      let productos = [];

      if (Array.isArray(datosJSON)) {
        productos = datosJSON;
      } else if (datosJSON.productos && Array.isArray(datosJSON.productos)) {
        productos = datosJSON.productos;
      } else {
        throw new Error(
          "Formato de archivo inválido. Se esperaba un array de productos."
        );
      }

      if (productos.length === 0) {
        throw createError("El archivo no contiene productos válidos", 400);
      }

      if (productos.length > 1000) {
        throw createError("Máximo 1000 productos por carga", 400);
      }

      const resultados = {
        procesados: 0,
        creados: 0,
        errores: 0,
        duplicados: 0,
        detalles: [] as any[],
      };

      const productosExistentes = await productoService.obtenerTodos();
      const nombresExistentes = new Set(
        productosExistentes.map((p) => normalizeProductName(p.nombre))
      );

      for (const [index, producto] of productos.entries()) {
        resultados.procesados++;

        try {
          const { nombre, descripcion, precio } = producto;

          if (!nombre || !precio) {
            throw new Error("Nombre y precio son requeridos");
          }

          const nombreNormalizado = normalizeProductName(nombre);
          if (nombresExistentes.has(nombreNormalizado)) {
            resultados.duplicados++;
            resultados.detalles.push({
              index: index + 1,
              nombre: nombre,
              estado: "duplicado",
              mensaje: "Producto ya existe con nombre similar",
            });
            continue;
          }

          let precioNumerico: number;

          try {
            precioNumerico = parsePrecioFromCatalog(precio);

            if (aumentoPorcentaje > 0) {
              precioNumerico = precioNumerico * (1 + aumentoPorcentaje / 100);
              precioNumerico = Math.round(precioNumerico * 100) / 100;
            }
          } catch (error) {
            throw new Error(
              `Error parseando el precio "${precio}": ${error instanceof Error ? error.message : "Error desconocido"}`
            );
          }

          const descripcionLimpia = descripcion
            ? descripcion
                .replace(/(?:\*{2}.*?\*{2}|\*{1,2})/g, "") // Remover ** texto **
                .replace(/[\r\n]+/g, " ") // Reemplazar saltos de línea con espacios
                .trim()
            : null;

          const nuevoProducto = await productoService.crear({
            idProveedor: idProveedor,
            nombre: nombre.trim(),
            descripcion: descripcionLimpia,
            precioProveedor: precioNumerico * 0.7, // Precio proveedor estimado (30% menos)
            precioMiLocal: precioNumerico,
            stockActual: stockPorDefecto,
          });

          resultados.creados++;
          nombresExistentes.add(nombreNormalizado);

          resultados.detalles.push({
            index: index + 1,
            nombre: nombre,
            estado: "creado",
            id: nuevoProducto.id,
            precioFinal: precioNumerico,
          });
        } catch (error) {
          resultados.errores++;
          resultados.detalles.push({
            index: index + 1,
            nombre: producto.nombre || "Nombre no disponible",
            estado: "error",
            mensaje:
              error instanceof Error ? error.message : "Error desconocido",
          });
        }
      }
      res.status(200).json({
        success: true,
        message: "Carga masiva desde archivo completada",
        archivo: {
          nombre: req.file.originalname,
          tamaño: req.file.size,
          productosEncontrados: productos.length,
        },
        configuracion: {
          idProveedor,
          aumentoPorcentaje,
          stockPorDefecto,
        },
        resultados,
        resumen: {
          total: resultados.procesados,
          exitosos: resultados.creados,
          errores: resultados.errores,
          duplicados: resultados.duplicados,
          porcentajeExito: Math.round(
            (resultados.creados / resultados.procesados) * 100
          ),
        },
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw createError("Archivo json invalido", 400);
      }
      throw error;
    }
  }
);

const obtenerProductoPorId = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw createError("ID es requerido", 400);
    }

    const producto = await productoService.obtenerPorId(parseInt(id));

    if (!producto) {
      throw createError("Producto no encontrado", 404);
    }

    res.status(200).json({
      success: true,
      data: producto,
    });
  }
);

const crearProducto = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const datosProducto = req.body;
    const nuevoProducto = await productoService.crear(datosProducto);

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: nuevoProducto,
    });
  }
);

const actualizarProducto = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const productoActualizado = await productoService.actualizar(
      parseInt(id!),
      datosActualizacion
    );

    res.status(200).json({
      success: true,
      message: "Producto actualizado exitosamente",
      data: productoActualizado,
    });
  }
);

const eliminarProducto = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw createError("ID es requerido", 400);
    }

    await productoService.eliminar(parseInt(id));

    res.status(200).json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  }
);

const buscarProductos = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { q: termino } = req.query;

    if (!termino || typeof termino !== "string") {
      throw createError("Término de búsqueda requerido", 400);
    }

    const productos = await productoService.buscarPorNombre(termino);

    res.status(200).json({
      success: true,
      data: productos,
      total: productos.length,
      termino,
    });
  }
);

const obtenerPorProveedor = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { idProveedor } = req.params;
    const productos = await productoService.obtenerPorProveedor(
      parseInt(idProveedor!)
    );

    res.status(200).json({
      success: true,
      data: productos,
      total: productos.length,
    });
  }
);

const obtenerStockBajo = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { limite } = req.query;
    const limiteParsed = limite ? parseInt(limite as string) : 5;

    const productos = await productoService.obtenerConStockBajo(limiteParsed);

    res.status(200).json({
      success: true,
      data: productos,
      total: productos.length,
      limite: limiteParsed,
      message: "Productos con stock bajo",
    });
  }
);

const ajustarStock = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;

    if (!id) {
      throw createError("ID es requerido", 400);
    }

    await productoService.ajustarStock(parseInt(id), cantidad, motivo);

    res.status(200).json({
      success: true,
      message: "Stock ajustado exitosamente",
    });
  }
);

const obtenerHistorialPrecios = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const historial = await productoService.obtenerHistorialPrecios(
      parseInt(id!)
    );

    res.status(200).json({
      success: true,
      data: historial,
      total: historial.length,
    });
  }
);

const cambiarPrecio = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { precio, tipo } = req.body;

    if (!id) {
      throw createError("ID es requerido", 400);
    }

    await productoService.registrarCambioPrecio(parseInt(id), precio, tipo);

    res.status(200).json({
      success: true,
      message: "Precio actualizado exitosamente",
    });
  }
);

const agregarImagen = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { url } = req.body;

    if (!id) {
      throw createError("ID es requerido", 400);
    }

    const imagen = await productoService.agregarImagen(parseInt(id), url);

    res.status(201).json({
      success: true,
      message: "Imagen agregada exitosamente",
      data: imagen,
    });
  }
);

// Middleware de validaciones
const validarId = (req: Request, res: Response, next: NextFunction): void => {
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

const validarCargaMasiva = (
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

const validarCrearProducto = (
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

const validarActualizarProducto = (
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

const validarAjustarStock = (
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

const validarCambioPrecio = (
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

const validarImagen = (
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

// Exportar controlador siguiendo el patrón
const productosController: Controller = {
  name: "productos",

  // Métodos CRUD estándar
  index: obtenerTodosProductos,
  show: [validarId, obtenerProductoPorId],
  create: [validarCrearProducto, crearProducto],
  update: [validarId, validarActualizarProducto, actualizarProducto],
  delete: [validarId, eliminarProducto],
  search: buscarProductos,

  // Métodos personalizados
  stockMinimo: obtenerStockBajo,
  proveedor: [validarId, obtenerPorProveedor],
  ajustarStock: [validarId, validarAjustarStock, ajustarStock],
  historialPrecios: [validarId, obtenerHistorialPrecios],
  cambiarPrecio: [validarId, validarCambioPrecio, cambiarPrecio],
  agregarImagen: [validarId, validarImagen, agregarImagen],
  cargaMasiva: [validarCargaMasiva, cargaMasivaProductos],
  cargarArchivo: [uploadJSON, cargaMasivaDesdeArchivo],
};

export default productosController;
