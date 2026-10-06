"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function crearInstrumento(formData: FormData) {
    await requireAdmin();
    const nombre = String(formData.get("nombre") ?? "").trim();
    const marca = String(formData.get("marca") ?? "").trim();
    const modelo = String(formData.get("modelo") ?? "").trim();
    const categoria = Number(formData.get("categoria"));
    const precio = Number(formData.get("precio"));
    const stock = Number(formData.get("stock"));

    if(!nombre || !Number.isInteger(categoria) || categoria <= 0 || isNaN(precio) || precio < 0 || !Number.isInteger(stock) || stock < 0) {
    redirect("/admin/inventario/nuevo?error=1");
  }

    await prisma.instrumento.create({
    data: {
        nombre_instrumento: nombre,
        marca,
        modelo,
        id_categoria: categoria,
        precio_venta: precio,
        stock_actual: stock,
    },
    });

    revalidatePath("/admin/inventario");

    redirect("/admin/inventario");
}