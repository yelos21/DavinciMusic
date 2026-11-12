import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/sesion";
import { cambiarCantidad, quitarDelCarrito } from "./actions";

export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const { usuario } = await requireUser();

  const cliente = await prisma.cliente.findUnique({
    where: { id_usuario: usuario.id_usuario },
  });

  const items = cliente
    ? await prisma.carritoItem.findMany({
        where: { id_cliente: cliente.id_cliente },
        include: { instrumento: true },
        orderBy: { fecha_agregado: "desc" },
      })
    : [];

  // Lo que ya no está disponible no cuenta para el total
  const lineas = items.map((i) => {
    const disponible = i.instrumento.activo && i.instrumento.stock_actual > 0;
    const cantidad = disponible ? Math.min(i.cantidad, i.instrumento.stock_actual) : 0;
    const subtotal = cantidad * Number(i.instrumento.precio_venta);
    return { ...i, disponible, cantidad, subtotal };
  });

  const total = lineas.reduce((suma, l) => suma + l.subtotal, 0);
  const hayDisponibles = lineas.some((l) => l.disponible);

  return (
    <div className="bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">Carrito</h1>

      {lineas.length === 0 ? (
        <div className="mt-8">
          <p className="text-[#B8B2A3]">Tu carrito está vacío.</p>
          <Link href="/tienda" className="mt-2 inline-block text-[#C9A24B] hover:text-[#DDB95F]">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="flex flex-col gap-4">
            {lineas.map((l) => (
              <li key={l.id_instrumento} className="flex gap-4 rounded-2xl bg-[#17171A] p-4">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-[#1F1F24]">
                  {l.instrumento.imagen_url && (
                    <Image
                      src={l.instrumento.imagen_url}
                      alt={l.instrumento.nombre_instrumento}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <Link
                    href={`/tienda/${l.id_instrumento}`}
                    className="font-semibold hover:text-[#DDB95F]"
                  >
                    {l.instrumento.nombre_instrumento}
                  </Link>
                  <p className="text-sm text-[#B8B2A3]">
                    {peso(Number(l.instrumento.precio_venta))} c/u
                  </p>

                  {l.disponible ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <form action={cambiarCantidad} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={l.id_instrumento} />
                        <input
                          type="number"
                          name="cantidad"
                          min="0"
                          max={l.instrumento.stock_actual}
                          defaultValue={l.cantidad}
                          aria-label={`Cantidad de ${l.instrumento.nombre_instrumento}`}
                          className="h-9 w-20 rounded-lg border border-[#33333a] bg-[#0F0F10] px-3 text-right"
                        />
                        <button type="submit" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
                          Actualizar
                        </button>
                      </form>
                      <form action={quitarDelCarrito}>
                        <input type="hidden" name="id" value={l.id_instrumento} />
                        <button type="submit" className="text-sm text-[#B8B2A3] hover:text-[#F5F1E8]">
                          Quitar
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-red-400">Ya no está disponible</span>
                      <form action={quitarDelCarrito}>
                        <input type="hidden" name="id" value={l.id_instrumento} />
                        <button type="submit" className="text-sm text-[#B8B2A3] hover:text-[#F5F1E8]">
                          Quitar
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <p className="font-semibold text-[#C9A24B]">
                  {l.disponible ? peso(l.subtotal) : "—"}
                </p>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl bg-[#17171A] p-6">
            <h2 className="font-serif text-2xl font-semibold">Resumen</h2>
            <p className="mt-4 flex justify-between text-lg">
              <span>Total</span>
              <span className="font-semibold text-[#C9A24B]">{peso(total)}</span>
            </p>
            <p className="mt-2 text-xs text-[#B8B2A3]">Precios en pesos mexicanos.</p>

            {hayDisponibles ? (
              <Button href="/checkout" size="lg" className="mt-6 w-full">
                Continuar con la compra
              </Button>
            ) : (
              <p className="mt-6 text-sm text-[#B8B2A3]">
                No hay productos disponibles para comprar.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}