import { useState } from "react";

interface Producto {
  nombre: string;
  descripcion: string | null;
  precio: string;
}

interface ArchivoInfo {
  nombre: string;
  tamano: number;
  cantidadProductos: number;
}

type EstadoProceso = "esperando" | "cargado" | "procesado";

export const ProcesadorCatalogoWhatsApp = () => {
  const [estadoPaso2, setEstadoPaso2] = useState<EstadoProceso>("esperando");
  const [archivoInfo, setArchivoInfo] = useState<ArchivoInfo | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [resultadoProceso, setResultadoProceso] = useState<{
    original: number;
    validos: number;
    unicos: number;
    duplicados: number;
  } | null>(null);

  const codigoExtraccion = `// SCRIPT DE EXTRACCIÓN - WhatsApp Web
const productos = Array.from(document.querySelectorAll("div._ak8l"));

if (productos.length === 0) {
  alert("⚠️ No se encontraron productos. Asegúrate de estar en el catálogo.");
} else {
  const resultado = productos.map((producto) => {
    const nombre = producto.querySelector("span[title]")?.title || "Nombre no encontrado";
    
    const textos = Array.from(producto.querySelectorAll('span[dir="auto"]'))
      .map((span) => span.innerText)
      .filter((txt) => txt !== nombre);
    
    const precioNode = [...producto.querySelectorAll("*")].find((el) =>
      /(\$|ARS|USD|EUR)\\s*[\\d.,]+/.test(el.textContent)
    );
    
    const precio = precioNode?.textContent.match(/(\$|ARS|USD|EUR)\\s*[\\d.,]+/)?.[0] || "Sin precio";
    
    const descripcion = textos
      .join("\\n")
      .replace(precio, "")
      .replace(/(?:\\*{2}.*?\\*{2}|\\*{1,2})/g, "")
      .trim();
    
    return { nombre, descripcion, precio };
  });

  // Descargar archivo
  const data = JSON.stringify(resultado, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "catalogo_whatsapp.json";
  link.click();
  
  console.log(\`✅ \${resultado.length} productos extraídos\`);
  alert(\`✅ Descargado: \${resultado.length} productos\`);
}`;

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(codigoExtraccion);
      alert("Código copiado al portapapeles");
    } catch (error) {
      alert("❌ Error al copiar el código");
    }
  };

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) {
      setEstadoPaso2("esperando");
      setArchivoInfo(null);
      setProductos([]);
      return;
    }

    const lector = new FileReader();

    lector.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!Array.isArray(data)) {
          throw new Error("El JSON debe ser un array de productos");
        }

        setProductos(data);
        setArchivoInfo({
          nombre: archivo.name,
          tamano: archivo.size,
          cantidadProductos: data.length,
        });
        setEstadoPaso2("cargado");
        setResultadoProceso(null);
      } catch (error) {
        alert("❌ Error al leer el JSON. Verifica que sea un archivo válido.");
        setEstadoPaso2("esperando");
        setArchivoInfo(null);
        setProductos([]);
      }
    };

    lector.readAsText(archivo);
  };

  const parsePrecio = (precioStr: string): number => {
    if (!precioStr) return NaN;
    const precioTexto = precioStr.replace(/[^\d,\.]/g, "");
    let valorNumerico = NaN;

    if (precioTexto.includes(",") && precioTexto.includes(".")) {
      if (precioTexto.indexOf(",") > precioTexto.indexOf(".")) {
        valorNumerico = parseFloat(
          precioTexto.replace(/\./g, "").replace(",", ".")
        );
      } else {
        valorNumerico = parseFloat(precioTexto.replace(/,/g, ""));
      }
    } else if (precioTexto.includes(",")) {
      const partes = precioTexto.split(",");
      if (partes[1]?.length === 2) {
        valorNumerico = parseFloat(
          precioTexto.replace(/\./g, "").replace(",", ".")
        );
      } else {
        valorNumerico = parseFloat(precioTexto.replace(/,/g, ""));
      }
    } else {
      valorNumerico = parseFloat(precioTexto.replace(/\./g, ""));
    }
    return valorNumerico;
  };

  const normalizeName = (nombre: string): string => {
    return (nombre || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "");
  };

  const procesarYDescargar = () => {
    if (productos.length === 0) {
      alert("⚠️ No hay productos para procesar");
      return;
    }

    const formatearPrecio = (precio: number): string => {
      return precio.toLocaleString("es-AR");
    };

    const productosMapeados = productos
      .map((producto: any) => {
        if (!producto || !producto.precio) return null;
        if (String(producto.precio).toLowerCase().includes("sin precio"))
          return null;

        const valorNumerico = parsePrecio(producto.precio);
        if (isNaN(valorNumerico) || valorNumerico < 100) return null;

        const precioFormateado = formatearPrecio(valorNumerico);

        const descripcionCruda = producto.descripcion || "";
        const regexTalle = /(Talle?s?:.*)/i;
        const descripcionLimpia =
          descripcionCruda.match(regexTalle)?.[1]?.trim() ||
          descripcionCruda.trim();

        return {
          nombre: producto.nombre?.trim() || "Nombre no disponible",
          descripcion: descripcionLimpia || null,
          precio: precioFormateado,
        };
      })
      .filter((p) => p !== null) as Producto[];

    const vistos = new Set<string>();
    const productosUnicos: Producto[] = [];
    let duplicados = 0;

    for (const p of productosMapeados) {
      const clave = `${normalizeName(p.nombre)}|${p.precio}`;
      if (vistos.has(clave)) {
        duplicados++;
        continue;
      }
      vistos.add(clave);
      productosUnicos.push(p);
    }

    const jsonFormateado = {
      productos: productosUnicos,
    };

    const data = JSON.stringify(jsonFormateado, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "catalogo_limpio.json";
    link.click();

    setResultadoProceso({
      original: productos.length,
      validos: productosMapeados.length,
      unicos: productosUnicos.length,
      duplicados,
    });
    setEstadoPaso2("procesado");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* PASO 1: EXTRACCIÓN */}
      <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">
          PASO 1: Extraer Catálogo desde WhatsApp Web
        </h2>

        <div className="bg-white rounded-lg p-5 mb-4">
          <h3 className="font-semibold mb-3 text-lg">Instrucciones:</h3>
          <ol className="space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>
                Abre <strong>WhatsApp Web</strong> en tu navegador
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Ve al catálogo que quieres extraer</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <div>
                <span>
                  Abre la <strong>Consola del navegador</strong>:
                </span>
                <ul className="ml-6 mt-1 text-sm space-y-1">
                  <li>
                    <strong>Chrome/Edge:</strong> F12 o Ctrl+Shift+J
                  </li>
                  <li>
                    <strong>Firefox:</strong> F12 o Ctrl+Shift+K
                  </li>
                  <li>
                    <strong>Mac:</strong> Cmd+Option+J
                  </li>
                </ul>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              <span>Copia el código de abajo y pégalo en la consola</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">5.</span>
              <span>
                Presiona <strong>Enter</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">6.</span>
              <span>
                Se descargará automáticamente:{" "}
                <code className="bg-gray-100 px-2 py-0.5 rounded">
                  catalogo_whatsapp.json
                </code>
              </span>
            </li>
          </ol>
        </div>

        <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 bg-gray-800">
            <span className="text-sm text-gray-400">Código de Extracción</span>
            <button
              onClick={copiarCodigo}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copiar
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm">
            <code>{codigoExtraccion}</code>
          </pre>
        </div>
      </div>

      {/* PASO 2: FORMATEO */}
      <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-yellow-900 mb-4">
          PASO 2: Formatear JSON para tu Sistema
        </h2>

        <div className="bg-white rounded-lg p-5 mb-4">
          <p className="text-gray-700">
            Sube el archivo{" "}
            <code className="bg-gray-100 px-2 py-0.5 rounded">
              catalogo_whatsapp.json
            </code>{" "}
            que descargaste en el paso 1:
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="border-2 border-dashed border-yellow-500 rounded-lg p-6 text-center">
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".json"
                onChange={handleArchivoChange}
                className="hidden"
                id="fileInput"
              />
              <div className="flex flex-col items-center gap-3">
                <svg
                  className="w-12 h-12 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-lg font-medium text-gray-700">
                  Haz clic para seleccionar archivo JSON
                </span>
                <span className="text-sm text-gray-500">
                  Solo archivos .json
                </span>
              </div>
            </label>
          </div>

          {archivoInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-green-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-green-900">
                    {archivoInfo.nombre}
                  </p>
                  <p className="text-sm text-green-700">
                    {(archivoInfo.tamano / 1024).toFixed(2)} KB •{" "}
                    {archivoInfo.cantidadProductos} productos
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={procesarYDescargar}
            disabled={estadoPaso2 === "esperando"}
            className="w-full py-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Procesar y Descargar JSON Formateado
          </button>

          {resultadoProceso && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <div className="flex items-start gap-3 mb-3">
                <svg
                  className="w-6 h-6 text-green-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-bold text-green-900 text-lg">
                    Archivo procesado exitosamente
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-3">
                  <p className="text-gray-600">Total original</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {resultadoProceso.original}
                  </p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-gray-600">Productos válidos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {resultadoProceso.validos}
                  </p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-gray-600">Productos únicos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {resultadoProceso.unicos}
                  </p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-gray-600">Duplicados eliminados</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {resultadoProceso.duplicados}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-green-700 font-medium">
                📥 Descargando:{" "}
                <code className="bg-white px-2 py-0.5 rounded">
                  catalogo_limpio.json
                </code>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PASO 3: CARGA */}
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-green-900 mb-4">
          PASO 3: Cargar en tu Sistema
        </h2>

        <div className="bg-white rounded-lg p-5">
          <ol className="space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>
                Se descargó{" "}
                <code className="bg-gray-100 px-2 py-0.5 rounded">
                  catalogo_limpio.json
                </code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Ve a tu sistema (sección de Carga Masiva)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>
                Sube el archivo{" "}
                <code className="bg-gray-100 px-2 py-0.5 rounded">
                  catalogo_limpio.json
                </code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              <span>Configura: ID Proveedor, Aumento %, Stock</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">5.</span>
              <span>Haz clic en "Cargar Productos"</span>
            </li>
          </ol>
        </div>
      </div>

      {/* INFO TÉCNICA */}
      <details className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <summary className="cursor-pointer font-bold text-gray-700 hover:text-gray-900">
          ℹ️ Información Técnica
        </summary>
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              El formateador hace:
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✅ Convierte precios a formato numérico (100.50)</li>
              <li>✅ Limpia duplicados (mismo nombre + precio)</li>
              <li>✅ Elimina productos sin precio válido (&lt; $100)</li>
              <li>✅ Extrae información de talle de la descripción</li>
              <li>
                ✅ Genera formato compatible:{" "}
                <code className="bg-gray-100 px-2 py-0.5 rounded">
                  {"{"}"productos": [...]{"}"}
                </code>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              Formato de salida:
            </h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
              {`{
  "productos": [
    {
      "nombre": "Producto 1",
      "descripcion": "Talle: M, L, XL",
      "precio": "1500.50"
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
};
