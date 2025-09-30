import { useProductos } from "../../hooks/useProductos";
import {
  generarResumenProductos,
  formatearPrecio,
} from "../../utils/producto.utils";

export const ProductosStats = () => {
  const { data: productos, isLoading } = useProductos();

  if (isLoading) {
    return <div>Cargando estadísticas...</div>;
  }

  if (!productos || productos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No hay productos para mostrar estadísticas
      </div>
    );
  }

  const resumen = generarResumenProductos(productos);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-6 bg-white border rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Total Productos</div>
        <div className="text-3xl font-bold">{resumen.total}</div>
        <div className="text-sm text-gray-500 mt-2">
          {resumen.activos} activos / {resumen.inactivos} inactivos
        </div>
      </div>

      <div className="p-6 bg-white border rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Stock Bajo</div>
        <div className="text-3xl font-bold text-red-600">
          {resumen.stockBajo}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {resumen.stockBajo > 0 ? "Requieren atención" : "Todo en orden"}
        </div>
      </div>

      <div className="p-6 bg-white border rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Valor Inventario</div>
        <div className="text-2xl font-bold">
          {formatearPrecio(resumen.valorTotalInventario)}
        </div>
        <div className="text-sm text-gray-500 mt-2">Costo total</div>
      </div>

      <div className="p-6 bg-white border rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Valor Venta</div>
        <div className="text-2xl font-bold text-green-600">
          {formatearPrecio(resumen.valorTotalVenta)}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Ganancia: {formatearPrecio(resumen.gananciaEstimada)}
        </div>
      </div>
    </div>
  );
};
