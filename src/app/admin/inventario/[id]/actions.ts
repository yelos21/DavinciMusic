"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Solo rutas de la carpeta public/instrumentos, por ejemplo /instrumentos/guitarra.jpg
const IMAGEN = /^\/instrumentos\/[\w.-]+$/;

export async function actualizarInstrumento(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    redirect("/admin/inventario");
  }
  const base = `/admin/inventario/${id}/editar`;

  const nombre = String(formData.get("nombre") ?? "").trim();
  const marca = String(formData.get("marca") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const categoria = Number(formData.get("categoria"));
  const precio = Number(formData.get("precio"));
  const stock = Number(formData.get("stock"));
  const imagen = String(formData.get("imagen") ?? "").trim();

  if (
    nombre.length < 2 ||
    nombre.length > 150 ||
    !Number.isInteger(categoria) ||
    !Number.isFinite(precio) ||
    precio < 0 ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    (imagen !== "" && !IMAGEN.test(imagen))
  ) {
    redirect(`${base}?error=datos`);
  }

  const [instrumento, categoriaExiste] = await Promise.all([
    prisma.instrumento.findUnique({ where: { id_instrumento: id } }),
    prisma.categoriaInstrumento.findUnique({ where: { id_categoria: categoria } }),
  ]);
  if (!instrumento) {
    redirect("/admin/inventario");
  }
  if (!categoriaExiste) {
    redirect(`${base}?error=datos`);
  }

  await prisma.instrumento.update({
    where: { id_instrumento: id },
    data: {
      id_categoria: categoria,
      nombre_instrumento: nombre,
      marca: marca || null,
      modelo: modelo || null,
      precio_venta: precio,
      stock_actual: stock,
      imagen_url: imagen || null,
    },
  });

  revalidatePath("/admin/inventario");
  revalidatePath("/admin");
  revalidatePath("/tienda");
  revalidatePath("/");
  redirect("/admin/inventario");
}

export async function cambiarEstadoInstrumento(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const instrumento = await prisma.instrumento.findUnique({
    where: { id_instrumento: id },
  });
  if (!instrumento) return;

  await prisma.instrumento.update({
    where: { id_instrumento: id },
    data: { activo: !instrumento.activo },
  });

  revalidatePath("/admin/inventario");
  revalidatePath("/admin");
  revalidatePath("/tienda");
  revalidatePath("/");
}