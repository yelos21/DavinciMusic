import CategoryGrid from "@/components/home/CategoryGrid";
import Hero from "@/components/home/Hero";
import SchoolSection from "@/components/home/SchoolSection";
import ProductCard from "@/components/tienda/ProductCard";
import { obtenerCategorias } from "@/services/categorias";
import { obtenerDestacados } from "@/services/instrumentos";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categorias, destacados] = await Promise.all([
    obtenerCategorias(),
    obtenerDestacados(),
  ]);

  return (
    <div className="bg-[#0F0F10] text-[#F5F1E8]">
      <Hero />
      <CategoryGrid categorias={categorias} />

      <section className="px-8 py-16">
        <h2 className="font-serif text-4xl font-semibold">Recién llegados</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.map((i) => (
            <ProductCard key={i.id_instrumento} instrumento={i} />
          ))}
        </div>
      </section>

      <SchoolSection />
    </div>
  );
}