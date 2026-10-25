"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "placeholder:text-[#8a8577] focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

export default function RecuperarPage() {
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    // Se ignora el resultado a propósito: la respuesta es igual exista o no el correo
    await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/restablecer",
    });

    setLoading(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-serif text-4xl font-semibold">Revisa tu correo</h1>
        <p className="text-[#B8B2A3]">
          Si existe una cuenta con ese correo, te enviamos un enlace para
          restablecer tu contraseña. Es válido por 1 hora.
        </p>
        <Link href="/login" className="text-[#C9A24B] hover:text-[#DDB95F]">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="font-serif text-4xl font-semibold">Recuperar contraseña</h1>
      <p className="text-[#B8B2A3]">
        Escribe tu correo y te enviaremos un enlace para crear una nueva.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className={inputClass}
        />
      </div>

      <Button type="submit" size="lg" loading={loading}>
        Enviar enlace
      </Button>

      <Link href="/login" className="text-center text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        Volver a iniciar sesión
      </Link>
    </form>
  );
}