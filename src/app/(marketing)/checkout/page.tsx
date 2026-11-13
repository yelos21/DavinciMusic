import Link from "next/link";
import { redirect } from "next/navigation";
import Button from "@/components/ui/Button";
import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/sesion";
import { crearPedido } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

const mensajes: Record<string, string> = {
  datos:
    "Revisa los datos: la dirección debe tener al menos 10 caracteres, el teléfono un formato válido y debes elegir un método de pago.",
  stock:
    "Alguno de los productos se agotó mientras comprabas. Revisa tu carrito e inténtalo de nuevo.",
  servidor: "No se pudo registrar el pedido. Intenta de nuevo.",

  pago: "No se pudo iniciar el pago con tarjeta. Tu pedido no se registró; intenta de nuevo.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { usuario } = await requireUser();
  const { error } = await searchParams;

  const cliente = await prisma.cliente.findUnique({
    where: { id_usuario: usuario.id_usuario },
  });
  const items = cliente
    ? await prisma.carritoItem.findMany({
        where: { id_cliente: cliente.id_cliente },
        include: { instrumento: true },
      })
    : [];

  const lineas = items
    .filter((i) => i.instrumento.activo && i.instrumento.stock_actual > 0)
    .map((i) => {
      const cantidad = Math.min(i.cantidad, i.instrumento.stock_actual);
      return {
        id: i.id_instrumento,
        nombre: i.instrumento.nombre_instrumento,
        cantidad,
        subtotal: cantidad * Number(i.instrumento.precio_venta),
      };
    });

  if (lineas.length === 0) {
    redirect("/carrito");
  }

  const total = lineas.reduce((suma, l) => suma + l.subtotal, 0);

  return (
    <div className="bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <Link href="/carrito" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al carrito
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold">Finalizar compra</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <form action={crearPedido} className="flex max-w-xl flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="direccion" className="text-sm font-medium">Dirección de entrega</label>
            <input
              id="direccion"
              name="direccion"
              required
              minLength={10}
              maxLength={200}
              defaultValue={usuario.direccion ?? ""}
              placeholder="Calle, número, colonia, ciudad y código postal"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="telefono" className="text-sm font-medium">Teléfono de contacto</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              required
              defaultValue={usuario.telefono ?? ""}
              className={inputClass}
            />
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">Método de pago</legend>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#33333a] bg-[#17171A] p-4 has-[:checked]:border-[#C9A24B]">
              <input type="radio" name="metodo" value="Pago en tienda" defaultChecked className="mt-1 accent-[#C9A24B]" />
              <span>
                <span className="font-semibold">Pago en tienda</span>
                <span className="block text-sm text-[#B8B2A3]">
                  Apartamos tus productos y pagas al recogerlos.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#33333a] bg-[#17171A] p-4 has-[:checked]:border-[#C9A24B]">
              <input type="radio" name="metodo" value="Transferencia" className="mt-1 accent-[#C9A24B]" />
              <span>
                <span className="font-semibold">Transferencia bancaria</span>
                <span className="block text-sm text-[#B8B2A3]">
                  Te mostramos los datos al terminar y confirmamos al recibir tu pago.
                </span>
              </span>
            </label>


            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#33333a] bg-[#17171A] p-4 has-[:checked]:border-[#C9A24B]">
              <input type="radio" name="metodo" value="Tarjeta" className="mt-1 accent-[#C9A24B]" />
              <span>
                <span className="font-semibold">Tarjeta de crédito o débito</span>
                <span className="block text-sm text-[#B8B2A3]">
                  Pagas de forma segura en la página de Stripe.
                </span>
              </span>
            </label>


          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {mensajes[error] ?? mensajes.servidor}
            </p>
          )}

          <Button type="submit" size="lg" className="self-start">
            Confirmar pedido
          </Button>
        </form>

        <aside className="h-fit rounded-2xl bg-[#17171A] p-6">
          <h2 className="font-serif text-2xl font-semibold">Tu pedido</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {lineas.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span>
                  {l.cantidad} × {l.nombre}
                </span>
                <span className="text-[#B8B2A3]">{peso(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-[#33333a] pt-4 text-lg">
            <span>Total</span>
            <span className="font-semibold text-[#C9A24B]">{peso(total)}</span>
          </p>
        </aside>
      </div>
    </div>
  );
}