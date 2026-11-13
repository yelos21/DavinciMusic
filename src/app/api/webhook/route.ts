import type Stripe from "stripe";
import { cambiarEstado } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";
import { obtenerStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cuerpo = await request.text();
  const firma = request.headers.get("stripe-signature");
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;

  if (!firma || !secreto) {
    return new Response("Configuración incompleta", { status: 400 });
  }

  let evento: Stripe.Event;
  try {
    evento = obtenerStripe().webhooks.constructEvent(cuerpo, firma, secreto);
  } catch {
    return new Response("Firma inválida", { status: 400 });
  }

  try {
    switch (evento.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await marcarPagado(evento.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await cancelarPorPago(evento.data.object as Stripe.Checkout.Session);
        break;
    }
  } catch (error) {
    console.error("Error en el webhook de Stripe:", error);
    // Un 500 hace que Stripe reintente el evento más tarde
    return new Response("Error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

// Busca el pedido que corresponde a la sesión. Debe coincidir el id Y la sesión guardada.
async function pedidoDe(session: Stripe.Checkout.Session) {
  const id = Number(session.client_reference_id);
  if (!Number.isInteger(id)) return null;

  return prisma.pedido.findFirst({
    where: { id_pedido: id, stripe_session_id: session.id },
    include: { detalles: true },
  });
}

async function marcarPagado(session: Stripe.Checkout.Session) {
  // En pagos diferidos (como OXXO) la sesión se completa antes de que el cliente pague
  if (session.payment_status === "unpaid") return;

  const pedido = await pedidoDe(session);
  if (!pedido) return;

  const totalCentavos = pedido.detalles.reduce(
    (suma, d) => suma + d.cantidad * Math.round(Number(d.precio_unitario) * 100),
    0,
  );
  if (session.amount_total !== totalCentavos) {
    console.error(`Monto distinto en el pedido ${pedido.id_pedido}`);
    return;
  }

  await cambiarEstado(pedido.id_pedido, "Pagado", undefined, "Pendiente");
}

async function cancelarPorPago(session: Stripe.Checkout.Session) {
  const pedido = await pedidoDe(session);
  if (!pedido) return;

  // Cancelar devuelve las piezas al inventario
  await cambiarEstado(pedido.id_pedido, "Cancelado", undefined, "Pendiente");
}