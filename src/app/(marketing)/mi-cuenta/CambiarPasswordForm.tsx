"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#0F0F10] px-4 text-[#F5F1E8] " +
  "focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

export default function CambiarPasswordForm() {
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk(false);

    const formEl = e.currentTarget; 
    const form = new FormData(formEl);
    const nueva = String(form.get("nueva"));

    if (nueva !== String(form.get("confirmar"))) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("actual")),
      newPassword: nueva,
      revokeOtherSessions: true,
    });
    setLoading(false);

    if (error) {
      setError("No se pudo cambiar. Revisa tu contraseña actual.");
      return;
    }

    formEl.reset();
    setOk(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="actual" className="text-sm font-medium">Contraseña actual</label>
        <input id="actual" name="actual" type="password" required autoComplete="current-password" className={inputClass} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="nueva" className="text-sm font-medium">Contraseña nueva (mínimo 8 caracteres)</label>
        <input id="nueva" name="nueva" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmar" className="text-sm font-medium">Confirmar contraseña nueva</label>
        <input id="confirmar" name="confirmar" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {ok && <p role="status" className="text-sm text-green-400">Contraseña actualizada. Cerramos tus otras sesiones.</p>}

      <Button type="submit" loading={loading} className="self-start">
        Cambiar contraseña
      </Button>
    </form>
  );
}