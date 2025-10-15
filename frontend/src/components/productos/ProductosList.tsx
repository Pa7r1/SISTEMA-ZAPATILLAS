import { useState } from "react";
import {
  useProductos,
  useEliminarProducto,
  useEliminarTodos,
} from "../../hooks/useProductos";
import { formatPrecio } from "../../utils/general.utils";
import type { Producto } from "../../types/producto.types";

interface ProductosListProps {
  onEdit?: (producto: Producto) => void;
  onViewDetails?: (producto: Producto) => void;
}

export const ProductosList = ({
  onEdit,
  onViewDetails,
}: ProductosListProps) => {
  const { data: productos, isLoading, error } = useProductos();
  const eliminarMutation = useEliminarProducto();
  const eliminarTodosMutation = useEliminarTodos();
  const [busqueda, setBusqueda] = useState("");

  const handleEliminar = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await eliminarMutation.mutateAsync(id);
        alert("Producto eliminado exitosamente");
      } catch (error) {
        alert("Error al eliminar el producto");
      }
    }
  };

  const handleEliminarTodo = async () => {
    if (window.confirm("¿Seguro de eliminar todos los productos?")) {
      try {
        await eliminarTodosMutation.mutateAsync();
        alert("Todos los productos fueron eliminados exitosamente");
      } catch (error) {
        alert("Error al eliminar todos los productos");
      }
    }
  };

  const productosFiltrados = productos?.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (isLoading) {
    return <div>Cargando productos...</div>;
  }

  if (error) {
    return <div>Error al cargar productos: {error.message}</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Precio Proveedor</th>
              <th className="px-4 py-2 text-left">Precio Venta</th>
              <th className="px-4 py-2 text-left">Stock</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados?.map((producto) => (
              <tr key={producto.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{producto.id}</td>
                <td className="px-4 py-2">{producto.nombre}</td>
                <td className="px-4 py-2">
                  ${formatPrecio(producto.precioProveedor)}
                </td>
                <td className="px-4 py-2">
                  ${formatPrecio(producto.precioMiLocal)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      producto.stockActual < (producto.stockMinimo || 5)
                        ? "text-red-600 font-bold"
                        : ""
                    }
                  >
                    {producto.stockActual}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      producto.activo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {producto.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(producto)}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Ver
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(producto)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminar(producto.id)}
                      disabled={eliminarMutation.isPending}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {productosFiltrados?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron productos
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {productosFiltrados?.length || 0} productos
        <button
          onClick={handleEliminarTodo}
          disabled={eliminarTodosMutation.isPending}
          className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Eliminar todos los productos
        </button>
      </div>
    </div>
  );
};
