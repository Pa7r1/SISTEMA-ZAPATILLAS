// Helper para parsear precios desde formato de catálogo
export const parsePrecioFromCatalog = (precioStr: string): number => {
  if (!precioStr || precioStr.toLowerCase().includes("sin precio")) {
    throw new Error("Precio inválido");
  }

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
      valorNumerico = parseFloat(precioTexto.replace(",", "."));
    } else {
      valorNumerico = parseFloat(precioTexto.replace(/,/g, ""));
    }
  } else {
    valorNumerico = parseFloat(precioTexto.replace(/\./g, ""));
  }

  if (isNaN(valorNumerico) || valorNumerico < 100) {
    throw new Error("Precio demasiado bajo o inválido");
  }

  return Math.round(valorNumerico * 100) / 100; // Redondear a 2 decimales
};

// Helper para normalizar nombres para detectar duplicados
export const normalizeProductName = (nombre: string): string => {
  return nombre
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");
};
