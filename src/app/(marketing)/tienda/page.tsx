import Link from "next/link";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/tienda/ProductCard";
import { obtenerCategorias } from "@/services/categorias";
import { obtenerInstrumentos } from "@/services/instrumentos";

export const dynamic = "force-dynamic";

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const params = await searchParams;

  // Todo lo que viene de la URL se valida antes de usarlo
  const categoriaNum = Number(params.categoria);
  const categoria =
    Number.isInteger(categoriaNum) && categoriaNum > 0 ? categoriaNum : undefined;
  const q = (params.q ?? "").trim().slice(0, 50) || undefined;

  const [categorias, instrumentos] = await Promise.all([
    obtenerCategorias(),
    obtenerInstrumentos({ categoria, q }),
  ]);

  // Arma el enlace de un filtro conservando la búsqueda
  function enlace(cat?: number) {
    const p = new URLSearchParams();
    if (cat) p.set("categoria", String(cat));
    if (q) p.set("q", q);
    const texto = p.toString();
    return texto ? `/tienda?${texto}` : "/tienda";
  }

  const chip = (activa: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition-colors ${
      activa
        ? "border-[#C9A24B] bg-[#C9A24B] font-semibold text-[#0F0F10]"
        : "border-[#33333a] text-[#F5F1E8] hover:border-[#C9A24B]"
    }`;

  return (
    <div className="bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">Tienda</h1>

      {/* Búsqueda: un formulario GET normal, sin JavaScript */}
      <form action="/tienda" className="mt-6 flex max-w-xl gap-3">
        <input
          name="q"
          defaultValue={q}
          maxLength={50}
          placeholder="Buscar por nombre, marca o modelo"
          aria-label="Buscar instrumentos"
          className="h-11 flex-1 rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] placeholder:text-[#8a8577] focus-visible:outline-2 focus-visible:outline-[#C9A24B]"
        />
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        <Button type="submit">Buscar</Button>
      </form>

      {/* Categorías */}
      <nav aria-label="Categorías" className="mt-6 flex flex-wrap gap-3">
        <Link href={enlace()} className={chip(!categoria)}>
          Todas
        </Link>
        {categorias.map((c) => (
          <Link
            key={c.id_categoria}
            href={enlace(c.id_categoria)}
            className={chip(categoria === c.id_categoria)}
          >
            {c.nombre_categoria}
          </Link>
        ))}
      </nav>

      <p className="mt-6 text-[#B8B2A3]">
        {instrumentos.length}{" "}
        {instrumentos.length === 1 ? "instrumento" : "instrumentos"}
        {q ? ` para “${q}”` : ""}
      </p>

      {instrumentos.length === 0 ? (
        <div className="mt-10">
          <p className="text-[#B8B2A3]">
            No encontramos instrumentos con esos filtros.
          </p>
          <Link href="/tienda" className="mt-2 inline-block text-[#C9A24B] hover:text-[#DDB95F]">
            Ver todos los instrumentos
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {instrumentos.map((instrumento) => (
            <ProductCard
              key={instrumento.id_instrumento}
              instrumento={instrumento}
            />
          ))}
        </div>
      )}
    </div>
  );
}