import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { actualizarInstrumento } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "placeholder:text-[#8a8577] focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

export default async function EditarInstrumentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const idInstrumento = Number(id);
  if (!Number.isInteger(idInstrumento)) notFound();

  const [instrumento, categorias] = await Promise.all([
    prisma.instrumento.findUnique({ where: { id_instrumento: idInstrumento } }),
    prisma.categoriaInstrumento.findMany({ orderBy: { nombre_categoria: "asc" } }),
  ]);
  if (!instrumento) notFound();

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin/inventario" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al inventario
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold">Editar instrumento</h1>

      <form action={actualizarInstrumento} className="mt-8 flex max-w-md flex-col gap-5">
        <input type="hidden" name="id" value={instrumento.id_instrumento} />

        <div className="flex flex-col gap-2">
          <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
          <input id="nombre" name="nombre" required defaultValue={instrumento.nombre_instrumento} className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="marca" className="text-sm font-medium">Marca</label>
          <input id="marca" name="marca" defaultValue={instrumento.marca ?? ""} className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="modelo" className="text-sm font-medium">Modelo</label>
          <input id="modelo" name="modelo" defaultValue={instrumento.modelo ?? ""} className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="categoria" className="text-sm font-medium">Categoría</label>
          <select id="categoria" name="categoria" required defaultValue={instrumento.id_categoria} className={inputClass}>
            {categorias.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="precio" className="text-sm font-medium">Precio (MXN)</label>
          <input
            id="precio"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={Number(instrumento.precio_venta)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="stock" className="text-sm font-medium">Stock</label>
          <input id="stock" name="stock" type="number" min="0" required defaultValue={instrumento.stock_actual} className={inputClass} />
          <p className="text-xs text-[#B8B2A3]">
            Úsalo solo para corregir diferencias. Las ventas y las recepciones de
            abastecimiento ya lo actualizan solas.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="imagen" className="text-sm font-medium">Imagen (opcional)</label>
          <input
            id="imagen"
            name="imagen"
            placeholder="/instrumentos/guitarra-acustica.jpg"
            defaultValue={instrumento.imagen_url ?? ""}
            className={inputClass}
          />
          <p className="text-xs text-[#B8B2A3]">
            Ruta de un archivo de la carpeta public/instrumentos.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            Revisa los datos: el nombre es obligatorio, el precio y el stock no pueden ser
            negativos, y la imagen debe empezar con /instrumentos/.
          </p>
        )}

        <Button type="submit" size="lg">Guardar cambios</Button>
      </form>
    </main>
  );
}