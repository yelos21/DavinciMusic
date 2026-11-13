import { prisma } from "@/lib/prisma";

// Estados por los que puede pasar un pedido y a cuáles puede saltar.
// Entregado y Cancelado son finales.
export const TRANSICIONES: Record<string, string[]> = {
  Pendiente: ["Pagado", "Cancelado"],
  Pagado: ["Enviado", "Cancelado"],
  Enviado: ["Entregado"],
  Entregado: [],
  Cancelado: [],
};

export type ResultadoCambio = "ok" | "error";

// Cambia el estado de un pedido validando la transición.
// - idCliente: limita el cambio a pedidos de ese cliente (cancelación desde Mi cuenta).
// - estadoRequerido: exige que el pedido esté en ese estado antes de cambiarlo.
// Al cancelar, devuelve las piezas al inventario.
export async function cambiarEstado(
  id: number,
  nuevoEstado: string,
  idCliente?: number,
  estadoRequerido?: string,
): Promise<ResultadoCambio> {
  return prisma.$transaction(async (tx): Promise<ResultadoCambio> => {
    const pedido = await tx.pedido.findUnique({
      where: { id_pedido: id },
      include: { detalles: true },
    });

    if (!pedido) return "error";
    if (idCliente !== undefined && pedido.id_cliente !== idCliente) return "error";
    if (estadoRequerido && pedido.estado_pedido !== estadoRequerido) return "error";

    const permitidos = TRANSICIONES[pedido.estado_pedido] ?? [];
    if (!permitidos.includes(nuevoEstado)) return "error";

    // Actualización condicional: si otro proceso ya lo cambió, no se aplica
    const actualizado = await tx.pedido.updateMany({
      where: { id_pedido: id, estado_pedido: pedido.estado_pedido },
      data: { estado_pedido: nuevoEstado },
    });
    if (actualizado.count === 0) return "error";

    // Al cancelar, las piezas regresan al inventario
    if (nuevoEstado === "Cancelado") {
      for (const detalle of pedido.detalles) {
        await tx.instrumento.update({
          where: { id_instrumento: detalle.id_instrumento },
          data: { stock_actual: { increment: detalle.cantidad } },
        });
      }
    }

    return "ok";
  });
}
