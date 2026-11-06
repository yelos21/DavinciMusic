import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const usuario =
    (await prisma.usuario.findUnique({
      where: { authUserId: session.user.id },
    })) ??
    (await prisma.usuario.create({
      data: {
        authUserId: session.user.id,
        nombre: session.user.name,
        correo: session.user.email,
        cliente: { create: {} },
      },
    }));

  return { session, usuario };
}