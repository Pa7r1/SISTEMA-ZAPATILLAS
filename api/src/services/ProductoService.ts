import { Repository, EntityManager } from "typeorm";
import { AppDataSource } from "../data-source.js";
import { Producto } from "../entities/Producto.js";
import { HistorialPrecio, TipoPrecio } from "../entities/HistorialPrecio.js";
import { ImagenProducto } from "../entities/ImagenProducto.js";
import {
  StockMovimiento,
  TipoMovimiento,
  OrigenMovimiento,
} from "../entities/StockMovimiento.js";

export interface IProductoService {
  obtenerTodos(): Promise<Producto[]>;
  obtenerPorId(id: number): Promise<Producto | null>;
  obtenerPorProveedor(idProveedor: number): Promise<Producto[]>;
  buscarPorNombre(nombre: string): Promise<Producto[]>;
  crear(data: CrearProductoDto): Promise<Producto>;
  actualizar(id: number, data: ActualizarProductoDto): Promise<Producto>;
  eliminar(id: number): Promise<void>;
  ajustarStock(id: number, cantidad: number, motivo: string): Promise<void>;
  registrarCambioPrecio(
    id: number,
    precio: number,
    tipo: TipoPrecio
  ): Promise<void>;
  obtenerConStockBajo(limite?: number): Promise<Producto[]>;
  obtenerHistorialPrecios(id: number): Promise<HistorialPrecio[]>;
  agregarImagen(id: number, url: string): Promise<ImagenProducto>;
}

export interface CrearProductoDto {
  idProveedor: number;
  nombre: string;
  descripcion?: string;
  precioProveedor: number;
  precioMiLocal: number;
  stockActual?: number;
}

export interface ActualizarProductoDto {
  nombre?: string;
  descripcion?: string;
  precioProveedor?: number;
  precioMiLocal?: number;
}

export class ProductoService implements IProductoService {
  private productoRepository: Repository<Producto>;
  private historialPrecioRepository: Repository<HistorialPrecio>;
  private imagenProductoRepository: Repository<ImagenProducto>;
  private stockMovimientoRepository: Repository<StockMovimiento>;

  constructor() {
    this.productoRepository = AppDataSource.getRepository(Producto);
    this.historialPrecioRepository =
      AppDataSource.getRepository(HistorialPrecio);
    this.imagenProductoRepository = AppDataSource.getRepository(ImagenProducto);
    this.stockMovimientoRepository =
      AppDataSource.getRepository(StockMovimiento);
  }

  async obtenerTodos(): Promise<Producto[]> {
    try {
      return await this.productoRepository.find({
        relations: {
          proveedor: true,
          imagenes: true,
        },
        order: { fechaAgregado: "DESC" },
      });
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      throw new Error("Error al obtener productos");
    }
  }

  async obtenerPorId(id: number): Promise<Producto | null> {
    try {
      const producto = await this.productoRepository.findOne({
        where: { id },
        relations: {
          proveedor: true,
          imagenes: true,
          historialPrecios: true,
        },
      });

      // Movimientos ordenados por fecha
      if (producto) {
        const movimientos = await this.stockMovimientoRepository.find({
          where: { idProducto: id },
          order: { fecha: "DESC" },
          take: 10,
        });
        (producto as any).movimientosStock = movimientos;
      }

      return producto;
    } catch (error) {
      console.error(`Error obteniendo producto ${id}:`, error);
      throw new Error("Error al obtener producto");
    }
  }

  async obtenerPorProveedor(idProveedor: number): Promise<Producto[]> {
    try {
      return await this.productoRepository.find({
        where: { idProveedor },
        relations: {
          proveedor: true,
          imagenes: true,
        },
        order: { nombre: "ASC" },
      });
    } catch (error) {
      console.error(
        `Error obteniendo productos del proveedor ${idProveedor}:`,
        error
      );
      throw new Error("Error al obtener productos por proveedor");
    }
  }

  async buscarPorNombre(nombre: string): Promise<Producto[]> {
    try {
      return await this.productoRepository
        .createQueryBuilder("producto")
        .leftJoinAndSelect("producto.proveedor", "proveedor")
        .leftJoinAndSelect("producto.imagenes", "imagenes")
        .where("producto.nombre LIKE :nombre", { nombre: `%${nombre}%` })
        .orWhere("producto.descripcion LIKE :nombre", {
          nombre: `%${nombre}%`,
        })
        .orderBy("producto.nombre", "ASC")
        .getMany();
    } catch (error) {
      console.error(`Error buscando productos con nombre ${nombre}:`, error);
      throw new Error("Error al buscar productos");
    }
  }

  async crear(data: CrearProductoDto): Promise<Producto> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear el producto
      const nuevoProducto = this.productoRepository.create({
        idProveedor: data.idProveedor,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        precioProveedor: data.precioProveedor,
        precioMiLocal: data.precioMiLocal,
        stockActual: data.stockActual || 0,
      });

      const productoGuardado = await queryRunner.manager.save(
        Producto,
        nuevoProducto
      );

      // Registrar precios iniciales en historial
      await this.crearHistorialPrecio(
        queryRunner.manager,
        productoGuardado.id,
        data.precioProveedor,
        TipoPrecio.PROVEEDOR
      );
      await this.crearHistorialPrecio(
        queryRunner.manager,
        productoGuardado.id,
        data.precioMiLocal,
        TipoPrecio.MI_LOCAL
      );

      // Si tiene stock inicial, registrar movimiento
      if (data.stockActual && data.stockActual > 0) {
        await this.crearMovimientoStock(
          queryRunner.manager,
          productoGuardado.id,
          TipoMovimiento.ENTRADA,
          data.stockActual,
          "Stock inicial",
          OrigenMovimiento.AJUSTE_MANUAL
        );
      }

      await queryRunner.commitTransaction();

      // Retornar producto con relaciones
      return (await this.obtenerPorId(productoGuardado.id)) as Producto;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error creando producto:", error);
      throw new Error("Error al crear producto");
    } finally {
      await queryRunner.release();
    }
  }

  async actualizar(id: number, data: ActualizarProductoDto): Promise<Producto> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el producto existe
      const productoExistente = await this.productoRepository.findOne({
        where: { id },
      });
      if (!productoExistente) {
        throw new Error("Producto no encontrado");
      }

      // Preparar datos de actualización
      const datosActualizacion: any = {};
      if (data.nombre !== undefined) datosActualizacion.nombre = data.nombre;
      if (data.descripcion !== undefined)
        datosActualizacion.descripcion = data.descripcion ?? null;
      if (data.precioProveedor !== undefined)
        datosActualizacion.precioProveedor = data.precioProveedor;
      if (data.precioMiLocal !== undefined)
        datosActualizacion.precioMiLocal = data.precioMiLocal;

      // Actualizar producto
      await queryRunner.manager.update(Producto, id, datosActualizacion);

      // Registrar cambios de precio en historial
      if (
        data.precioProveedor !== undefined &&
        data.precioProveedor !== productoExistente.precioProveedor
      ) {
        await this.crearHistorialPrecio(
          queryRunner.manager,
          id,
          data.precioProveedor,
          TipoPrecio.PROVEEDOR
        );
      }

      if (
        data.precioMiLocal !== undefined &&
        data.precioMiLocal !== productoExistente.precioMiLocal
      ) {
        await this.crearHistorialPrecio(
          queryRunner.manager,
          id,
          data.precioMiLocal,
          TipoPrecio.MI_LOCAL
        );
      }

      await queryRunner.commitTransaction();

      // Retornar producto actualizado
      return (await this.obtenerPorId(id)) as Producto;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Error actualizando producto ${id}:`, error);
      throw new Error("Error al actualizar producto");
    } finally {
      await queryRunner.release();
    }
  }

  async eliminar(id: number): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el producto existe
      const producto = await this.productoRepository.findOne({
        where: { id },
      });

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      // Verificar si tiene registros relacionados con lazy loading
      const detallesVenta = await queryRunner.manager.query(
        "SELECT COUNT(*) as count FROM detalle_venta_local WHERE id_producto = ?",
        [id]
      );
      const detallesCompra = await queryRunner.manager.query(
        "SELECT COUNT(*) as count FROM detalle_compra_mayorista WHERE id_producto = ?",
        [id]
      );
      const detallesEncargue = await queryRunner.manager.query(
        "SELECT COUNT(*) as count FROM detalle_encargue_proveedor WHERE id_producto = ?",
        [id]
      );

      const tieneVentas = detallesVenta[0].count > 0;
      const tieneCompras = detallesCompra[0].count > 0;
      const tieneEncargues = detallesEncargue[0].count > 0;

      if (tieneVentas || tieneCompras || tieneEncargues) {
        throw new Error(
          "No se puede eliminar el producto: tiene transacciones asociadas"
        );
      }

      // Eliminar registros relacionados primero (cascada manual si es necesario)
      await queryRunner.manager.delete(HistorialPrecio, { idProducto: id });
      await queryRunner.manager.delete(ImagenProducto, { idProducto: id });
      await queryRunner.manager.delete(StockMovimiento, { idProducto: id });

      // Eliminar el producto
      await queryRunner.manager.delete(Producto, id);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Error eliminando producto ${id}:`, error);

      if (
        error instanceof Error &&
        error.message.includes("transacciones asociadas")
      ) {
        throw error;
      }
      throw new Error("Error al eliminar producto");
    } finally {
      await queryRunner.release();
    }
  }

  async ajustarStock(
    id: number,
    cantidad: number,
    motivo: string
  ): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener producto actual
      const producto = await this.productoRepository.findOne({ where: { id } });
      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      // Calcular nuevo stock
      const nuevoStock = producto.stockActual + cantidad;
      if (nuevoStock < 0) {
        throw new Error("El ajuste resultaría en stock negativo");
      }

      // Actualizar stock
      await queryRunner.manager.update(Producto, id, {
        stockActual: nuevoStock,
      });

      // Registrar movimiento
      const tipoMovimiento =
        cantidad > 0 ? TipoMovimiento.ENTRADA : TipoMovimiento.SALIDA;
      await this.crearMovimientoStock(
        queryRunner.manager,
        id,
        tipoMovimiento,
        Math.abs(cantidad),
        motivo,
        OrigenMovimiento.AJUSTE_MANUAL
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Error ajustando stock del producto ${id}:`, error);
      throw new Error("Error al ajustar stock");
    } finally {
      await queryRunner.release();
    }
  }

  async registrarCambioPrecio(
    id: number,
    precio: number,
    tipo: TipoPrecio
  ): Promise<void> {
    try {
      const historial = this.historialPrecioRepository.create({
        idProducto: id,
        precio,
        tipo,
      });

      await this.historialPrecioRepository.save(historial);
    } catch (error) {
      console.error(
        `Error registrando cambio de precio para producto ${id}:`,
        error
      );
      throw new Error("Error al registrar cambio de precio");
    }
  }

  async obtenerConStockBajo(limite: number = 5): Promise<Producto[]> {
    try {
      return await this.productoRepository
        .createQueryBuilder("producto")
        .leftJoinAndSelect("producto.proveedor", "proveedor")
        .where("producto.stockActual <= :limite", { limite })
        .orderBy("producto.stockActual", "ASC")
        .getMany();
    } catch (error) {
      console.error("Error obteniendo productos con stock bajo:", error);
      throw new Error("Error al obtener productos con stock bajo");
    }
  }

  async obtenerHistorialPrecios(id: number): Promise<HistorialPrecio[]> {
    try {
      return await this.historialPrecioRepository.find({
        where: { idProducto: id },
        order: { fechaCambio: "DESC" },
      });
    } catch (error) {
      console.error(
        `Error obteniendo historial de precios para producto ${id}:`,
        error
      );
      throw new Error("Error al obtener historial de precios");
    }
  }

  async agregarImagen(id: number, url: string): Promise<ImagenProducto> {
    try {
      // Verificar que el producto existe
      const producto = await this.productoRepository.findOne({ where: { id } });
      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      const imagen = this.imagenProductoRepository.create({
        idProducto: id,
        url,
      });

      return await this.imagenProductoRepository.save(imagen);
    } catch (error) {
      console.error(`Error agregando imagen al producto ${id}:`, error);
      throw new Error("Error al agregar imagen");
    }
  }

  // Métodos auxiliares privados
  private async crearHistorialPrecio(
    manager: EntityManager,
    productoId: number,
    precio: number,
    tipo: TipoPrecio
  ): Promise<void> {
    const historial = manager.create(HistorialPrecio, {
      idProducto: productoId,
      precio,
      tipo,
    });
    await manager.save(HistorialPrecio, historial);
  }

  private async crearMovimientoStock(
    manager: EntityManager,
    productoId: number,
    tipo: TipoMovimiento,
    cantidad: number,
    motivo: string,
    origen: OrigenMovimiento,
    referenciaId?: number
  ): Promise<void> {
    const movimiento = manager.create(StockMovimiento, {
      idProducto: productoId,
      tipo,
      cantidad,
      motivo,
      origen,
      referenciaId: referenciaId ?? null,
    });
    await manager.save(StockMovimiento, movimiento);
  }
}
