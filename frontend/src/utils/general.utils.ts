export const formatPrecio = (precio: string | number): string => {
  const precioNumero = typeof precio === "string" ? parseFloat(precio) : precio;
  if (isNaN(precioNumero)) {
    return "0";
  }
  if (Number.isInteger(precioNumero)) {
    return precioNumero.toString();
  }
  return precioNumero.toString();
};
