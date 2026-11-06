import Button from "@/components/ui/Button";
import { requireUser } from "@/lib/sesion";
import { actualizarPerfil } from "./actions";
import CambiarPasswordForm from "./CambiarPasswordForm";

export const dynamic = "force-dynamic";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#0F0F10] px-4 text-[#F5F1E8] " +
  "focus-visible:outline-2 focus-visible:outline-[#C9A24B] disabled:opacity-60";

export default async function MiCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string; error?: string }>;
}) {
  const { session, usuario } = await requireUser();
  const { guardado, error } = await searchParams;

  return (
    <div className="bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">Mi cuenta</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-[#17171A] p-6">
          <h2 className="font-serif text-2xl font-semibold">Datos personales</h2>

          <form action={actualizarPerfil} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
              <input id="nombre" name="nombre" required defaultValue={usuario.nombre} className={inputClass} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="correo" className="text-sm font-medium">Correo electrónico</label>
              <input id="correo" value={session.user.email} disabled className={inputClass} />
              <p className="text-xs text-[#B8B2A3]">
                {session.user.emailVerified ? "Correo verificado." : "Correo sin verificar."}{" "}
                El correo no se puede cambiar por ahora.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="telefono" className="text-sm font-medium">Teléfono (opcional)</label>
              <input id="telefono" name="telefono" type="tel" defaultValue={usuario.telefono ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="direccion" className="text-sm font-medium">Dirección (opcional)</label>
              <input id="direccion" name="direccion" maxLength={200} defaultValue={usuario.direccion ?? ""} className={inputClass} />
            </div>

            {guardado && <p role="status" className="text-sm text-green-400">Cambios guardados.</p>}
            {error && (
              <p role="alert" className="text-sm text-red-400">
                Revisa los datos: el nombre es obligatorio y el teléfono solo admite números, espacios, + y -.
              </p>
            )}

            <Button type="submit" className="self-start">Guardar cambios</Button>
          </form>
        </section>

        <section className="rounded-2xl bg-[#17171A] p-6">
          <h2 className="font-serif text-2xl font-semibold">Cambiar contraseña</h2>
          <div className="mt-5">
            <CambiarPasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}