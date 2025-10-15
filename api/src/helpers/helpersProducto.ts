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

  return valorNumerico;
};

export const normalizeProductName = (nombre: string): string => {
  return nombre
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");
};

export const redondearPrecioLocal = (precio: number): number => {
  if (precio < 200) {
    return 100;
  }

  if (precio >= 200 && precio <= 600) {
    return 500;
  }

  return Math.ceil(precio / 1000) * 1000;
};

export const aplicarAumentoPorcentaje = (
  precioBase: number,
  porcentaje: number
): number => {
  if (porcentaje <= 0) return precioBase;
  return precioBase * (1 + porcentaje / 100);
};

export const formatearPrecioArgentino = (precio: number): string => {
  const partes = precio.toString().split(".");
  const entero = partes[0] || "0";
  const decimales = partes[1];
  const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (decimales) {
    return `${enteroFormateado},${decimales}`;
  }

  return enteroFormateado;
};
