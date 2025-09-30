import { useForm } from "react-hook-form";
import { useCambiarPrecio } from "../../hooks/useProductos";
import type { CambioPrecioForm } from "../../schemas/producto.schemas";
import type { Producto } from "../../types/producto.types";

interface CambiarPrecioFormProps {
  producto: Producto;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CambiarPrecioForm = ({
  producto,
  onSuccess,
  onCancel,
}: CambiarPrecioFormProps) => {
  const cambiarMutation = useCambiarPrecio();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CambioPrecioForm>({
    defaultValues: {
      tipo: "local",
      precio: producto.precioMiLocal,
    },
  });

  const tipo = watch("tipo");
  const precioActual =
    tipo === "local" ? producto.precioMiLocal : producto.precioProveedor;

  const onSubmit = async (data: CambioPrecioForm) => {
    try {
      await cambiarMutation.mutateAsync({
        id: producto.id,
        cambio: data,
      });
      alert("Precio actualizado exitosamente");
      onSuccess?.();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error al cambiar precio");
    }
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">{producto.nombre}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p>Precio Proveedor:</p>
            <p className="font-bold text-lg">
              ${producto.precioProveedor.toFixed(2)}
            </p>
          </div>
          <div>
            <p>Precio Venta:</p>
            <p className="font-bold text-lg">
              ${producto.precioMiLocal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Tipo de precio *</label>
          <select
            {...register("tipo", { required: "Tipo es requerido" })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="local">Precio de Venta</option>
            <option value="proveedor">Precio de Proveedor</option>
          </select>
          {errors.tipo && (
            <p className="text-red-500 text-sm mt-1">{errors.tipo.message}</p>
          )}
        </div>

        <div className="p-3 bg-blue-50 rounded">
          <p className="text-sm text-gray-600">
            Precio actual ({tipo === "local" ? "Venta" : "Proveedor"}):{" "}
            <span className="font-bold">${precioActual.toFixed(2)}</span>
          </p>
        </div>

        <div>
          <label className="block mb-1 font-medium">Nuevo precio *</label>
          <input
            type="number"
            step="0.01"
            {...register("precio", {
              required: "Precio es requerido",
              valueAsNumber: true,
              min: {
                value: 0.01,
                message: "El precio debe ser mayor a 0",
              },
            })}
            className="w-full px-3 py-2 border rounded"
            placeholder="0.00"
          />
          {errors.precio && (
            <p className="text-red-500 text-sm mt-1">{errors.precio.message}</p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? "Actualizando..." : "Actualizar Precio"}
          </button>
        </div>
      </form>
    </div>
  );
};
