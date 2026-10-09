import Link from "next/link";
import type { obtenerCategorias } from "@/services/categorias";

type Categorias = Awaited<ReturnType<typeof obtenerCategorias>>;

export default function CategoryGrid({ categorias }: { categorias: Categorias }) {
  return (
    <section className="px-8 py-16">
      <h2 className="font-serif text-4xl font-semibold">Explora por categoría</h2>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categorias.map((c) => {
          const total = c._count.instrumentos;
          return (
            <Link
              key={c.id_categoria}
              href="/tienda"
              className="flex h-56 flex-col justify-end rounded-2xl bg-[#1F1F24] p-6 transition-colors hover:bg-[#26262b]"
            >
              <h3 className="font-serif text-2xl font-semibold">
                {c.nombre_categoria}
              </h3>
              <p className="mt-1 text-sm text-[#B8B2A3]">
                {total} {total === 1 ? "producto" : "productos"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}