import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  await requireAdmin();

  const ventas = await prisma.venta.findMany({
    include: { cliente: { include: { usuario: true } }, detalles: true },
    orderBy: { fecha_venta: "desc" },
    take: 20,
  });

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al panel
      </Link>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Ventas</h1>
          <p className="mt-2 text-[#B8B2A3]">Últimas {ventas.length} ventas</p>
        </div>
        <Link
          href="/admin/ventas/nueva"
          className="rounded-lg bg-[#C9A24B] px-5 py-3 text-sm font-semibold text-[#0F0F10] hover:bg-[#DDB95F]"
        >
          Nueva venta
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-[#17171A]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#33333a] text-[#B8B2A3]">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 text-right font-medium">Productos</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => {
              const total = v.detalles.reduce(
                (suma, d) => suma + d.cantidad * Number(d.precio_unitario),
                0,
              );
              const piezas = v.detalles.reduce((suma, d) => suma + d.cantidad, 0);

              return (
                <tr key={v.id_venta} className="border-b border-[#26262b] last:border-0">
                  <td className="px-4 py-3">{v.fecha_venta.toLocaleString("es-MX")}</td>
                  <td className="px-4 py-3">{v.cliente.usuario.nombre}</td>
                  <td className="px-4 py-3 text-[#B8B2A3]">{v.metodo_pago}</td>
                  <td className="px-4 py-3 text-right">{piezas}</td>
                  <td className="px-4 py-3 text-right text-[#C9A24B]">
                    {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ventas.length === 0 && (
          <p className="p-6 text-[#B8B2A3]">Todavía no hay ventas registradas.</p>
        )}
      </div>
    </main>
  );
}