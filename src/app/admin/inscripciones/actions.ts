"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hoyMX, inicioDeMes } from "@/lib/fechas";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const METODOS = ["Efectivo", "Tarjeta", "Transferencia"];
const DIA_MS = 24 * 60 * 60 * 1000;

export async function inscribirAlumno(formData: FormData) {
  await requireAdmin();

  const idCliente = Number(formData.get("cliente"));
  const idClase = Number(formData.get("clase"));
  const costo = Number(formData.get("costo"));

  if (
    !Number.isInteger(idCliente) ||
    !Number.isInteger(idClase) ||
    !Number.isFinite(costo) ||
    costo <= 0
  ) {
    redirect("/admin/inscripciones/nueva?error=datos");
  }

  let idInscripcion = 0;

  try {
    idInscripcion = await prisma.$transaction(async (tx) => {
      const clase = await tx.clase.findFirst({
        where: { id_clase: idClase, activa: true },
      });
      const cliente = await tx.cliente.findUnique({ where: { id_cliente: idCliente } });
      if (!clase || !cliente) throw new Error("DATOS");

      const repetida = await tx.inscripcionClase.findFirst({
        where: { id_cliente: idCliente, id_clase: idClase, estado_inscripcion: "Activa" },
      });
      if (repetida) throw new Error("REPETIDA");

      const ocupados = await tx.inscripcionClase.count({
        where: { id_clase: idClase, estado_inscripcion: "Activa" },
      });
      if (ocupados >= clase.cupo_maximo) throw new Error("CUPO");

      const hoy = hoyMX();
      const inscripcion = await tx.inscripcionClase.create({
        data: {
          id_cliente: idCliente,
          id_clase: idClase,
          costo_mensual_acordado: costo,
          // La inscripción nace con su primer cargo, que vence en 5 días
          pagos: {
            create: {
              periodo_pagado: inicioDeMes(hoy.anio, hoy.mes),
              importe: costo,
              fecha_vencimiento: new Date(Date.now() + 5 * DIA_MS),
            },
          },
        },
      });
      return inscripcion.id_inscripcion;
    });
  } catch (e) {
    const codigo = e instanceof Error ? e.message : "";
    const conocido = ["DATOS", "REPETIDA", "CUPO"].includes(codigo);
    redirect(`/admin/inscripciones/nueva?error=${conocido ? codigo.toLowerCase() : "servidor"}`);
  }

  revalidatePath("/admin/inscripciones");
  redirect(`/admin/inscripciones/${idInscripcion}`);
}

export async function generarCargo(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    redirect("/admin/inscripciones");
  }
  const base = `/admin/inscripciones/${id}`;

  const inscripcion = await prisma.inscripcionClase.findFirst({
    where: { id_inscripcion: id, estado_inscripcion: "Activa" },
    include: { pagos: { orderBy: { periodo_pagado: "desc" }, take: 1 } },
  });
  if (!inscripcion) {
    redirect(`${base}?error=estado`);
  }

  const hoy = hoyMX();
  const ultimo = inscripcion.pagos[0]?.periodo_pagado;
  const siguiente = ultimo
    ? new Date(Date.UTC(ultimo.getUTCFullYear(), ultimo.getUTCMonth() + 1, 1))
    : inicioDeMes(hoy.anio, hoy.mes);

  // Solo se genera hasta el mes siguiente al actual
  if (siguiente > inicioDeMes(hoy.anio, hoy.mes + 1)) {
    redirect(`${base}?error=adelantado`);
  }

  await prisma.pagoClase.create({
    data: {
      id_inscripcion: id,
      periodo_pagado: siguiente,
      importe: inscripcion.costo_mensual_acordado,
      fecha_vencimiento: new Date(
        Date.UTC(siguiente.getUTCFullYear(), siguiente.getUTCMonth(), 5),
      ),
    },
  });

  revalidatePath(base);
  revalidatePath("/admin/inscripciones");
  redirect(`${base}?ok=cargo`);
}

export async function registrarPago(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const idPago = Number(formData.get("pago"));
  const metodo = String(formData.get("metodo") ?? "");
  if (!Number.isInteger(id) || !Number.isInteger(idPago)) {
    redirect("/admin/inscripciones");
  }
  const base = `/admin/inscripciones/${id}`;

  if (!METODOS.includes(metodo)) {
    redirect(`${base}?error=metodo`);
  }

  // Solo cobra un cargo pendiente de ESTA inscripción
  const cobrado = await prisma.pagoClase.updateMany({
    where: { id_pago_clase: idPago, id_inscripcion: id, estado_pago: "Pendiente" },
    data: { estado_pago: "Pagado", fecha_pago: new Date(), metodo_pago: metodo },
  });
  if (cobrado.count === 0) {
    redirect(`${base}?error=pago`);
  }

  revalidatePath(base);
  revalidatePath("/admin/inscripciones");
  redirect(`${base}?ok=pago`);
}

export async function darDeBaja(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    redirect("/admin/inscripciones");
  }

  await prisma.inscripcionClase.updateMany({
    where: { id_inscripcion: id, estado_inscripcion: "Activa" },
    data: { estado_inscripcion: "Baja" },
  });

  revalidatePath(`/admin/inscripciones/${id}`);
  revalidatePath("/admin/inscripciones");
  redirect(`/admin/inscripciones/${id}`);
}