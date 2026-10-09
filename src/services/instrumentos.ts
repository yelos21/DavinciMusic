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


export async function obtenerDestacados(cantidad = 4) {
  return prisma.instrumento.findMany({
    where: {activo: true, stock_actual: {gt: 0}},
    include : {categoria: true},
    orderBy: { id_instrumento: "desc" },
    take: cantidad,
  })

}