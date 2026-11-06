"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function crearOrden(formData: FormData) {
  const { admin } = await requireAdmin();

  const idProveedor = Number(formData.get("proveedor"));
  const proveedor = Number.isInteger(idProveedor)
    ? await prisma.proveedor.findFirst({
        where: { id_proveedor: idProveedor, activo: true },
      })
    : null;

  const instrumentos = await prisma.instrumento.findMany({
    where: { activo: true },
    select: { id_instrumento: true },
  });

  // Solo las líneas con cantidad mayor a 0
  const lineas = instrumentos
    .map((i) => ({
      id: i.id_instrumento,
      cantidad: Number(formData.get(`cantidad_${i.id_instrumento}`) ?? 0),
      costo: Number(formData.get(`costo_${i.id_instrumento}`) ?? 0),
    }))
    .filter((l) => l.cantidad > 0);

  if (
    !proveedor ||
    lineas.length === 0 ||
    !lineas.every(
      (l) => Number.isInteger(l.cantidad) && Number.isFinite(l.costo) && l.costo > 0,
    )
  ) {
    redirect("/admin/ordenes/nueva?error=datos");
  }

  const orden = await prisma.ordenAbastecimiento.create({
    data: {
      id_proveedor: proveedor.id_proveedor,
      id_administrador: admin.id_administrador,
      detalles: {
        create: lineas.map((l) => ({
          id_instrumento: l.id,
          cantidad_solicitada: l.cantidad,
          costo_unitario: l.costo,
        })),
      },
    },
  });

  revalidatePath("/admin/ordenes");
  redirect(`/admin/ordenes/${orden.id_orden}`);
}

export async function recibirMercancia(formData: FormData) {
  await requireAdmin();

  const idOrden = Number(formData.get("id"));
  if (!Number.isInteger(idOrden)) {
    redirect("/admin/ordenes");
  }
  const base = `/admin/ordenes/${idOrden}`;

  try {
    await prisma.$transaction(async (tx) => {
      const orden = await tx.ordenAbastecimiento.findUnique({
        where: { id_orden: idOrden },
        include: { detalles: true },
      });
      if (!orden || !["Pendiente", "Parcial"].includes(orden.estado_orden)) {
        throw new Error("ESTADO");
      }

      let recibioAlgo = false;

      for (const d of orden.detalles) {
        const cantidad = Number(formData.get(`recibir_${d.id_instrumento}`) ?? 0);
        if (!Number.isInteger(cantidad) || cantidad < 0) throw new Error("CANTIDAD");
        if (cantidad === 0) continue;

        // Solo suma si no se pasa de lo solicitado (protege contra doble recepción)
        const actualizado = await tx.detalleOrden.updateMany({
          where: {
            id_orden: idOrden,
            id_instrumento: d.id_instrumento,
            cantidad_recibida: { lte: d.cantidad_solicitada - cantidad },
          },
          data: { cantidad_recibida: { increment: cantidad } },
        });
        if (actualizado.count === 0) throw new Error("CANTIDAD");

        await tx.instrumento.update({
          where: { id_instrumento: d.id_instrumento },
          data: { stock_actual: { increment: cantidad } },
        });
        recibioAlgo = true;
      }

      if (!recibioAlgo) throw new Error("VACIO");

      const lineas = await tx.detalleOrden.findMany({ where: { id_orden: idOrden } });
      const completa = lineas.every((l) => l.cantidad_recibida >= l.cantidad_solicitada);

      await tx.ordenAbastecimiento.update({
        where: { id_orden: idOrden },
        data: { estado_orden: completa ? "Recibida" : "Parcial" },
      });
    });
  } catch (e) {
    const codigo = e instanceof Error ? e.message : "";
    const conocido = ["ESTADO", "CANTIDAD", "VACIO"].includes(codigo);
    redirect(`${base}?error=${conocido ? codigo.toLowerCase() : "servidor"}`);
  }

  revalidatePath("/admin/ordenes");
  revalidatePath(base);
  revalidatePath("/admin/inventario");
  revalidatePath("/admin");
  redirect(`${base}?ok=1`);
}

export async function cancelarOrden(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    redirect("/admin/ordenes");
  }

  // Solo se cancela si todavía no se recibió nada
  await prisma.ordenAbastecimiento.updateMany({
    where: { id_orden: id, estado_orden: "Pendiente" },
    data: { estado_orden: "Cancelada" },
  });

  revalidatePath("/admin/ordenes");
  revalidatePath(`/admin/ordenes/${id}`);
  redirect(`/admin/ordenes/${id}`);
}