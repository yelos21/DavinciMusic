import { prisma } from "@/lib/prisma";

export async function obtenerCategorias() {
  return prisma.categoriaInstrumento.findMany({
    include: {
      _count: {
        select: { instrumentos: { where: { activo: true } } },
      },
    },
    orderBy: { nombre_categoria: "asc" },
  });
}