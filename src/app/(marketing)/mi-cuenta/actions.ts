"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/sesion";

const TELEFONO = /^[0-9+()\s-]{7,20}$/;

export async function actualizarPerfil(formData: FormData) {
  const { usuario } = await requireUser();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();

  if (
    nombre.length < 2 ||
    nombre.length > 100 ||
    (telefono && !TELEFONO.test(telefono)) ||
    direccion.length > 200
  ) {
    redirect("/mi-cuenta?error=1");
  }

  await prisma.usuario.update({
    where: { id_usuario: usuario.id_usuario },
    data: {
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
    },
  });

  await auth.api.updateUser({
    body: { name: nombre },
    headers: await headers(),
  });

  revalidatePath("/mi-cuenta");
  redirect("/mi-cuenta?guardado=1");
}