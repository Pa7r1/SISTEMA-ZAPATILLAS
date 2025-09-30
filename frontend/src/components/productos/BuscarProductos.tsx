import { useState } from "react";
import { useBuscarProductos } from "../../hooks/useProductos";
import type { Producto } from "../../types/producto.types";

interface BuscarProductosProps {
  onSelect?: (producto: Producto) => void;
}

export const BuscarProductos = ({ onSelect }: BuscarProductosProps) => {
  const [termino, setTermino] = useState("");
  const { data: resultados, isLoading } = useBuscarProductos(termino);

  const handleBuscar = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermino(e.target.value);
  };

  const handleSeleccionar = (producto: Producto) => {
    onSelect?.(producto);
    setTermino("");
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={termino}
        onChange={handleBuscar}
        placeholder="Buscar productos... (mínimo 3 caracteres)"
        className="w-full px-4 py-2 border rounded pr-10"
      />

      <div className="absolute right-3 top-2.5 text-gray-400">
        {isLoading ? (
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}
      </div>

      {termino.length >= 3 && resultados && resultados.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-96 overflow-y-auto">
          {resultados.map((producto) => (
            <div
              key={producto.id}
              onClick={() => handleSeleccionar(producto)}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="font-semibold">{producto.nombre}</div>
              <div className="text-sm text-gray-600 flex justify-between">
                <span>Stock: {producto.stockActual}</span>
                <span className="font-semibold">
                  ${producto.precioMiLocal.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {termino.length >= 3 &&
        resultados &&
        resultados.length === 0 &&
        !isLoading && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg p-4 text-center text-gray-500">
            No se encontraron productos
          </div>
        )}
    </div>
  );
};
