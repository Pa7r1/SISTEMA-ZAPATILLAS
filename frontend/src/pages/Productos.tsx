import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Producto = {
  id: number;
  nombre: string;
  descripcion?: string;
  precioMiLocal: number;
  stockActual: number;
};

function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/productos")
      .then((res) => {
        setProductos(res.data.data);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Lista de Productos</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productos.map((p) => (
          <li
            key={p.id}
            className="bg-white rounded-xl shadow p-4 border border-gray-200"
          >
            <h2 className="font-semibold">{p.nombre}</h2>
            <p className="text-sm text-gray-600">{p.descripcion}</p>
            <p className="mt-2 font-bold text-blue-600">
              ${p.precioMiLocal.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Stock: {p.stockActual}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Productos;
