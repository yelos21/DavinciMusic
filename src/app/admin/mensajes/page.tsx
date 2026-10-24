import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { marcarLeido } from "./actions";

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  await requireAdmin();

  const mensajes = await prisma.mensajeContacto.findMany({
    orderBy: { fecha_envio: "desc" },
    take: 50,
  });
  const sinLeer = mensajes.filter((m) => !m.leido).length;

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al panel
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold">Mensajes</h1>
      <p className="mt-2 text-[#B8B2A3]">
        {mensajes.length} mensajes · {sinLeer} sin leer
      </p>

      {mensajes.length === 0 ? (
        <p className="mt-8 text-[#B8B2A3]">Todavía no hay mensajes.</p>
      ) : (
        <ul className="mt-8 flex max-w-3xl flex-col gap-4">
          {mensajes.map((m) => (
            <li
              key={m.id_mensaje}
              className={`rounded-2xl bg-[#17171A] p-5 ${
                m.leido ? "" : "border border-[#C9A24B]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{m.nombre}</p>
                <span className="rounded-md bg-[#1F1F24] px-2.5 py-1 text-xs text-[#C9A24B]">
                  {m.asunto}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#B8B2A3]">
                {m.correo}
                {m.telefono ? ` · ${m.telefono}` : ""} ·{" "}
                {m.fecha_envio.toLocaleString("es-MX")}
              </p>
              <p className="mt-3 whitespace-pre-wrap">{m.mensaje}</p>

              {!m.leido && (
                <form action={marcarLeido} className="mt-4">
                  <input type="hidden" name="id" value={m.id_mensaje} />
                  <button
                    type="submit"
                    className="rounded-lg border border-[#C9A24B] px-4 py-2 text-sm font-semibold text-[#C9A24B] hover:bg-[#C9A24B]/10"
                  >
                    Marcar como leído
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}