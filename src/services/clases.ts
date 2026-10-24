import {prisma} from "@/lib/prisma"


export async function obtenerClases() {
    return prisma.clase.findMany({
        where: { activa: true, periodo: { estado: "Activo" } },
        include:
        {
            maestro: {include: {
                usuario: true
            }},
            instrumento: true,
            horarios: true,
            _count: {
                select: {
                    inscripciones: {
                        where: {estado_inscripcion : "activa"},
                    },
                },
            },

        },
        orderBy: {nombre_clase: "asc"},
    })
}

export type ClaseConDetalle = Awaited<
    ReturnType<typeof obtenerClases>> [number];
