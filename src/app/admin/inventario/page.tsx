import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

const STOCK_BAJO = 3;

export default async function InventarioPage() {
  await requireAdmin();

  const instrumentos = await prisma.instrumento.findMany({
    include: { categoria: true },
    orderBy: [{ id_categoria: "asc" }, { nombre_instrumento: "asc" }],
  });

  const conStockBajo = instrumentos.filter(
    (i) => i.activo && i.stock_actual < STOCK_BAJO,
  ).length;

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 font-serif text-4xl font-semibold">Inventario</h1>
      <p className="mt-2 text-[#B8B2A3]">
        {instrumentos.length} instrumentos · {conStockBajo} con stock bajo
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-[#17171A]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#33333a] text-[#B8B2A3]">
            <tr>
              <th className="px-4 py-3 font-medium">Instrumento</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 text-right font-medium">Precio</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {instrumentos.map((i) => {
              const agotado = i.stock_actual === 0;
              const bajo = !agotado && i.stock_actual < STOCK_BAJO;

              return (
                <tr key={i.id_instrumento} className="border-b border-[#26262b] last:border-0">
                  <td className="px-4 py-3 font-medium">{i.nombre_instrumento}</td>
                  <td className="px-4 py-3 text-[#B8B2A3]">
                    {i.categoria.nombre_categoria}
                  </td>
                  <td className="px-4 py-3 text-[#B8B2A3]">{i.marca ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[#C9A24B]">
                    {Number(i.precio_venta).toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">{i.stock_actual}</td>
                  <td className="px-4 py-3">
                    {!i.activo ? (
                      <span className="rounded-md bg-[#33333a] px-2.5 py-1 text-xs font-semibold">
                        Inactivo
                      </span>
                    ) : agotado ? (
                      <span className="rounded-md bg-[#8B1E2D] px-2.5 py-1 text-xs font-semibold text-white">
                        Agotado
                      </span>
                    ) : bajo ? (
                      <span className="rounded-md bg-[#8B1E2D] px-2.5 py-1 text-xs font-semibold text-white">
                        Stock bajo
                      </span>
                    ) : (
                      <span className="text-xs text-[#B8B2A3]">Disponible</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}