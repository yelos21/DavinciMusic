import Link from "next/link";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { crearInstrumento } from "../actions";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "placeholder:text-[#8a8577] focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

export default async function NuevoInstrumentoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const categorias = await prisma.categoriaInstrumento.findMany({
    orderBy: { nombre_categoria: "asc" },
  });

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link
        href="/admin/inventario"
        className="text-sm text-[#C9A24B] hover:text-[#DDB95F]"
      >
        ← Volver al inventario
      </Link>

      <h1 className="mt-4 font-serif text-4xl font-semibold">
        Nuevo instrumento
      </h1>

      <form action={crearInstrumento} className="mt-8 flex max-w-md flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
          <input id="nombre" name="nombre" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="marca" className="text-sm font-medium">Marca</label>
          <input id="marca" name="marca" className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="modelo" className="text-sm font-medium">Modelo</label>
          <input id="modelo" name="modelo" className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="categoria" className="text-sm font-medium">Categoría</label>
          <select id="categoria" name="categoria" required className={inputClass}>
            {categorias.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="precio" className="text-sm font-medium">Precio (MXN)</label>
          <input id="precio" name="precio" type="number" step="0.01" min="0" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="stock" className="text-sm font-medium">Stock</label>
          <input id="stock" name="stock" type="number" min="0" required className={inputClass} />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            Revisa los datos: el nombre es obligatorio y el precio y el stock no pueden ser negativos.
          </p>
        )}

        <Button type="submit" size="lg">Guardar instrumento</Button>
      </form>
    </main>
  );
}