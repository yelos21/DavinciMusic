import Link from "next/link";
import { peso } from "@/lib/formato";
import { TRANSICIONES } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { cambiarEstadoPedido } from "./actions";

export const dynamic = "force-dynamic";

const colores: Record<string, string> = {
  Pendiente: "bg-[#C9A24B] text-[#0F0F10]",
  Pagado: "bg-[#1F1F24] text-[#C9A24B]",
  Enviado: "bg-[#1F1F24] text-[#C9A24B]",
  Entregado: "bg-[#33333a] text-[#F5F1E8]",
  Cancelado: "bg-[#8B1E2D] text-white",
};

export default async function PedidosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const { ok, error } = await searchParams;

  const pedidos = await prisma.pedido.findMany({
    include: {
      cliente: { include: { usuario: true } },
      detalles: { include: { instrumento: true } },
    },
    orderBy: { id_pedido: "desc" },
    take: 50,
  });

  const pendientes = pedidos.filter((p) => p.estado_pedido === "Pendiente").length;

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 font-serif text-4xl font-semibold">Pedidos en línea</h1>
      <p className="mt-2 text-[#B8B2A3]">
        {pedidos.length} pedidos · {pendientes} pendientes
      </p>

      {ok && (
        <p role="status" className="mt-4 text-sm text-green-400">Estado actualizado.</p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          Ese cambio de estado no está permitido o el pedido ya cambió.
        </p>
      )}

      {pedidos.length === 0 ? (
        <p className="mt-8 text-[#B8B2A3]">Todavía no hay pedidos.</p>
      ) : (
        <ul className="mt-8 flex max-w-4xl flex-col gap-4">
          {pedidos.map((p) => {
            const total = p.detalles.reduce(
              (suma, d) => suma + d.cantidad * Number(d.precio_unitario),
              0,
            );
            const siguientes = TRANSICIONES[p.estado_pedido] ?? [];
            const cliente = p.cliente.usuario;

            return (
              <li key={p.id_pedido} className="rounded-2xl bg-[#17171A] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    Pedido #{p.id_pedido} · {p.fecha_pedido.toLocaleString("es-MX")}
                  </p>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      colores[p.estado_pedido] ?? "bg-[#33333a]"
                    }`}
                  >
                    {p.estado_pedido}
                  </span>
                </div>

                <p className="mt-2 text-sm text-[#B8B2A3]">
                  {cliente.nombre} {cliente.apellido_paterno ?? ""} · {cliente.correo} ·{" "}
                  {p.telefono_contacto}
                </p>
                <p className="text-sm text-[#B8B2A3]">Envío: {p.direccion_envio}</p>

                <ul className="mt-3 text-sm">
                  {p.detalles.map((d) => (
                    <li key={d.id_instrumento}>
                      {d.cantidad} × {d.instrumento.nombre_instrumento}{" "}
                      <span className="text-[#B8B2A3]">({peso(Number(d.precio_unitario))} c/u)</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#B8B2A3]">Pago: {p.metodo_pago}</p>
                  <p className="text-xl font-semibold text-[#C9A24B]">{peso(total)}</p>
                </div>

                {siguientes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-4 border-t border-[#26262b] pt-4">
                    {siguientes.map((estado) => (
                      <form key={estado} action={cambiarEstadoPedido}>
                        <input type="hidden" name="id" value={p.id_pedido} />
                        <input type="hidden" name="estado" value={estado} />
                        <button
                          type="submit"
                          className={`text-sm ${
                            estado === "Cancelado"
                              ? "text-red-400 hover:text-red-300"
                              : "text-[#C9A24B] hover:text-[#DDB95F]"
                          }`}
                        >
                          {estado === "Cancelado" ? "Cancelar pedido" : `Marcar como ${estado.toLowerCase()}`}
                        </button>
                      </form>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}