import { useHistorialPrecios } from "../../hooks/useProductos";
import { formatPrecio } from "../../utils/general.utils";

interface HistorialPreciosProps {
  productoId: number;
  productoNombre?: string;
}

interface HistorialPrecioAPI {
  id: number;
  idProducto: number;
  precio: string | number;
  fechaCambio: string | Date;
  tipo: string;
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

  const formatFecha = (fecha: string | Date) => {
    return new Date(fecha).toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const registros: HistorialPrecioAPI[] = (historial as any) || [];

  const historialPorTipo = registros.reduce((acc, registro) => {
    const tipo = registro.tipo || "sin_tipo";
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(registro);
    return acc;
  }, {} as Record<string, HistorialPrecioAPI[]>);

  Object.keys(historialPorTipo).forEach((tipo) => {
    historialPorTipo[tipo].sort(
      (a, b) =>
        new Date(a.fechaCambio).getTime() - new Date(b.fechaCambio).getTime()
    );
  });

  const registrosConCambios = registros
    .map((registro) => {
      const tipo = registro.tipo || "sin_tipo";
      const registrosPrevios = historialPorTipo[tipo];
      const indexEnTipo = registrosPrevios.findIndex(
        (r) => r.id === registro.id
      );

      const precioNuevo =
        typeof registro.precio === "string"
          ? parseFloat(registro.precio)
          : Number(registro.precio);

      const precioAnterior: number =
        indexEnTipo > 0
          ? typeof registrosPrevios[indexEnTipo - 1].precio === "string"
            ? parseFloat(registrosPrevios[indexEnTipo - 1].precio as string)
            : Number(registrosPrevios[indexEnTipo - 1].precio)
          : 0;

      return {
        ...registro,
        precioAnterior,
        precioNuevo,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime()
    );

  return (
    <div className="space-y-4">
      {productoNombre && (
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Historial de Precios</h3>
          <p className="text-sm text-gray-600">{productoNombre}</p>
        </div>
      )}

      {registrosConCambios.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Precio Anterior</th>
                <th className="px-4 py-2 text-left">Precio Actual</th>
                <th className="px-4 py-2 text-left">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {registrosConCambios.map((registro) => {
                const diferencia =
                  registro.precioAnterior > 0
                    ? registro.precioNuevo - registro.precioAnterior
                    : 0;
                const porcentaje =
                  registro.precioAnterior > 0
                    ? ((diferencia / registro.precioAnterior) * 100).toFixed(2)
                    : "0";

                return (
                  <tr key={registro.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      {formatFecha(registro.fechaCambio)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          registro.tipo === "proveedor"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {registro.tipo === "proveedor"
                          ? "Proveedor"
                          : "Mi Local"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {registro.precioAnterior > 0
                        ? `$${formatPrecio(registro.precioAnterior)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      ${formatPrecio(registro.precioNuevo)}
                    </td>
                    <td className="px-4 py-2">
                      {registro.precioAnterior > 0 ? (
                        <span
                          className={`font-semibold ${
                            diferencia > 0
                              ? "text-green-600"
                              : diferencia < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {diferencia > 0 ? "+" : ""}$
                          {formatPrecio(Math.abs(diferencia))} (
                          {diferencia > 0 ? "+" : ""}
                          {porcentaje}%)
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">
                          Precio inicial
                        </span>
                      )}
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
        Total de cambios: {registrosConCambios.length}
      </div>
    </div>
  );
};
