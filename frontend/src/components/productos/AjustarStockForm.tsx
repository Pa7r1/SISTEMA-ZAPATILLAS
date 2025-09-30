import { useForm } from "react-hook-form";
import { useAjustarStock } from "../../hooks/useProductos";
import type { AjusteStockForm } from "../../schemas/producto.schemas";
import type { Producto } from "../../types/producto.types";

interface AjustarStockFormProps {
  producto: Producto;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AjustarStockForm = ({
  producto,
  onSuccess,
  onCancel,
}: AjustarStockFormProps) => {
  const ajustarMutation = useAjustarStock();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<AjusteStockForm>({
    defaultValues: {
      cantidad: 0,
      motivo: "",
    },
  });

  const cantidad = watch("cantidad");
  const nuevoStock = producto.stockActual + (cantidad || 0);

  const onSubmit = async (data: AjusteStockForm) => {
    try {
      await ajustarMutation.mutateAsync({
        id: producto.id,
        ajuste: data,
      });
      alert("Stock ajustado exitosamente");
      onSuccess?.();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error al ajustar stock");
    }
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">{producto.nombre}</h3>
        <p className="text-sm text-gray-600">
          Stock actual:{" "}
          <span className="font-bold">{producto.stockActual}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">
            Cantidad a ajustar (positivo para agregar, negativo para restar) *
          </label>
          <input
            type="number"
            {...register("cantidad", {
              required: "Cantidad es requerida",
              valueAsNumber: true,
              validate: (value) =>
                producto.stockActual + value >= 0 ||
                "El stock no puede ser negativo",
            })}
            className="w-full px-3 py-2 border rounded"
            placeholder="Ej: 10 o -5"
          />
          {errors.cantidad && (
            <p className="text-red-500 text-sm mt-1">
              {errors.cantidad.message}
            </p>
          )}
        </div>

        <div className="p-3 bg-blue-50 rounded">
          <p className="text-sm">
            Nuevo stock:{" "}
            <span
              className={`font-bold ${nuevoStock < 0 ? "text-red-600" : ""}`}
            >
              {nuevoStock}
            </span>
          </p>
        </div>

        <div>
          <label className="block mb-1 font-medium">Motivo del ajuste *</label>
          <textarea
            {...register("motivo", {
              required: "Motivo es requerido",
              minLength: {
                value: 5,
                message: "El motivo debe tener al menos 5 caracteres",
              },
            })}
            rows={3}
            className="w-full px-3 py-2 border rounded"
            placeholder="Ej: Reposición de inventario, Producto dañado, etc."
          />
          {errors.motivo && (
            <p className="text-red-500 text-sm mt-1">{errors.motivo.message}</p>
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
            {isSubmitting ? "Ajustando..." : "Ajustar Stock"}
          </button>
        </div>
      </form>
    </div>
  );
};
