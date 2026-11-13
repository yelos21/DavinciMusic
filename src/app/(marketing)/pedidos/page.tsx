import Link from "next/link";
import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/sesion";
import { cancelarMiPedido } from "./actions";

export const dynamic = "force-dynamic";

// Datos de EJEMPLO: reemplázalos por los reales de la tienda
const DATOS_TRANSFERENCIA = {
  banco: "[Banco de ejemplo]",
  clabe: "[CLABE de ejemplo]",
  titular: "[Titular de ejemplo]",
};

export default async function MisPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{
    nuevo?: string;
    cancelado?: string;
    error?: string;
    pago?: string;
  }>;
}) {
  const { usuario } = await requireUser();
  const { nuevo, cancelado, error, pago } = await searchParams;

  const cliente = await prisma.cliente.findUnique({
    where: { id_usuario: usuario.id_usuario },
  });

  const pedidos = cliente
    ? await prisma.pedido.findMany({
        where: { id_cliente: cliente.id_cliente },
        include: { detalles: { include: { instrumento: true } } },
        orderBy: { id_pedido: "desc" },
        take: 20,
      })
    : [];

  // Solo se muestra la confirmación si el pedido es de esta persona
  const idNuevo = Number(nuevo);
  const pedidoNuevo = pedidos.find((p) => p.id_pedido === idNuevo);

  return (
    <div className="bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">Mis pedidos</h1>

      {pedidoNuevo && (
        <div role="status" className="mt-6 max-w-2xl rounded-2xl border border-[#C9A24B] bg-[#17171A] p-5">
          <p className="font-semibold text-[#C9A24B]">
            ¡Gracias! Tu pedido #{pedidoNuevo.id_pedido} quedó registrado.
          </p>
          {pedidoNuevo.metodo_pago === "Transferencia" ? (
            <div className="mt-2 text-sm text-[#B8B2A3]">
              <p>Para confirmarlo, haz tu transferencia y avísanos desde Contacto indicando el número de pedido.</p>
              <p className="mt-2">
                {DATOS_TRANSFERENCIA.banco} · CLABE {DATOS_TRANSFERENCIA.clabe} · {DATOS_TRANSFERENCIA.titular}
              </p>
            </div>
          ) : pedidoNuevo.metodo_pago === "Tarjeta" ? (
            <p className="mt-2 text-sm text-[#B8B2A3]">
              Estamos confirmando tu pago con Stripe. En unos segundos tu pedido pasará a
              &quot;Pagado&quot;; recarga la página si aún aparece como pendiente.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#B8B2A3]">
              Apartamos tus productos. Pasa por ellos a la tienda y paga ahí.
            </p>
          )}
        </div>
      )}

      {cancelado && (
        <p role="status" className="mt-4 text-sm text-green-400">
          Pedido cancelado. Las piezas regresaron al inventario.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          Ese pedido ya no se puede cancelar desde aquí.
        </p>
      )}

      {pago === "cancelado" && (
        <p role="status" className="mt-4 text-sm text-[#C9A24B]">
          No se completó el pago. Puedes cancelar el pedido abajo, o se cancelará solo
          en unos 30 minutos y las piezas regresarán al inventario.
        </p>
      )}

      {pedidos.length === 0 ? (
        <div className="mt-8">
          <p className="text-[#B8B2A3]">Todavía no tienes pedidos.</p>
          <Link href="/tienda" className="mt-2 inline-block text-[#C9A24B] hover:text-[#DDB95F]">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex max-w-3xl flex-col gap-4">
          {pedidos.map((p) => {
            const total = p.detalles.reduce(
              (suma, d) => suma + d.cantidad * Number(d.precio_unitario),
              0,
            );

            return (
              <li key={p.id_pedido} className="rounded-2xl bg-[#17171A] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    Pedido #{p.id_pedido} · {p.fecha_pedido.toLocaleDateString("es-MX")}
                  </p>
                  <span className="rounded-md bg-[#1F1F24] px-2.5 py-1 text-xs font-semibold text-[#C9A24B]">
                    {p.estado_pedido}
                  </span>
                </div>

                <ul className="mt-3 text-sm text-[#B8B2A3]">
                  {p.detalles.map((d) => (
                    <li key={d.id_instrumento}>
                      {d.cantidad} × {d.instrumento.nombre_instrumento}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#B8B2A3]">Pago: {p.metodo_pago}</p>
                  <p className="text-xl font-semibold text-[#C9A24B]">{peso(total)}</p>
                </div>

                {p.estado_pedido === "Pendiente" && (
                  <form action={cancelarMiPedido} className="mt-3">
                    <input type="hidden" name="id" value={p.id_pedido} />
                    <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                      Cancelar pedido
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}