import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import { mesTexto } from "@/lib/fechas";
import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { darDeBaja, generarCargo, registrarPago } from "../actions";

export const dynamic = "force-dynamic";

const mensajes: Record<string, string> = {
  estado: "La inscripción ya no está activa.",
  adelantado: "Ya existe el cargo del mes siguiente. No se generan cargos más adelante.",
  metodo: "Elige un método de pago válido.",
  pago: "Ese cargo ya no está pendiente.",
};

const exitos: Record<string, string> = {
  cargo: "Cargo generado.",
  pago: "Pago registrado.",
};

export default async function InscripcionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error, ok } = await searchParams;

  const idInscripcion = Number(id);
  if (!Number.isInteger(idInscripcion)) notFound();

  const inscripcion = await prisma.inscripcionClase.findUnique({
    where: { id_inscripcion: idInscripcion },
    include: {
      cliente: { include: { usuario: true } },
      clase: true,
      pagos: { orderBy: { periodo_pagado: "desc" } },
    },
  });
  if (!inscripcion) notFound();

  const activa = inscripcion.estado_inscripcion === "Activa";
  const ahora = new Date();
  const alumno = inscripcion.cliente.usuario;

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin/inscripciones" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver a inscripciones
      </Link>

      <h1 className="mt-4 font-serif text-4xl font-semibold">
        {alumno.nombre} {alumno.apellido_paterno ?? ""}
      </h1>
      <p className="mt-2 text-[#B8B2A3]">
        {inscripcion.clase.nombre_clase} · {peso(Number(inscripcion.costo_mensual_acordado))} al mes ·{" "}
        <span className="text-[#C9A24B]">{inscripcion.estado_inscripcion}</span>
      </p>

      {ok && (
        <p role="status" className="mt-4 text-sm text-green-400">
          {exitos[ok] ?? "Listo."}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {mensajes[error] ?? "No se pudo completar la acción."}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl bg-[#17171A]">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-[#33333a] text-[#B8B2A3]">
            <tr>
              <th className="px-4 py-3 font-medium">Mes</th>
              <th className="px-4 py-3 text-right font-medium">Importe</th>
              <th className="px-4 py-3 font-medium">Vence</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Cobro</th>
            </tr>
          </thead>
          <tbody>
            {inscripcion.pagos.map((p) => {
              const pendiente = p.estado_pago === "Pendiente";
              const vencido = pendiente && p.fecha_vencimiento < ahora;

              return (
                <tr key={p.id_pago_clase} className="border-b border-[#26262b] last:border-0">
                  <td className="px-4 py-3 font-medium capitalize">{mesTexto(p.periodo_pagado)}</td>
                  <td className="px-4 py-3 text-right text-[#C9A24B]">
                    {peso(Number(p.importe))}
                  </td>
                  <td className="px-4 py-3">{p.fecha_vencimiento.toLocaleDateString("es-MX")}</td>
                  <td className="px-4 py-3">
                    {p.estado_pago === "Pagado" ? (
                      <span className="text-[#B8B2A3]">
                        Pagado ({p.metodo_pago ?? "—"})
                      </span>
                    ) : vencido ? (
                      <span className="rounded-md bg-[#8B1E2D] px-2.5 py-1 text-xs font-semibold text-white">
                        Vencido
                      </span>
                    ) : (
                      <span className="rounded-md bg-[#1F1F24] px-2.5 py-1 text-xs font-semibold text-[#C9A24B]">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {pendiente && (
                      <form action={registrarPago} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={inscripcion.id_inscripcion} />
                        <input type="hidden" name="pago" value={p.id_pago_clase} />
                        <select
                          name="metodo"
                          aria-label="Método de pago"
                          className="h-9 rounded-lg border border-[#33333a] bg-[#0F0F10] px-2 text-xs"
                        >
                          <option>Efectivo</option>
                          <option>Tarjeta</option>
                          <option>Transferencia</option>
                        </select>
                        <button
                          type="submit"
                          className="text-xs text-[#C9A24B] hover:text-[#DDB95F]"
                        >
                          Registrar pago
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {inscripcion.pagos.length === 0 && (
          <p className="p-6 text-[#B8B2A3]">Esta inscripción no tiene cargos.</p>
        )}
      </div>

      {activa && (
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <form action={generarCargo}>
            <input type="hidden" name="id" value={inscripcion.id_inscripcion} />
            <Button type="submit" variant="secondary">
              Generar cargo del mes siguiente
            </Button>
          </form>

          <form action={darDeBaja}>
            <input type="hidden" name="id" value={inscripcion.id_inscripcion} />
            <button type="submit" className="text-sm text-red-400 hover:text-red-300">
              Dar de baja al alumno
            </button>
          </form>
        </div>
      )}
    </main>
  );
}