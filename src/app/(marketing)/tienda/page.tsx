import ProductCard from "@/components/tienda/ProductCard";
import { obtenerInstrumentos } from "@/services/instrumentos";

// Consulta la base de datos en cada visita (no al compilar)
export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  const instrumentos = await obtenerInstrumentos();

  return (
    <div className="min-h-screen bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">Tienda</h1>
      <p className="mt-2 text-[#B8B2A3]">
        {instrumentos.length} instrumentos disponibles
      </p>

      {instrumentos.length === 0 ? (
        <p className="mt-10 text-[#B8B2A3]">
          Todavía no hay instrumentos registrados.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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