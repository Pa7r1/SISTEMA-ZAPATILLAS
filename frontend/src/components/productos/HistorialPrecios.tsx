import { useHistorialPrecios } from "../../hooks/useProductos";

interface HistorialPreciosProps {
  productoId: number;
  productoNombre?: string;
}

export const HistorialPrecios = ({
  productoId,
  productoNombre,
}: HistorialPreciosProps) => {
  const { data: historial, isLoading, error } = useHistorialPrecios(productoId);

  if (isLoading) {
    return <div>Cargando historial...</div>;
  }

  if (error) {
    return <div>Error al cargar historial: {error.message}</div>;
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {productoNombre && (
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Historial de Precios</h3>
          <p className="text-sm text-gray-600">{productoNombre}</p>
        </div>
      )}

      {historial && historial.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Precio Anterior</th>
                <th className="px-4 py-2 text-left">Precio Nuevo</th>
                <th className="px-4 py-2 text-left">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((registro) => {
                const diferencia =
                  registro.precioNuevo - registro.precioAnterior;
                const porcentaje = (
                  (diferencia / registro.precioAnterior) *
                  100
                ).toFixed(2);

                return (
                  <tr key={registro.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      {formatFecha(registro.fecha)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {registro.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      ${registro.precioAnterior.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      ${registro.precioNuevo.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`font-semibold ${
                          diferencia > 0
                            ? "text-green-600"
                            : diferencia < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {diferencia > 0 ? "+" : ""}${diferencia.toFixed(2)} (
                        {porcentaje}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay cambios de precio registrados
        </div>
      )}

      <div className="text-sm text-gray-600">
        Total de cambios: {historial?.length || 0}
      </div>
    </div>
  );
};
