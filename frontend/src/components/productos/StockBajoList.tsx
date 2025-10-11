import { useState } from "react";
import { useStockBajo } from "../../hooks/useProductos";
import { formatPrecio } from "../../utils/general.utils";

interface StockBajoListProps {
  onAjustarStock?: (productoId: number) => void;
}

export const StockBajoList = ({ onAjustarStock }: StockBajoListProps) => {
  const [limite, setLimite] = useState(5);
  const { data: productos, isLoading, error } = useStockBajo(limite);

  if (isLoading) {
    return <div>Cargando productos con stock bajo...</div>;
  }

  if (error) {
    return <div>Error al cargar productos: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="font-medium">Límite de stock:</label>
        <select
          value={limite}
          onChange={(e) => setLimite(Number(e.target.value))}
          className="px-3 py-2 border rounded"
        >
          <option value={5}>5 unidades</option>
          <option value={10}>10 unidades</option>
          <option value={15}>15 unidades</option>
          <option value={20}>20 unidades</option>
        </select>
      </div>

      {productos && productos.length > 0 ? (
        <div className="space-y-3">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className="p-4 border rounded flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <h3 className="font-semibold">{producto.nombre}</h3>
                <p className="text-sm text-gray-600">
                  Stock actual:{" "}
                  <span className="font-bold text-red-600">
                    {producto.stockActual}
                  </span>
                  {producto.stockMinimo && (
                    <span className="ml-2">
                      (Mínimo: {producto.stockMinimo})
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Precio: ${formatPrecio(producto.precioMiLocal)}
                </p>
              </div>
              {onAjustarStock && (
                <button
                  onClick={() => onAjustarStock(producto.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Ajustar Stock
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay productos con stock bajo
        </div>
      )}

      <div className="text-sm text-gray-600">
        Total: {productos?.length || 0} productos con stock bajo
      </div>
    </div>
  );
};
