import type { InstrumentoConCategoria } from "@/services/instrumentos";
import Image from "next/image";

export default function ProductCard({
  instrumento,
}: {
  instrumento: InstrumentoConCategoria;
}) {
  const precio = Number(instrumento.precio_venta).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  const agotado = instrumento.stock_actual === 0;
  const pocasPiezas = !agotado && instrumento.stock_actual < 3;

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-[#17171A] p-4 text-[#F5F1E8]">
      {/* Foto del instrumento */}
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl bg-[#1F1F24] text-xs text-[#B8B2A3]">
        {instrumento.imagen_url ? (
          <Image
            src={instrumento.imagen_url}
            alt={instrumento.nombre_instrumento}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="text-center">[FOTO]</span>
        )}

        {(agotado || pocasPiezas) && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-[#8B1E2D] px-2.5 py-1 text-xs font-semibold text-white">
            {agotado ? "Agotado" : "Pocas piezas"}
          </span>
        )}
      </div>

      <p className="text-xs text-[#B8B2A3]">
        {instrumento.categoria.nombre_categoria}
        {instrumento.marca ? ` · ${instrumento.marca}` : ""}
      </p>

      <h2 className="font-semibold">{instrumento.nombre_instrumento}</h2>

      <p className="text-xl font-semibold text-[#C9A24B]">{precio}</p>
    </article>
  );
}