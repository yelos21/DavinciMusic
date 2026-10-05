import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
 

export default async function AdminPage() {
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


   const totalInstrumentos = await prisma.instrumento.count();
  
  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">
        Panel de administración
      </h1>
      <p className="mt-2 text-[#B8B2A3]">Hola, {session.user.name}</p>
 
      <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#17171A] p-6">
          <p className="text-sm text-[#B8B2A3]">Instrumentos registrados</p>
          <p className="mt-1 text-3xl font-semibold text-[#C9A24B]">
            {totalInstrumentos}
          </p>
        </div>
      </div>
    </main>
  );
}
 
