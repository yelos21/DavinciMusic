"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function marcarLeido(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await prisma.mensajeContacto.update({
    where: { id_mensaje: id },
    data: { leido: true },
  });
  revalidatePath("/admin/mensajes");
}