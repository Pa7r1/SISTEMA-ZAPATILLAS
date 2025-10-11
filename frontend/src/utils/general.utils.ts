export const formatPrecio = (precio: string | number): string => {
  const precioNumero = typeof precio === "string" ? parseFloat(precio) : precio;
  return isNaN(precioNumero) ? "0.00" : precioNumero.toFixed(2);
};
