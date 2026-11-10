import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export default async function MisCompras({ idCliente }: { idCliente: number }) {
  const ventas = await prisma.venta.findMany({
    where: { id_cliente: idCliente },
    include: { detalles: { include: { instrumento: true } } },
    orderBy: { fecha_venta: "desc" },
    take: 10,
  });

  return (
    <section className="mt-10">
      <h2 className="font-serif text-3xl font-semibold">Mis compras</h2>

      {ventas.length === 0 ? (
        <p className="mt-4 text-[#B8B2A3]">Todavía no tienes compras registradas.</p>
      ) : (
        <ul className="mt-6 flex max-w-3xl flex-col gap-4">
          {ventas.map((v) => {
            const total = v.detalles.reduce(
              (suma, d) => suma + d.cantidad * Number(d.precio_unitario),
              0,
            );

            return (
              <li key={v.id_venta} className="rounded-2xl bg-[#17171A] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {v.fecha_venta.toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xl font-semibold text-[#C9A24B]">{peso(total)}</p>
                </div>

                <ul className="mt-3 text-sm text-[#B8B2A3]">
                  {v.detalles.map((d) => (
                    <li key={d.id_instrumento}>
                      {d.cantidad} × {d.instrumento.nombre_instrumento}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-xs text-[#B8B2A3]">
                  Pago: {v.metodo_pago} · {v.estado_venta}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}