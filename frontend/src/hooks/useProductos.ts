import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productoService } from "../services/producto.service";
import type {
  CrearProductoDTO,
  ActualizarProductoDTO,
  AjustarStockDTO,
  CambiarPrecioDTO,
  AgregarImagenDTO,
  CargaMasivaDTO,
} from "../types/producto.types";

const QUERY_KEYS = {
  productos: ["productos"],
  producto: (id: number) => ["productos", id],
  busqueda: (termino: string) => ["productos", "busqueda", termino],
  proveedor: (id: number) => ["productos", "proveedor", id],
  stockBajo: (limite: number) => ["productos", "stock-bajo", limite],
  historialPrecios: (id: number) => ["productos", id, "precios"],
};

export const useProductos = () => {
  return useQuery({
    queryKey: QUERY_KEYS.productos,
    queryFn: productoService.obtenerTodos,
  });
};

export const useProducto = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.producto(id),
    queryFn: () => productoService.obtenerPorId(id),
    enabled: !!id,
  });
};

export const useBuscarProductos = (termino: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.busqueda(termino),
    queryFn: () => productoService.buscar(termino),
    enabled: termino.length >= 3,
  });
};

export const useProductosPorProveedor = (idProveedor: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.proveedor(idProveedor),
    queryFn: () => productoService.obtenerPorProveedor(idProveedor),
    enabled: !!idProveedor,
  });
};

export const useStockBajo = (limite: number = 5) => {
  return useQuery({
    queryKey: QUERY_KEYS.stockBajo(limite),
    queryFn: () => productoService.obtenerStockBajo(limite),
  });
};

export const useHistorialPrecios = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.historialPrecios(id),
    queryFn: () => productoService.obtenerHistorialPrecios(id),
    enabled: !!id,
  });
};

export const useCrearProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (producto: CrearProductoDTO) => productoService.crear(producto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
    },
  });
};

export const useActualizarProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarProductoDTO }) =>
      productoService.actualizar(id, datos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.producto(variables.id),
      });
    },
  });
};

export const useEliminarProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productoService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
    },
  });
};

export const useAjustarStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ajuste }: { id: number; ajuste: AjustarStockDTO }) =>
      productoService.ajustarStock(id, ajuste),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.producto(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockBajo(5) });
    },
  });
};

export const useCambiarPrecio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cambio }: { id: number; cambio: CambiarPrecioDTO }) =>
      productoService.cambiarPrecio(id, cambio),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.producto(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.historialPrecios(variables.id),
      });
    },
  });
};

export const useAgregarImagen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, imagen }: { id: number; imagen: AgregarImagenDTO }) =>
      productoService.agregarImagen(id, imagen),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.producto(variables.id),
      });
    },
  });
};

export const useCargaMasiva = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CargaMasivaDTO) => productoService.cargaMasiva(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
    },
  });
};

export const useCargarArchivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      archivo,
      config,
    }: {
      archivo: File;
      config: {
        idProveedor?: number;
        aumentoPorcentaje?: number;
        stockPorDefecto?: number;
      };
    }) => productoService.cargarArchivo(archivo, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
    },
  });
};
