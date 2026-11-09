import { prisma } from "@/lib/prisma";

export type FiltrosTienda = {
  categoria?: number;
  q?: string;
};

export async function obtenerInstrumentos(filtros: FiltrosTienda = {}) {
  const { categoria, q } = filtros;

  return prisma.instrumento.findMany({
    where: {
      activo: true,
      ...(categoria ? { id_categoria: categoria } : {}),
      ...(q
        ? {
            OR: [
              { nombre_instrumento: { contains: q, mode: "insensitive" as const } },
              { marca: { contains: q, mode: "insensitive" as const } },
              { modelo: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { categoria: true },
    orderBy: { nombre_instrumento: "asc" },
  });
}

// Tipo de un instrumento tal como lo devuelve el servicio
export type InstrumentoConCategoria = Awaited<
  ReturnType<typeof obtenerInstrumentos>
>[number];

export async function obtenerDestacados(cantidad = 4) {
  return prisma.instrumento.findMany({
    where: { activo: true, stock_actual: { gt: 0 } },
    include: { categoria: true },
    orderBy: { id_instrumento: "desc" },
    take: cantidad,
  });
}

// Solo instrumentos activos: uno desactivado no debe verse en la tienda
export async function obtenerInstrumento(id: number) {
  return prisma.instrumento.findFirst({
    where: { id_instrumento: id, activo: true },
    include: { categoria: true },
  });
}

export async function obtenerRelacionados(
  idCategoria: number,
  excluirId: number,
  cantidad = 4,
) {
  return prisma.instrumento.findMany({
    where: {
      activo: true,
      id_categoria: idCategoria,
      id_instrumento: { not: excluirId },
    },
    include: { categoria: true },
    orderBy: { id_instrumento: "desc" },
    take: cantidad,
  });
}