import Link from "next/link";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { crearOrden } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

const celda =
  "h-10 w-24 rounded-lg border border-[#33333a] bg-[#0F0F10] px-3 text-right";

export default async function NuevaOrdenPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  const [proveedores, instrumentos] = await Promise.all([
    prisma.proveedor.findMany({
      where: { activo: true },
      orderBy: { nombre_proveedor: "asc" },
    }),
    prisma.instrumento.findMany({
      where: { activo: true },
      orderBy: [{ stock_actual: "asc" }, { nombre_instrumento: "asc" }],
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin/ordenes" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver a órdenes
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold">Nueva orden de abastecimiento</h1>

      {proveedores.length === 0 ? (
        <p className="mt-8 text-[#B8B2A3]">
          Primero registra un proveedor activo en{" "}
          <Link href="/admin/proveedores/nuevo" className="text-[#C9A24B]">
            Proveedores
          </Link>
          .
        </p>
      ) : (
        <form action={crearOrden} className="mt-8 flex max-w-3xl flex-col gap-6">
          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor="proveedor" className="text-sm font-medium">Proveedor</label>
            <select id="proveedor" name="proveedor" required className={inputClass}>
              {proveedores.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre_proveedor}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-[#B8B2A3]">
            Los productos con menos stock aparecen primero. Deja la cantidad en 0
            en lo que no quieras pedir.
          </p>

          <div className="overflow-x-auto rounded-2xl bg-[#17171A]">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-[#33333a] text-[#B8B2A3]">
                <tr>
                  <th className="px-4 py-3 font-medium">Instrumento</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                  <th className="px-4 py-3 text-right font-medium">Costo unitario</th>
                </tr>
              </thead>
              <tbody>
                {instrumentos.map((i) => (
                  <tr key={i.id_instrumento} className="border-b border-[#26262b] last:border-0">
                    <td className="px-4 py-3 font-medium">{i.nombre_instrumento}</td>
                    <td
                      className={`px-4 py-3 text-right ${
                        i.stock_actual < 3 ? "text-red-400" : ""
                      }`}
                    >
                      {i.stock_actual}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        name={`cantidad_${i.id_instrumento}`}
                        min="0"
                        defaultValue={0}
                        aria-label={`Cantidad de ${i.nombre_instrumento}`}
                        className={celda}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        name={`costo_${i.id_instrumento}`}
                        min="0"
                        step="0.01"
                        aria-label={`Costo unitario de ${i.nombre_instrumento}`}
                        className={celda}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              Elige un proveedor y al menos un producto. Cada producto con cantidad
              necesita su costo unitario mayor a 0.
            </p>
          )}

          <Button type="submit" size="lg" className="self-start">
            Crear orden
          </Button>
        </form>
      )}
    </main>
  );
}