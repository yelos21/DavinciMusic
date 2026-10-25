"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "placeholder:text-[#8a8577] focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendiente, setPendiente] = useState(false);
  const [correo, setCorreo] = useState("");
  const [reenviado, setReenviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (password !== String(form.get("confirm"))) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { data, error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email,
      password,
      callbackURL: "/",
    });
    setLoading(false);

    if (error) {
      setError(error.message ?? "No se pudo crear la cuenta.");
      return;
    }

    // Sin sesión: la verificación de correo es obligatoria
    if (!data?.token) {
      setCorreo(email);
      setPendiente(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function reenviar() {
    await authClient.sendVerificationEmail({ email: correo, callbackURL: "/" });
    setReenviado(true);
  }

  // Pantalla de espera mientras el usuario verifica su correo
  if (pendiente) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-serif text-4xl font-semibold">Revisa tu correo</h1>
        <p className="text-[#B8B2A3]">
          Enviamos un enlace de verificación a <strong>{correo}</strong>. Ábrelo
          para activar tu cuenta. Es válido por 1 hora.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={reenviar}
          disabled={reenviado}
          className="self-start"
        >
          {reenviado ? "Enlace reenviado" : "Reenviar enlace"}
        </Button>
        <Link
          href="/login"
          className="text-sm text-[#C9A24B] hover:text-[#DDB95F]"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="font-serif text-4xl font-semibold">Crear cuenta</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Tu nombre"
          className={inputClass}
        />
      </div>

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

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña (mínimo 8 caracteres)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className="text-sm font-medium">
          Confirmar contraseña
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={loading}>
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-[#B8B2A3]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#C9A24B] hover:text-[#DDB95F]">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}