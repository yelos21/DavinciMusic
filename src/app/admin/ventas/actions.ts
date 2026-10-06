"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function registrarVenta(formData: FormData) {
  const { admin } = await requireAdmin();

  const idCliente = Number(formData.get("cliente"));
  const metodoPago = String(formData.get("metodo_pago") ?? "").trim();

  const instrumentos = await prisma.instrumento.findMany({
    where: { activo: true },
  });

  const items = instrumentos
    .map((i) => ({
      id: i.id_instrumento,
      precio: i.precio_venta,
      cantidad: Number(formData.get(`cantidad_${i.id_instrumento}`) ?? 0),
    }))
    .filter((i) => Number.isInteger(i.cantidad) && i.cantidad > 0);

  if (!Number.isInteger(idCliente) || !metodoPago || items.length === 0) {
    redirect("/admin/ventas/nueva?error=datos");
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const resultado = await tx.instrumento.updateMany({
          where: { id_instrumento: item.id, stock_actual: { gte: item.cantidad } },
          data: { stock_actual: { decrement: item.cantidad } },
        });
        if (resultado.count === 0) {
          throw new Error("SIN_STOCK");
        }
      }

      await tx.venta.create({
        data: {
          id_cliente: idCliente,
          id_administrador: admin.id_administrador,
          metodo_pago: metodoPago,
          detalles: {
            create: items.map((i) => ({
              id_instrumento: i.id,
              cantidad: i.cantidad,
              precio_unitario: i.precio,
            })),
          },
        },
      });
    });
  } catch (e) {
    const sinStock = e instanceof Error && e.message === "SIN_STOCK";
    redirect(`/admin/ventas/nueva?error=${sinStock ? "stock" : "servidor"}`);
  }

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/inventario");
  redirect("/admin/ventas");
}