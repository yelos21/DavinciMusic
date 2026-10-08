import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import { inicioDelDia, peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

const STOCK_BAJO = 3;

export default async function AdminPage() {
  const { session } = await requireAdmin();

  const [ventasHoy, totalInstrumentos, totalClientes, porReponer] =
    await Promise.all([
      prisma.venta.findMany({
        where: { fecha_venta: { gte: inicioDelDia() } },
        include: { detalles: true },
      }),
      prisma.instrumento.count(),
      prisma.cliente.count(),
      prisma.instrumento.findMany({
        where: { activo: true, stock_actual: { lt: STOCK_BAJO } },
        orderBy: { stock_actual: "asc" },
      }),
    ]);

  const totalHoy = ventasHoy
    .flatMap((v) => v.detalles)
    .reduce((suma, d) => suma + d.cantidad * Number(d.precio_unitario), 0);

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">
        Panel de administración
      </h1>
      <p className="mt-2 text-[#B8B2A3]">Hola, {session.user.name}</p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/inventario"
          className="rounded-lg border border-[#C9A24B] px-5 py-3 text-sm font-semibold text-[#C9A24B] hover:bg-[#C9A24B]/10"
        >
          Inventario
        </Link>
        <Link
          href="/admin/ventas"
          className="rounded-lg border border-[#C9A24B] px-5 py-3 text-sm font-semibold text-[#C9A24B] hover:bg-[#C9A24B]/10"
        >
          Ventas
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Ventas de hoy" valor={ventasHoy.length} />
        <StatCard titulo="Total vendido hoy" valor={peso(totalHoy)} />
        <StatCard titulo="Instrumentos" valor={totalInstrumentos} />
        <StatCard titulo="Clientes" valor={totalClientes} />
      </div>

      <section className="mt-10 max-w-2xl">
        <h2 className="font-serif text-2xl font-semibold">Por reponer</h2>

        {porReponer.length === 0 ? (
          <p className="mt-3 text-[#B8B2A3]">
            Todo el inventario tiene stock suficiente.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#26262b] rounded-2xl bg-[#17171A]">
            {porReponer.map((i) => (
              <li
                key={i.id_instrumento}
                className="flex items-center justify-between px-5 py-3"
              >
                <span>{i.nombre_instrumento}</span>
                <span
                  className={
                    i.stock_actual === 0 ? "text-red-400" : "text-[#C9A24B]"
                  }
                >
                  {i.stock_actual === 0
                    ? "Agotado"
                    : `${i.stock_actual} en stock`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}