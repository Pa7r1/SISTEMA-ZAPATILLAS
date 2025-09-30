import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCargarArchivo } from "../../hooks/useProductos";
import type { ResultadoCargaMasiva } from "../../types/producto.types";

interface ConfiguracionCarga {
  idProveedor: number;
  aumentoPorcentaje: number;
  stockPorDefecto: number;
}

export const CargaMasivaForm = () => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<{
    resultados: ResultadoCargaMasiva;
    resumen: any;
  } | null>(null);

  const cargarMutation = useCargarArchivo();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfiguracionCarga>({
    defaultValues: {
      idProveedor: 1,
      aumentoPorcentaje: 0,
      stockPorDefecto: 1,
    },
  });

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/json") {
        alert("Solo se permiten archivos JSON");
        e.target.value = "";
        return;
      }
      setArchivo(file);
      setResultado(null);
    }
  };

  const onSubmit = async (config: ConfiguracionCarga) => {
    if (!archivo) {
      alert("Selecciona un archivo primero");
      return;
    }

    try {
      const res = await cargarMutation.mutateAsync({
        archivo,
        config,
      });
      setResultado(res);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error al cargar el archivo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Formato del archivo JSON</h3>
        <pre className="text-sm bg-white p-3 rounded overflow-x-auto">
          {`{
  "productos": [
    {
      "nombre": "Producto 1",
      "descripcion": "Descripción opcional",
      "precio": "100.50"
    }
  ]
}`}
        </pre>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Archivo JSON *</label>
          <input
            type="file"
            accept=".json"
            onChange={handleArchivoChange}
            className="w-full px-3 py-2 border rounded"
          />
          {archivo && (
            <p className="text-sm text-gray-600 mt-1">
              Archivo seleccionado: {archivo.name} (
              {(archivo.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-medium">ID Proveedor</label>
            <input
              type="number"
              {...register("idProveedor", {
                valueAsNumber: true,
                min: 1,
              })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Aumento % (opcional)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("aumentoPorcentaje", {
                valueAsNumber: true,
                min: 0,
                max: 100,
              })}
              className="w-full px-3 py-2 border rounded"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Stock por defecto</label>
            <input
              type="number"
              {...register("stockPorDefecto", {
                valueAsNumber: true,
                min: 0,
              })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !archivo}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? "Cargando productos..." : "Cargar Productos"}
        </button>
      </form>

      {resultado && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-semibold mb-3">Resumen de Carga</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{resultado.resumen.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Exitosos</p>
                <p className="text-2xl font-bold text-green-600">
                  {resultado.resumen.exitosos}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duplicados</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {resultado.resumen.duplicados}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Errores</p>
                <p className="text-2xl font-bold text-red-600">
                  {resultado.resumen.errores}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Detalles</h3>
            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="min-w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Estado</th>
                    <th className="px-4 py-2 text-left">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.resultados.detalles.map((detalle, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{detalle.index}</td>
                      <td className="px-4 py-2">{detalle.nombre}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            detalle.estado === "creado"
                              ? "bg-green-100 text-green-800"
                              : detalle.estado === "duplicado"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {detalle.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {detalle.mensaje || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
