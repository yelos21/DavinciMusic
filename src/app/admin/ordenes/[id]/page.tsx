import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { cancelarOrden, recibirMercancia } from "../actions";

export const dynamic = "force-dynamic";

const mensajes: Record<string, string> = {
  estado: "La orden ya no admite recepciones.",
  cantidad: "Revisa las cantidades: no puedes recibir más de lo que falta.",
  vacio: "Escribe al menos una cantidad a recibir.",
  servidor: "No se pudo registrar la recepción. Intenta de nuevo.",
};

export default async function OrdenDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error, ok } = await searchParams;

  const idOrden = Number(id);
  if (!Number.isInteger(idOrden)) notFound();

  const orden = await prisma.ordenAbastecimiento.findUnique({
    where: { id_orden: idOrden },
    include: {
      proveedor: true,
      detalles: { include: { instrumento: true }, orderBy: { id_instrumento: "asc" } },
    },
  });
  if (!orden) notFound();

  const total = orden.detalles.reduce(
    (suma, d) => suma + d.cantidad_solicitada * Number(d.costo_unitario),
    0,
  );
  const puedeRecibir = orden.estado_orden === "Pendiente" || orden.estado_orden === "Parcial";
  const puedeCancelar = orden.estado_orden === "Pendiente";

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin/ordenes" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver a órdenes
      </Link>

      <h1 className="mt-4 font-serif text-4xl font-semibold">Orden #{orden.id_orden}</h1>
      <p className="mt-2 text-[#B8B2A3]">
        {orden.proveedor.nombre_proveedor} · {orden.fecha_orden.toLocaleDateString("es-MX")} ·{" "}
        <span className="text-[#C9A24B]">{orden.estado_orden}</span> · Total {peso(total)}
      </p>

      {ok && (
        <p role="status" className="mt-4 text-sm text-green-400">
          Recepción registrada. El stock ya se actualizó.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {mensajes[error] ?? mensajes.servidor}
        </p>
      )}

      <form action={recibirMercancia} className="mt-8 flex max-w-3xl flex-col gap-6">
        <input type="hidden" name="id" value={orden.id_orden} />

        <div className="overflow-x-auto rounded-2xl bg-[#17171A]">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-[#33333a] text-[#B8B2A3]">
              <tr>
                <th className="px-4 py-3 font-medium">Instrumento</th>
                <th className="px-4 py-3 text-right font-medium">Pedido</th>
                <th className="px-4 py-3 text-right font-medium">Recibido</th>
                <th className="px-4 py-3 text-right font-medium">Costo</th>
                {puedeRecibir && (
                  <th className="px-4 py-3 text-right font-medium">Recibir ahora</th>
                )}
              </tr>
            </thead>
            <tbody>
              {orden.detalles.map((d) => {
                const falta = d.cantidad_solicitada - d.cantidad_recibida;
                return (
                  <tr key={d.id_instrumento} className="border-b border-[#26262b] last:border-0">
                    <td className="px-4 py-3 font-medium">{d.instrumento.nombre_instrumento}</td>
                    <td className="px-4 py-3 text-right">{d.cantidad_solicitada}</td>
                    <td className="px-4 py-3 text-right">{d.cantidad_recibida}</td>
                    <td className="px-4 py-3 text-right text-[#C9A24B]">
                      {peso(Number(d.costo_unitario))}
                    </td>
                    {puedeRecibir && (
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          name={`recibir_${d.id_instrumento}`}
                          min="0"
                          max={falta}
                          defaultValue={0}
                          disabled={falta === 0}
                          aria-label={`Recibir ${d.instrumento.nombre_instrumento}`}
                          className="h-10 w-24 rounded-lg border border-[#33333a] bg-[#0F0F10] px-3 text-right disabled:opacity-40"
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {puedeRecibir && (
          <Button type="submit" size="lg" className="self-start">
            Registrar recepción
          </Button>
        )}
      </form>

      {puedeCancelar && (
        <form action={cancelarOrden} className="mt-6">
          <input type="hidden" name="id" value={orden.id_orden} />
          <button type="submit" className="text-sm text-red-400 hover:text-red-300">
            Cancelar orden
          </button>
        </form>
      )}
    </main>
  );
}