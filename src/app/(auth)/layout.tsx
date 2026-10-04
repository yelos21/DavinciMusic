import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-[#0F0F10] text-[#F5F1E8] lg:grid-cols-2">
      {/* Panel de marca (solo en pantallas grandes) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#17171A] p-16 lg:flex">
        <Link
          href="/"
          className="font-serif text-2xl font-bold text-[#C9A24B]"
        >
          Davinci Music
        </Link>

        {/* Trazo geométrico decorativo */}
        <svg
          aria-hidden="true"
          viewBox="0 0 620 620"
          fill="none"
          stroke="#C9A24B"
          strokeWidth="1"
          className="absolute -right-20 top-40 size-[520px] opacity-15"
        >
          <circle cx="310" cy="310" r="290" />
          <rect x="60" y="60" width="500" height="500" />
          <circle cx="310" cy="310" r="180" />
          <path d="M310 20V600M20 310H600M105 105L515 515M515 105L105 515" />
        </svg>

        <p className="relative max-w-md font-serif text-5xl font-bold leading-tight">
          Bienvenido a tu música
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}