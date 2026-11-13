"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cambiarEstado } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/sesion";

export async function cancelarMiPedido(formData: FormData) {
  const { usuario } = await requireUser();

  const cliente = await prisma.cliente.findUnique({
    where: { id_usuario: usuario.id_usuario },
  });
  const id = Number(formData.get("id"));
  if (!cliente || !Number.isInteger(id)) {
    redirect("/pedidos");
  }

  // Solo sus propios pedidos, y solo mientras estén pendientes
  const resultado = await cambiarEstado(id, "Cancelado", cliente.id_cliente, "Pendiente");

  revalidatePath("/pedidos");
  revalidatePath("/tienda");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/inventario");
  redirect(`/pedidos?${resultado === "ok" ? "cancelado=1" : "error=1"}`);
}