"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

function leerId(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    redirect("/admin/usuarios");
  }
  return id;
}

export async function asignarMaestro(formData: FormData) {
  await requireAdmin();
  const id = leerId(formData);

  const especialidad = String(formData.get("especialidad") ?? "").trim();
  if (especialidad.length < 2 || especialidad.length > 60) {
    redirect("/admin/usuarios?error=especialidad");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id_usuario: id } });
  if (!usuario) {
    redirect("/admin/usuarios?error=usuario");
  }

  // Si ya fue maestro, se reactiva en lugar de duplicarlo
  await prisma.maestro.upsert({
    where: { id_usuario: id },
    update: { activo: true, especialidad },
    create: { id_usuario: id, especialidad, fecha_contratacion: new Date() },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/escuela");
  redirect("/admin/usuarios?ok=maestro");
}

export async function quitarMaestro(formData: FormData) {
  await requireAdmin();
  const id = leerId(formData);

  await prisma.maestro.updateMany({
    where: { id_usuario: id },
    data: { activo: false },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/escuela");
  redirect("/admin/usuarios?ok=quitado");
}

export async function asignarAdministrador(formData: FormData) {
  await requireAdmin();
  const id = leerId(formData);

  const usuario = await prisma.usuario.findUnique({ where: { id_usuario: id } });
  if (!usuario) {
    redirect("/admin/usuarios?error=usuario");
  }
  // Un administrador necesita una cuenta para poder entrar
  if (!usuario.authUserId) {
    redirect("/admin/usuarios?error=sincuenta");
  }

  await prisma.administrador.upsert({
    where: { id_usuario: id },
    update: { activo: true },
    create: { id_usuario: id, fecha_contratacion: new Date() },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=admin");
}

export async function quitarAdministrador(formData: FormData) {
  const { admin } = await requireAdmin();
  const id = leerId(formData);

  const objetivo = await prisma.administrador.findUnique({
    where: { id_usuario: id },
  });
  if (!objetivo) {
    redirect("/admin/usuarios?error=usuario");
  }

  // No puedes quitarte el acceso a ti mismo
  if (objetivo.id_administrador === admin.id_administrador) {
    redirect("/admin/usuarios?error=tumismo");
  }

  // Siempre debe quedar al menos un administrador activo
  const activos = await prisma.administrador.count({ where: { activo: true } });
  if (activos <= 1) {
    redirect("/admin/usuarios?error=ultimo");
  }

  // Se desactiva, no se borra: conserva sus ventas y órdenes registradas
  await prisma.administrador.update({
    where: { id_usuario: id },
    data: { activo: false },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=quitado");
}