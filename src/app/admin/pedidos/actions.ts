"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cambiarEstado } from "@/lib/pedidos";
import { requireAdmin } from "@/lib/require-admin";

export async function cambiarEstadoPedido(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const estado = String(formData.get("estado") ?? "");
  if (!Number.isInteger(id)) {
    redirect("/admin/pedidos");
  }

  // cambiarEstado valida que la transición sea permitida
  const resultado = await cambiarEstado(id, estado);

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin");
  revalidatePath("/pedidos");
  revalidatePath("/tienda");
  redirect(`/admin/pedidos?${resultado === "ok" ? "ok=1" : "error=1"}`);
}