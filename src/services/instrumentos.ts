import {prisma} from "@/lib/prisma";

export async function obtenerInstrumentos() {

  return prisma.instrumento.findMany({
     where: {activo: true },
     include: {categoria: true },
     orderBy: { nombre_instrumento: "asc"},
  });

}

export type InstrumentoConCategoria = Awaited<
  ReturnType<typeof obtenerInstrumentos>
>[number];
