import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Total de piezas en el carrito de quien tiene sesión (0 si no hay sesión)
export async function contarCarrito(): Promise<number> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return 0;

  const resultado = await prisma.carritoItem.aggregate({
    _sum: { cantidad: true },
    where: { cliente: { usuario: { authUserId: session.user.id } } },
  });

  return resultado._sum.cantidad ?? 0;
}