import Link from "next/link";
import Button from "@/components/ui/Button";
import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { inscribirAlumno } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
  "focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

const mensajes: Record<string, string> = {
  datos: "Elige un alumno y una clase, y escribe una mensualidad mayor a 0.",
  repetida: "Ese alumno ya está inscrito en esa clase.",
  cupo: "La clase no tiene lugares disponibles.",
  servidor: "No se pudo registrar la inscripción. Intenta de nuevo.",
};

export default async function NuevaInscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  const [clientes, clases] = await Promise.all([
    prisma.cliente.findMany({
      include: { usuario: true },
      orderBy: { id_cliente: "asc" },
    }),
    prisma.clase.findMany({
      where: { activa: true, periodo: { estado: "Activo" } },
      include: {
        _count: {
          select: { inscripciones: { where: { estado_inscripcion: "Activa" } } },
        },
      },
      orderBy: { nombre_clase: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin/inscripciones" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver a inscripciones
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold">Nueva inscripción</h1>

      <form action={inscribirAlumno} className="mt-8 flex max-w-md flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="cliente" className="text-sm font-medium">Alumno</label>
          <select id="cliente" name="cliente" required className={inputClass}>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.usuario.nombre} {c.usuario.apellido_paterno ?? ""} ({c.usuario.correo})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="clase" className="text-sm font-medium">Clase</label>
          <select id="clase" name="clase" required className={inputClass}>
            {clases.map((c) => {
              const libres = c.cupo_maximo - c._count.inscripciones;
              return (
                <option key={c.id_clase} value={c.id_clase} disabled={libres <= 0}>
                  {c.nombre_clase} · {peso(Number(c.costo_mensual))} ·{" "}
                  {libres <= 0 ? "cupo lleno" : `${libres} lugares`}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="costo" className="text-sm font-medium">
            Mensualidad acordada (MXN)
          </label>
          <input
            id="costo"
            name="costo"
            type="number"
            min="1"
            step="0.01"
            required
            className={inputClass}
          />
          <p className="text-xs text-[#B8B2A3]">
            Escribe el monto de la clase, o uno distinto si hay un descuento acordado.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {mensajes[error] ?? mensajes.servidor}
          </p>
        )}

        <Button type="submit" size="lg" className="self-start">
          Inscribir alumno
        </Button>
      </form>
    </main>
  );
}