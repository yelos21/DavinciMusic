"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/sesion";

// El carrito pertenece a un cliente. Si la persona aún no tiene rol de cliente
// (por ejemplo, un maestro), se le crea al vuelo.
async function clienteActual() {
  const { usuario } = await requireUser();
  return prisma.cliente.upsert({
    where: { id_usuario: usuario.id_usuario },
    update: {},
    create: { id_usuario: usuario.id_usuario },
  });
}

function refrescar() {
  revalidatePath("/carrito");
  revalidatePath("/", "layout"); // actualiza el contador del navbar
}

export async function agregarAlCarrito(formData: FormData) {
  const cliente = await clienteActual();

  const id = Number(formData.get("id"));
  const cantidad = Number(formData.get("cantidad") ?? 1);
  if (!Number.isInteger(id) || !Number.isInteger(cantidad) || cantidad < 1) {
    redirect("/tienda");
  }

  const instrumento = await prisma.instrumento.findFirst({
    where: { id_instrumento: id, activo: true },
  });
  if (!instrumento || instrumento.stock_actual < 1) {
    redirect(`/tienda/${id}`);
  }

  const llave = {
    id_cliente_id_instrumento: {
      id_cliente: cliente.id_cliente,
      id_instrumento: id,
    },
  };

  const actual = await prisma.carritoItem.findUnique({ where: llave });

  // Nunca más piezas de las que hay en existencia
  const nueva = Math.min((actual?.cantidad ?? 0) + cantidad, instrumento.stock_actual);

  await prisma.carritoItem.upsert({
    where: llave,
    update: { cantidad: nueva },
    create: { id_cliente: cliente.id_cliente, id_instrumento: id, cantidad: nueva },
  });

  refrescar();
  redirect("/carrito");
}

export async function cambiarCantidad(formData: FormData) {
  const cliente = await clienteActual();

  const id = Number(formData.get("id"));
  const cantidad = Number(formData.get("cantidad"));
  if (!Number.isInteger(id) || !Number.isInteger(cantidad) || cantidad < 0) {
    return;
  }

  // Cantidad 0 equivale a quitar el producto
  if (cantidad === 0) {
    await prisma.carritoItem.deleteMany({
      where: { id_cliente: cliente.id_cliente, id_instrumento: id },
    });
    refrescar();
    return;
  }

  const instrumento = await prisma.instrumento.findFirst({
    where: { id_instrumento: id, activo: true },
  });
  if (!instrumento) return;

  await prisma.carritoItem.updateMany({
    where: { id_cliente: cliente.id_cliente, id_instrumento: id },
    data: { cantidad: Math.min(cantidad, Math.max(instrumento.stock_actual, 1)) },
  });

  refrescar();
}

export async function quitarDelCarrito(formData: FormData) {
  const cliente = await clienteActual();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await prisma.carritoItem.deleteMany({
    where: { id_cliente: cliente.id_cliente, id_instrumento: id },
  });

  refrescar();
}