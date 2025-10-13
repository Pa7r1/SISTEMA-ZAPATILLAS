import { useState } from "react";
import { ProductosList } from "./ProductosList";
import { ProductoForm } from "./ProductoForm";
import { AjustarStockForm } from "./AjustarStockForm";
import { CambiarPrecioForm } from "./CambiarPrecioForm";
import { CargaMasivaForm } from "./CargaMasivaForm";
import { StockBajoList } from "./StockBajoList";
import { HistorialPrecios } from "./HistorialPrecios";
import { useProducto } from "../../hooks/useProductos";
import { formatPrecio } from "../../utils/general.utils";
import type { Producto } from "../../types/producto.types";
import { ProcesadorCatalogoWhatsApp } from "./ProcesadorCatalogoWhatsApp";

type Vista =
  | "lista"
  | "crear"
  | "editar"
  | "ajustarStock"
  | "cambiarPrecio"
  | "descargaCatalogo"
  | "cargaMasiva"
  | "stockBajo"
  | "historial"
  | "detalles";

export const ProductosPage = () => {
  const [vista, setVista] = useState<Vista>("lista");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState<
    number | null
  >(null);

  const { data: productoDetalle } = useProducto(productoIdSeleccionado || 0);

  const handleCrear = () => {
    setProductoSeleccionado(null);
    setVista("crear");
  };

  const handleEditar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setVista("editar");
  };

  const handleAjustarStock = (productoId: number) => {
    setProductoIdSeleccionado(productoId);
    setVista("ajustarStock");
  };

  const handleCambiarPrecio = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setVista("cambiarPrecio");
  };

  const handleVerHistorial = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setVista("historial");
  };

  const handleVerDetalles = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setVista("detalles");
  };

  const handleVolver = () => {
    setVista("lista");
    setProductoSeleccionado(null);
    setProductoIdSeleccionado(null);
  };

  const renderContenido = () => {
    switch (vista) {
      case "crear":
        return (
          <ProductoForm onSuccess={handleVolver} onCancel={handleVolver} />
        );

      case "editar":
        return productoSeleccionado ? (
          <ProductoForm
            producto={productoSeleccionado}
            onSuccess={handleVolver}
            onCancel={handleVolver}
          />
        ) : null;

      case "ajustarStock":
        return productoDetalle ? (
          <AjustarStockForm
            producto={productoDetalle}
            onSuccess={handleVolver}
            onCancel={handleVolver}
          />
        ) : (
          <div>Cargando...</div>
        );

      case "cambiarPrecio":
        return productoSeleccionado ? (
          <CambiarPrecioForm
            producto={productoSeleccionado}
            onSuccess={handleVolver}
            onCancel={handleVolver}
          />
        ) : null;

      case "descargaCatalogo":
        return <ProcesadorCatalogoWhatsApp />;

      case "cargaMasiva":
        return <CargaMasivaForm />;

      case "stockBajo":
        return <StockBajoList onAjustarStock={handleAjustarStock} />;

      case "historial":
        return productoSeleccionado ? (
          <HistorialPrecios
            productoId={productoSeleccionado.id}
            productoNombre={productoSeleccionado.nombre}
          />
        ) : null;

      case "detalles":
        return productoSeleccionado ? (
          <div className="space-y-4">
            <div className="p-6 border rounded">
              <h2 className="text-2xl font-bold mb-4">
                {productoSeleccionado.nombre}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Precio Proveedor</p>
                  <p className="text-xl font-semibold">
                    ${formatPrecio(productoSeleccionado.precioProveedor)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Precio Venta</p>
                  <p className="text-xl font-semibold">
                    ${formatPrecio(productoSeleccionado.precioMiLocal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Actual</p>
                  <p className="text-xl font-semibold">
                    {productoSeleccionado.stockActual}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Mínimo</p>
                  <p className="text-xl font-semibold">
                    {productoSeleccionado.stockMinimo || "No definido"}
                  </p>
                </div>
              </div>

              {productoSeleccionado.descripcion && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Descripción</p>
                  <p className="text-gray-800">
                    {productoSeleccionado.descripcion}
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => handleEditar(productoSeleccionado)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleAjustarStock(productoSeleccionado.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Ajustar Stock
                </button>
                <button
                  onClick={() => handleCambiarPrecio(productoSeleccionado)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Cambiar Precio
                </button>
                <button
                  onClick={() => handleVerHistorial(productoSeleccionado)}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Ver Historial
                </button>
              </div>
            </div>
          </div>
        ) : null;

      default:
        return (
          <ProductosList
            onEdit={handleEditar}
            onViewDetails={handleVerDetalles}
          />
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Gestión de Productos</h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setVista("lista")}
            className={`px-4 py-2 rounded ${
              vista === "lista"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Lista
          </button>
          <button
            onClick={handleCrear}
            className={`px-4 py-2 rounded ${
              vista === "crear"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Crear Producto
          </button>
          <button
            onClick={() => setVista("stockBajo")}
            className={`px-4 py-2 rounded ${
              vista === "stockBajo"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Stock Bajo
          </button>

          <button
            onClick={() => setVista("descargaCatalogo")}
            className={`px-4 py-2 rounded ${
              vista === "descargaCatalogo"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Descargar Catalogo
          </button>

          <button
            onClick={() => setVista("cargaMasiva")}
            className={`px-4 py-2 rounded ${
              vista === "cargaMasiva"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Carga Masiva
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {vista !== "lista" && (
          <button
            onClick={handleVolver}
            className="mb-4 px-4 py-2 text-blue-500 hover:text-blue-700"
          >
            ← Volver a la lista
          </button>
        )}
        {renderContenido()}
      </div>
    </div>
  );
};
