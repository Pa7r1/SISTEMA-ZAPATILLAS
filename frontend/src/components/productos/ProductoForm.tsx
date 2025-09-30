import { useForm } from "react-hook-form";
import {
  useCrearProducto,
  useActualizarProducto,
} from "../../hooks/useProductos";
import type { Producto } from "../../types/producto.types";
import type { CrearProductoForm } from "../../schemas/producto.schemas";

interface ProductoFormProps {
  producto?: Producto;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProductoForm = ({
  producto,
  onSuccess,
  onCancel,
}: ProductoFormProps) => {
  const crearMutation = useCrearProducto();
  const actualizarMutation = useActualizarProducto();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CrearProductoForm>({
    defaultValues: producto
      ? {
          idProveedor: producto.idProveedor,
          nombre: producto.nombre,
          descripcion: producto.descripcion || undefined,
          precioProveedor: producto.precioProveedor,
          precioMiLocal: producto.precioMiLocal,
          stockActual: producto.stockActual,
          stockMinimo: producto.stockMinimo,
        }
      : {
          idProveedor: 1,
          stockActual: 0,
          stockMinimo: 5,
        },
  });

  const onSubmit = async (data: CrearProductoForm) => {
    try {
      if (producto) {
        await actualizarMutation.mutateAsync({
          id: producto.id,
          datos: data,
        });
        alert("Producto actualizado exitosamente");
      } else {
        await crearMutation.mutateAsync(data);
        alert("Producto creado exitosamente");
      }
      onSuccess?.();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error al guardar el producto");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Nombre *</label>
        <input
          type="text"
          {...register("nombre", { required: "Nombre es requerido" })}
          className="w-full px-3 py-2 border rounded"
        />
        {errors.nombre && (
          <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Descripción</label>
        <textarea
          {...register("descripcion")}
          rows={3}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Precio Proveedor *</label>
          <input
            type="number"
            step="0.01"
            {...register("precioProveedor", {
              required: "Precio proveedor es requerido",
              valueAsNumber: true,
            })}
            className="w-full px-3 py-2 border rounded"
          />
          {errors.precioProveedor && (
            <p className="text-red-500 text-sm mt-1">
              {errors.precioProveedor.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Precio Venta *</label>
          <input
            type="number"
            step="0.01"
            {...register("precioMiLocal", {
              required: "Precio venta es requerido",
              valueAsNumber: true,
            })}
            className="w-full px-3 py-2 border rounded"
          />
          {errors.precioMiLocal && (
            <p className="text-red-500 text-sm mt-1">
              {errors.precioMiLocal.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Stock Actual *</label>
          <input
            type="number"
            {...register("stockActual", {
              required: "Stock es requerido",
              valueAsNumber: true,
            })}
            className="w-full px-3 py-2 border rounded"
          />
          {errors.stockActual && (
            <p className="text-red-500 text-sm mt-1">
              {errors.stockActual.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Stock Mínimo</label>
          <input
            type="number"
            {...register("stockMinimo", { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 font-medium">ID Proveedor *</label>
        <input
          type="number"
          {...register("idProveedor", {
            required: "Proveedor es requerido",
            valueAsNumber: true,
          })}
          className="w-full px-3 py-2 border rounded"
        />
        {errors.idProveedor && (
          <p className="text-red-500 text-sm mt-1">
            {errors.idProveedor.message}
          </p>
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
          {isSubmitting
            ? "Guardando..."
            : producto
            ? "Actualizar"
            : "Crear Producto"}
        </button>
      </div>
    </form>
  );
};
