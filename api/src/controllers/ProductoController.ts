import { Request, Response } from "express";
import { ProductoService } from "../services/ProductoService.js";
import { asyncHandler, createError } from "../utils/errorHandlers.js";
import { Controller } from "../types/controller.types.js";
import { uploadJSON } from "../utils/uploadMiddleware.js";
import {
  validarId,
  validarActualizarProducto,
  validarAjustarStock,
  validarCambioPrecio,
  validarCargaMasiva,
  validarCrearProducto,
  validarImagen,
} from "../utils/productoMiddleware.js";
import {
  parsePrecioFromCatalog,
  normalizeProductName,
} from "../helpers/helpersProducto.js";

const productoService = new ProductoService();

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

const eliminarTodosProductos = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await productoService.eliminarTodos();

    res.status(200).json({
      success: true,
      message: resultado.mensaje,
      data: {
        eliminados: resultado.eliminados,
      },
    });
  }
);

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
  deleteAll: eliminarTodosProductos,
};

export default productosController;
