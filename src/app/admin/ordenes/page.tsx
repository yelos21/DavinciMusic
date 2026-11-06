import Link from "next/link";
import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function OrdenesPage() {
  await requireAdmin();

  const ordenes = await prisma.ordenAbastecimiento.findMany({
    include: { proveedor: true, detalles: true },
    orderBy: { fecha_orden: "desc" },
    take: 30,
  });

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al panel
      </Link>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Órdenes de abastecimiento</h1>
          <p className="mt-2 text-[#B8B2A3]">Últimas {ordenes.length} órdenes</p>
        </div>
        <Link
          href="/admin/ordenes/nueva"
          className="rounded-lg bg-[#C9A24B] px-5 py-3 text-sm font-semibold text-[#0F0F10] hover:bg-[#DDB95F]"
        >
          Nueva orden
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-[#17171A]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#33333a] text-[#B8B2A3]">
            <tr>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o) => {
              const total = o.detalles.reduce(
                (suma, d) => suma + d.cantidad_solicitada * Number(d.costo_unitario),
                0,
              );
              const pendiente = o.estado_orden === "Pendiente" || o.estado_orden === "Parcial";

              return (
                <tr key={o.id_orden} className="border-b border-[#26262b] last:border-0">
                  <td className="px-4 py-3 font-medium">#{o.id_orden}</td>
                  <td className="px-4 py-3">{o.fecha_orden.toLocaleDateString("es-MX")}</td>
                  <td className="px-4 py-3">{o.proveedor.nombre_proveedor}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        pendiente
                          ? "bg-[#C9A24B] text-[#0F0F10]"
                          : "bg-[#33333a] text-[#F5F1E8]"
                      }`}
                    >
                      {o.estado_orden}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#C9A24B]">{peso(total)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/ordenes/${o.id_orden}`}
                      className="text-xs text-[#C9A24B] hover:text-[#DDB95F]"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ordenes.length === 0 && (
          <p className="p-6 text-[#B8B2A3]">Todavía no hay órdenes registradas.</p>
        )}
      </div>
    </main>
  );
}