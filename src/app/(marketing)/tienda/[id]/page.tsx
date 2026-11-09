import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/tienda/ProductCard";
import { peso } from "@/lib/formato";
import {
  obtenerInstrumento,
  obtenerRelacionados,
} from "@/services/instrumentos";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const idNum = Number(id);
  const instrumento = Number.isInteger(idNum) ? await obtenerInstrumento(idNum) : null;

  return {
    title: instrumento
      ? `${instrumento.nombre_instrumento} | Davinci Music`
      : "Producto no encontrado | Davinci Music",
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) notFound();

  const instrumento = await obtenerInstrumento(idNum);
  if (!instrumento) notFound();

  const relacionados = await obtenerRelacionados(
    instrumento.id_categoria,
    instrumento.id_instrumento,
  );

  const agotado = instrumento.stock_actual === 0;
  const pocasPiezas = !agotado && instrumento.stock_actual < 3;

  // Solo se muestran las especificaciones que tienen valor
  const especificaciones = [
    ["Categoría", instrumento.categoria.nombre_categoria],
    ["Marca", instrumento.marca],
    ["Modelo", instrumento.modelo],
    ["Tamaño", instrumento.tamano],
    ["Color", instrumento.color],
  ].filter(([, valor]) => valor);

  return (
    <div className="bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <Link href="/tienda" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver a la tienda
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Foto */}
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#1F1F24] text-sm text-[#B8B2A3]">
          {instrumento.imagen_url ? (
            <Image
              src={instrumento.imagen_url}
              alt={instrumento.nombre_instrumento}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            "[FOTO]"
          )}
        </div>

        {/* Datos */}
        <div className="flex flex-col gap-5">
          <p className="text-sm text-[#B8B2A3]">
            {instrumento.categoria.nombre_categoria}
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight">
            {instrumento.nombre_instrumento}
          </h1>

          <p className="text-3xl font-semibold text-[#C9A24B]">
            {peso(Number(instrumento.precio_venta))}
          </p>

          <p
            className={
              agotado
                ? "text-red-400"
                : pocasPiezas
                  ? "text-[#C9A24B]"
                  : "text-[#B8B2A3]"
            }
          >
            {agotado
              ? "Agotado por el momento"
              : pocasPiezas
                ? `Últimas ${instrumento.stock_actual} ${
                    instrumento.stock_actual === 1 ? "pieza" : "piezas"
                  }`
                : "Disponible"}
          </p>

          <Button
            href={`/contacto?asunto=tienda&producto=${encodeURIComponent(
              instrumento.nombre_instrumento,
            )}`}
            size="lg"
            className="self-start"
          >
            Preguntar por este producto
          </Button>

          {especificaciones.length > 0 && (
            <dl className="mt-4 divide-y divide-[#26262b] rounded-2xl bg-[#17171A]">
              {especificaciones.map(([nombre, valor]) => (
                <div key={nombre} className="flex justify-between gap-4 px-5 py-3 text-sm">
                  <dt className="text-[#B8B2A3]">{nombre}</dt>
                  <dd className="text-right font-medium">{valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-3xl font-semibold">También te puede interesar</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((r) => (
              <ProductCard key={r.id_instrumento} instrumento={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}