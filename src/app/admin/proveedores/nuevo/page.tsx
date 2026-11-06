import Link from "next/link";
import Button from "@/components/ui/Button";
import { requireAdmin } from "@/lib/require-admin";
import { crearProveedor } from "../actions";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "placeholder:text-[#8a8577] focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

const mensajes: Record<string, string> = {
  datos:
    "Revisa los datos: el RFC debe tener 12 o 13 caracteres válidos, y el correo y el teléfono deben tener formato correcto.",
  rfc: "Ya existe un proveedor con ese RFC.",
};

export default async function NuevoProveedorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link
        href="/admin/proveedores"
        className="text-sm text-[#C9A24B] hover:text-[#DDB95F]"
      >
        ← Volver a proveedores
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold">Nuevo proveedor</h1>

      <form action={crearProveedor} className="mt-8 flex max-w-md flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="nombre" className="text-sm font-medium">Nombre o razón social</label>
          <input id="nombre" name="nombre" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="rfc" className="text-sm font-medium">RFC</label>
          <input
            id="rfc"
            name="rfc"
            required
            maxLength={13}
            placeholder="XAXX010101000"
            className={`${inputClass} uppercase`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="correo" className="text-sm font-medium">Correo</label>
          <input id="correo" name="correo" type="email" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="telefono" className="text-sm font-medium">Teléfono</label>
          <input id="telefono" name="telefono" type="tel" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="direccion" className="text-sm font-medium">Dirección (opcional)</label>
          <input id="direccion" name="direccion" maxLength={200} className={inputClass} />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {mensajes[error] ?? mensajes.datos}
          </p>
        )}

        <Button type="submit" size="lg">Guardar proveedor</Button>
      </form>
    </main>
  );
}