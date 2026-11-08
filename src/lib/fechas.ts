export function hoyMX() {
  const [anio, mes, dia] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" })
    .split("-")
    .map(Number);
  return { anio, mes, dia };
}

export function inicioDeMes(anio: number, mes: number): Date {
  return new Date(Date.UTC(anio, mes - 1, 1));
}

export function mesTexto(fecha: Date): string {
  return fecha.toLocaleDateString("es-MX", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}