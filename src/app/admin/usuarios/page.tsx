import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import {
  asignarAdministrador,
  asignarMaestro,
  quitarAdministrador,
  quitarMaestro,
} from "./actions";

export const dynamic = "force-dynamic";

const errores: Record<string, string> = {
  especialidad: "Escribe una especialidad de 2 a 60 caracteres.",
  usuario: "No se encontró al usuario.",
  sincuenta:
    "Esa persona todavía no tiene una cuenta para entrar. Pídele que se registre primero.",
  tumismo: "No puedes quitarte el acceso a ti mismo.",
  ultimo: "Debe quedar al menos un administrador activo.",
};

const exitos: Record<string, string> = {
  maestro: "Rol de maestro asignado.",
  admin: "Rol de administrador asignado.",
  quitado: "Rol retirado.",
};

const insignia = "rounded-md bg-[#1F1F24] px-2.5 py-1 text-xs font-semibold text-[#C9A24B]";
const insigniaGris = "rounded-md bg-[#33333a] px-2.5 py-1 text-xs font-semibold";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { admin: yo } = await requireAdmin();
  const { error, ok } = await searchParams;

  const usuarios = await prisma.usuario.findMany({
    include: { cliente: true, maestro: true, administrador: true },
    orderBy: { id_usuario: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 font-serif text-4xl font-semibold">Usuarios y roles</h1>
      <p className="mt-2 max-w-2xl text-[#B8B2A3]">
        Las personas se registran solas desde el sitio y aquí se les asigna un rol.
        Dar el rol de administrador da acceso completo al panel: asígnalo con cuidado.
      </p>

      {ok && (
        <p role="status" className="mt-4 text-sm text-green-400">
          {exitos[ok] ?? "Listo."}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {errores[error] ?? "No se pudo completar la acción."}
        </p>
      )}

      <ul className="mt-8 flex max-w-4xl flex-col gap-4">
        {usuarios.map((u) => {
          const esMaestro = u.maestro?.activo === true;
          const esAdmin = u.administrador?.activo === true;
          const soyYo = u.administrador?.id_administrador === yo.id_administrador;

          return (
            <li key={u.id_usuario} className="rounded-2xl bg-[#17171A] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {u.nombre} {u.apellido_paterno ?? ""}
                    {soyYo && <span className="ml-2 text-xs text-[#B8B2A3]">(tú)</span>}
                  </p>
                  <p className="text-sm text-[#B8B2A3]">{u.correo}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {u.cliente && <span className={insigniaGris}>Cliente</span>}
                  {esMaestro && (
                    <span className={insignia}>Maestro · {u.maestro?.especialidad}</span>
                  )}
                  {esAdmin && <span className={insignia}>Administrador</span>}
                  {!u.authUserId && (
                    <span className={insigniaGris}>Sin acceso al sitio</span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#26262b] pt-4">
                {/* Maestro */}
                {esMaestro ? (
                  <form action={quitarMaestro}>
                    <input type="hidden" name="id" value={u.id_usuario} />
                    <button type="submit" className="text-sm text-[#B8B2A3] hover:text-[#F5F1E8]">
                      Quitar rol de maestro
                    </button>
                  </form>
                ) : (
                  <form action={asignarMaestro} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id_usuario} />
                    <input
                      name="especialidad"
                      required
                      maxLength={60}
                      placeholder="Especialidad"
                      aria-label={`Especialidad de ${u.nombre}`}
                      className="h-9 w-40 rounded-lg border border-[#33333a] bg-[#0F0F10] px-3 text-sm"
                    />
                    <button type="submit" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
                      {u.maestro ? "Reactivar maestro" : "Hacer maestro"}
                    </button>
                  </form>
                )}

                {/* Administrador */}
                {esAdmin ? (
                  !soyYo && (
                    <form action={quitarAdministrador}>
                      <input type="hidden" name="id" value={u.id_usuario} />
                      <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                        Quitar rol de administrador
                      </button>
                    </form>
                  )
                ) : u.authUserId ? (
                  <form action={asignarAdministrador}>
                    <input type="hidden" name="id" value={u.id_usuario} />
                    <button type="submit" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
                      {u.administrador ? "Reactivar administrador" : "Hacer administrador"}
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}