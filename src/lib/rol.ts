import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function esAdministrador(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return false;

  const admin = await prisma.administrador.findFirst({
    where: { usuario: { authUserId: session.user.id}},
    select: {id_administrador: true}
  });

  return Boolean(admin);
}
