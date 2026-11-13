"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cambiarEstado } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/sesion";
import { obtenerStripe } from "@/lib/stripe";

const METODOS = ["Pago en tienda", "Transferencia", "Tarjeta"];
const TELEFONO = /^[0-9+()\s-]{7,20}$/;

export async function crearPedido(formData: FormData) {
  const { usuario } = await requireUser();

  const direccion = String(formData.get("direccion") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const metodo = String(formData.get("metodo") ?? "");

  if (
    direccion.length < 10 ||
    direccion.length > 200 ||
    !TELEFONO.test(telefono) ||
    !METODOS.includes(metodo)
  ) {
    redirect("/checkout?error=datos");
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id_usuario: usuario.id_usuario },
  });
  if (!cliente) {
    redirect("/carrito");
  }

  let idPedido = 0;

  try {
    idPedido = await prisma.$transaction(async (tx) => {
      const items = await tx.carritoItem.findMany({
        where: { id_cliente: cliente.id_cliente },
        include: { instrumento: true },
      });

      const lineas = items
        .filter((i) => i.instrumento.activo && i.instrumento.stock_actual > 0)
        .map((i) => ({
          id_instrumento: i.id_instrumento,
          cantidad: Math.min(i.cantidad, i.instrumento.stock_actual),
          precio_unitario: Number(i.instrumento.precio_venta),
        }));
      if (lineas.length === 0) throw new Error("VACIO");

      for (const l of lineas) {
        const resultado = await tx.instrumento.updateMany({
          where: {
            id_instrumento: l.id_instrumento,
            activo: true,
            stock_actual: { gte: l.cantidad },
          },
          data: { stock_actual: { decrement: l.cantidad } },
        });
        if (resultado.count === 0) throw new Error("STOCK");
      }

      const pedido = await tx.pedido.create({
        data: {
          id_cliente: cliente.id_cliente,
          metodo_pago: metodo,
          direccion_envio: direccion,
          telefono_contacto: telefono,
          detalles: { create: lineas },
        },
      });

      await tx.carritoItem.deleteMany({ where: { id_cliente: cliente.id_cliente } });

      return pedido.id_pedido;
    });
  } catch (e) {
    const codigo = e instanceof Error ? e.message : "";
    if (codigo === "VACIO") redirect("/carrito");
    redirect(`/checkout?error=${codigo === "STOCK" ? "stock" : "servidor"}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/tienda");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/inventario");

  // Pago con tarjeta: el pedido ya existe (pendiente) y se manda al cliente a pagar a Stripe
  if (metodo === "Tarjeta") {
    const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    let urlPago: string | null = null;

    try {
      const pedido = await prisma.pedido.findUniqueOrThrow({
        where: { id_pedido: idPedido },
        include: { detalles: { include: { instrumento: true } } },
      });

      const sesion = await obtenerStripe().checkout.sessions.create({
        mode: "payment",
        client_reference_id: String(idPedido),
        customer_email: usuario.correo,
        line_items: pedido.detalles.map((d) => ({
          quantity: d.cantidad,
          price_data: {
            currency: "mxn",
            // El precio sale de la base de datos, en centavos
            unit_amount: Math.round(Number(d.precio_unitario) * 100),
            product_data: { name: d.instrumento.nombre_instrumento },
          },
        })),
        // Si no paga en ~30 minutos, la sesión expira y el pedido se cancela solo
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
        success_url: `${base}/pedidos?nuevo=${idPedido}&pago=ok`,
        cancel_url: `${base}/pedidos?pago=cancelado`,
      });

      await prisma.pedido.update({
        where: { id_pedido: idPedido },
        data: { stripe_session_id: sesion.id },
      });

      urlPago = sesion.url;
    } catch (error) {
      console.error("No se pudo crear la sesión de Stripe:", error);
      // Si Stripe falla, el pedido no debe quedar apartando piezas
      await cambiarEstado(idPedido, "Cancelado");
    }

    if (!urlPago) {
      redirect("/checkout?error=pago");
    }
    redirect(urlPago);
  }

  redirect(`/pedidos?nuevo=${idPedido}`);
}