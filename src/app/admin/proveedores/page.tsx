import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { cambiarEstadoProveedor } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  await requireAdmin();

  const proveedores = await prisma.proveedor.findMany({
    include: { _count: { select: { ordenes: true } } },
    orderBy: { nombre_proveedor: "asc" },
  });

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al panel
      </Link>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Proveedores</h1>
          <p className="mt-2 text-[#B8B2A3]">
            {proveedores.length} proveedores registrados
          </p>
        </div>
        <Link
          href="/admin/proveedores/nuevo"
          className="rounded-lg bg-[#C9A24B] px-5 py-3 text-sm font-semibold text-[#0F0F10] hover:bg-[#DDB95F]"
        >
          Nuevo proveedor
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-[#17171A]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#33333a] text-[#B8B2A3]">
            <tr>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">RFC</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 text-right font-medium">Órdenes</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id_proveedor} className="border-b border-[#26262b] last:border-0">
                <td className="px-4 py-3 font-medium">{p.nombre_proveedor}</td>
                <td className="px-4 py-3 text-[#B8B2A3]">{p.rfc}</td>
                <td className="px-4 py-3 text-[#B8B2A3]">
                  {p.correo}
                  <br />
                  {p.telefono}
                </td>
                <td className="px-4 py-3 text-right">{p._count.ordenes}</td>
                <td className="px-4 py-3">
                  {p.activo ? (
                    <span className="text-xs text-[#B8B2A3]">Activo</span>
                  ) : (
                    <span className="rounded-md bg-[#33333a] px-2.5 py-1 text-xs font-semibold">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={cambiarEstadoProveedor}>
                    <input type="hidden" name="id" value={p.id_proveedor} />
                    <button
                      type="submit"
                      className="text-xs text-[#C9A24B] hover:text-[#DDB95F]"
                    >
                      {p.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {proveedores.length === 0 && (
          <p className="p-6 text-[#B8B2A3]">Todavía no hay proveedores registrados.</p>
        )}
      </div>
    </main>
  );
}