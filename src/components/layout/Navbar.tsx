"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const enlaces = [
  { href: "/tienda", label: "Tienda" },
  { href: "/escuela", label: "Escuela" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function cerrarSesion() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between border-b border-[#33333a] bg-[#17171A] px-8 py-4 text-[#F5F1E8]">
      <Link href="/" className="font-serif text-2xl font-bold text-[#C9A24B]">
        Davinci Music
      </Link>

      <div className="flex items-center gap-6 text-sm font-medium">
        {enlaces.map((enlace) => (
          <Link
            key={enlace.label}
            href={enlace.href}
            className="hover:text-[#DDB95F]"
          >
            {enlace.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm font-medium">
        {isPending ? null : session ? (
          <>
            <span>Hola, {session.user.name}</span>
            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-full border border-[#C9A24B] px-4 py-2 text-[#C9A24B] hover:bg-[#C9A24B]/10"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link href="/registro" className="hover:text-[#DDB95F]">
              Registro
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[#C9A24B] px-4 py-2 text-[#C9A24B] hover:bg-[#C9A24B]/10"
            >
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}