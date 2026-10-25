"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const nueva = String(form.get("password"));

    if (nueva !== String(form.get("confirm"))) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: nueva,
      token,
    });
    setLoading(false);

    if (error) {
      setError("El enlace venció o ya se usó. Pide uno nuevo.");
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="font-serif text-4xl font-semibold">Nueva contraseña</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña (mínimo 8 caracteres)
        </label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className="text-sm font-medium">
          Confirmar contraseña
        </label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={loading}>
        Guardar contraseña
      </Button>
    </form>
  );
}