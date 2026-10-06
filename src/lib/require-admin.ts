import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const admin = await prisma.administrador.findFirst({
    where: { usuario: { authUserId: session.user.id } },
  });
  if (!admin) {
    redirect("/");
  }

  return { session, admin };
}