import { api } from "../lib/api";
import type {
  Producto,
  CrearProductoDTO,
  ActualizarProductoDTO,
  AjustarStockDTO,
  CambiarPrecioDTO,
  AgregarImagenDTO,
  CargaMasivaDTO,
  ResultadoCargaMasiva,
  HistorialPrecio,
  ImagenProducto,
} from "../types/producto.types";

const BASE_URL = "/productos";

export const productoService = {
  // CRUD básico
  obtenerTodos: async (): Promise<Producto[]> => {
    const { data } = await api.get(`${BASE_URL}`);
    return data.data;
  },

  obtenerPorId: async (id: number): Promise<Producto> => {
    const { data } = await api.get(`${BASE_URL}/${id}`);
    return data.data;
  },

  crear: async (producto: CrearProductoDTO): Promise<Producto> => {
    const { data } = await api.post(`${BASE_URL}`, producto);
    return data.data;
  },

  actualizar: async (
    id: number,
    producto: ActualizarProductoDTO
  ): Promise<Producto> => {
    const { data } = await api.put(`${BASE_URL}/${id}`, producto);
    return data.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Búsqueda
  buscar: async (termino: string): Promise<Producto[]> => {
    const { data } = await api.get(`${BASE_URL}/buscar`, {
      params: { q: termino },
    });
    return data.data;
  },

  // Por proveedor
  obtenerPorProveedor: async (idProveedor: number): Promise<Producto[]> => {
    const { data } = await api.get(`${BASE_URL}/proveedor/${idProveedor}`);
    return data.data;
  },

  // Stock
  obtenerStockBajo: async (limite: number = 5): Promise<Producto[]> => {
    const { data } = await api.get(`${BASE_URL}/stock/minimo`, {
      params: { limite },
    });
    return data.data;
  },

  ajustarStock: async (id: number, ajuste: AjustarStockDTO): Promise<void> => {
    await api.put(`${BASE_URL}/${id}/stock`, ajuste);
  },

  // Precios
  obtenerHistorialPrecios: async (id: number): Promise<HistorialPrecio[]> => {
    const { data } = await api.get(`${BASE_URL}/${id}/precios`);
    return data.data;
  },

  cambiarPrecio: async (
    id: number,
    cambio: CambiarPrecioDTO
  ): Promise<void> => {
    await api.put(`${BASE_URL}/${id}/precio`, cambio);
  },

  // Imágenes
  agregarImagen: async (
    id: number,
    imagen: AgregarImagenDTO
  ): Promise<ImagenProducto> => {
    const { data } = await api.post(`${BASE_URL}/${id}/imagen`, imagen);
    return data.data;
  },

  // Carga masiva
  cargaMasiva: async (
    datos: CargaMasivaDTO
  ): Promise<{ resultados: ResultadoCargaMasiva; resumen: any }> => {
    const { data } = await api.post(`${BASE_URL}/carga-masiva`, datos);
    return { resultados: data.resultados, resumen: data.resumen };
  },

  cargarArchivo: async (
    archivo: File,
    config: {
      idProveedor?: number;
      aumentoPorcentaje?: number;
      stockPorDefecto?: number;
    }
  ): Promise<{ resultados: ResultadoCargaMasiva; resumen: any }> => {
    const formData = new FormData();
    formData.append("archivo", archivo);

    if (config.idProveedor) {
      formData.append("idProveedor", config.idProveedor.toString());
    }
    if (config.aumentoPorcentaje) {
      formData.append("aumentoPorcentaje", config.aumentoPorcentaje.toString());
    }
    if (config.stockPorDefecto) {
      formData.append("stockPorDefecto", config.stockPorDefecto.toString());
    }

    const { data } = await api.post(`${BASE_URL}/cargar-archivo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return { resultados: data.resultados, resumen: data.resumen };
  },
};
