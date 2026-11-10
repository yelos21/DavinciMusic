import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Solo responde sí o no. No redirige: sirve para decidir qué botones mostrar.
export async function esAdministrador(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return false;

  const admin = await prisma.administrador.findFirst({
    where: { activo: true, usuario: { authUserId: session.user.id } },
    select: { id_administrador: true },
  });

  return admin !== null;
}