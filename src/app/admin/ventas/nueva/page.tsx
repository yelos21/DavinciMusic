import Link from "next/link";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { registrarVenta } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

const mensajes: Record<string, string> = {
  datos: "Elige un cliente, un método de pago y al menos un producto.",
  stock: "No hay stock suficiente para alguno de los productos. No se registró la venta.",
  servidor: "No se pudo registrar la venta. Intenta de nuevo.",
};

export default async function NuevaVentaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  const clientes = await prisma.cliente.findMany({
    include: { usuario: true },
    orderBy: { id_cliente: "asc" },
  });
  const instrumentos = await prisma.instrumento.findMany({
    where: { activo: true, stock_actual: { gt: 0 } },
    orderBy: { nombre_instrumento: "asc" },
  });

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin/ventas" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver a ventas
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold">Nueva venta</h1>

      <form action={registrarVenta} className="mt-8 flex max-w-3xl flex-col gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="cliente" className="text-sm font-medium">Cliente</label>
            <select id="cliente" name="cliente" required className={inputClass}>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.usuario.nombre} ({c.usuario.correo})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="metodo_pago" className="text-sm font-medium">Método de pago</label>
            <select id="metodo_pago" name="metodo_pago" required className={inputClass}>
              <option>Efectivo</option>
              <option>Tarjeta</option>
              <option>Transferencia</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-[#17171A]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-[#33333a] text-[#B8B2A3]">
              <tr>
                <th className="px-4 py-3 font-medium">Instrumento</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-right font-medium">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {instrumentos.map((i) => (
                <tr key={i.id_instrumento} className="border-b border-[#26262b] last:border-0">
                  <td className="px-4 py-3 font-medium">{i.nombre_instrumento}</td>
                  <td className="px-4 py-3 text-right">{i.stock_actual}</td>
                  <td className="px-4 py-3 text-right text-[#C9A24B]">
                    {Number(i.precio_venta).toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      name={`cantidad_${i.id_instrumento}`}
                      min="0"
                      max={i.stock_actual}
                      defaultValue={0}
                      aria-label={`Cantidad de ${i.nombre_instrumento}`}
                      className="h-10 w-20 rounded-lg border border-[#33333a] bg-[#0F0F10] px-3 text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {mensajes[error] ?? mensajes.servidor}
          </p>
        )}

        <Button type="submit" size="lg" className="self-start">
          Registrar venta
        </Button>
      </form>
    </main>
  );
}