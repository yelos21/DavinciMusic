import {prisma} from "@/lib/prisma"

export async function ObtenerMaestros() {
    return prisma.maestro.findMany({
        where: {activo: true},
        include: {usuario: true},
        orderBy: {especialidad: "asc"},
    });
}

export type MaestroConUsuario = Awaited<ReturnType<typeof ObtenerMaestros>> [number];