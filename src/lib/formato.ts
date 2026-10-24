export function inicioDelDia(): Date {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
  return new Date(`${hoy}T00:00:00-06:00`);
}

export function peso(cantidad: number): string {
  return cantidad.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

export function hora(fecha: Date): string{
  return fecha.toLocaleTimeString("es-MX", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}