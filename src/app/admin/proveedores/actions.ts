"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// RFC de persona moral (12) o física (13): letras, 6 dígitos de fecha y homoclave
const RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO = /^[0-9+()\s-]{7,20}$/;

export async function crearProveedor(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const rfc = String(formData.get("rfc") ?? "").trim().toUpperCase();
  const correo = String(formData.get("correo") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();

  if (
    nombre.length < 2 ||
    nombre.length > 150 ||
    !RFC.test(rfc) ||
    !CORREO.test(correo) ||
    !TELEFONO.test(telefono) ||
    direccion.length > 200
  ) {
    redirect("/admin/proveedores/nuevo?error=datos");
  }

  const existe = await prisma.proveedor.findUnique({ where: { rfc } });
  if (existe) {
    redirect("/admin/proveedores/nuevo?error=rfc");
  }

  await prisma.proveedor.create({
    data: {
      nombre_proveedor: nombre,
      rfc,
      correo,
      telefono,
      direccion: direccion || null,
    },
  });

  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}

export async function cambiarEstadoProveedor(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const proveedor = await prisma.proveedor.findUnique({
    where: { id_proveedor: id },
  });
  if (!proveedor) return;

  await prisma.proveedor.update({
    where: { id_proveedor: id },
    data: { activo: !proveedor.activo },
  });

  revalidatePath("/admin/proveedores");
}