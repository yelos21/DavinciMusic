import Link from "next/link";
import { peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function InscripcionesPage() {
  await requireAdmin();

  const inscripciones = await prisma.inscripcionClase.findMany({
    include: {
      cliente: { include: { usuario: true } },
      clase: true,
      pagos: true,
    },
    orderBy: { id_inscripcion: "desc" },
    take: 50,
  });

  const ahora = new Date();

  return (
    <main className="min-h-screen bg-[#0F0F10] p-8 text-[#F5F1E8]">
      <Link href="/admin" className="text-sm text-[#C9A24B] hover:text-[#DDB95F]">
        ← Volver al panel
      </Link>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Inscripciones</h1>
          <p className="mt-2 text-[#B8B2A3]">{inscripciones.length} inscripciones</p>
        </div>
        <Link
          href="/admin/inscripciones/nueva"
          className="rounded-lg bg-[#C9A24B] px-5 py-3 text-sm font-semibold text-[#0F0F10] hover:bg-[#DDB95F]"
        >
          Nueva inscripción
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-[#17171A]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#33333a] text-[#B8B2A3]">
            <tr>
              <th className="px-4 py-3 font-medium">Alumno</th>
              <th className="px-4 py-3 font-medium">Clase</th>
              <th className="px-4 py-3 text-right font-medium">Mensualidad</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Cargos</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map((i) => {
              const pendientes = i.pagos.filter((p) => p.estado_pago === "Pendiente");
              const vencidos = pendientes.filter((p) => p.fecha_vencimiento < ahora);

              return (
                <tr key={i.id_inscripcion} className="border-b border-[#26262b] last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {i.cliente.usuario.nombre} {i.cliente.usuario.apellido_paterno ?? ""}
                  </td>
                  <td className="px-4 py-3">{i.clase.nombre_clase}</td>
                  <td className="px-4 py-3 text-right text-[#C9A24B]">
                    {peso(Number(i.costo_mensual_acordado))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        i.estado_inscripcion === "Activa"
                          ? "bg-[#1F1F24] text-[#C9A24B]"
                          : "bg-[#33333a]"
                      }`}
                    >
                      {i.estado_inscripcion}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {vencidos.length > 0 ? (
                      <span className="text-red-400">{vencidos.length} vencido(s)</span>
                    ) : pendientes.length > 0 ? (
                      <span className="text-[#B8B2A3]">{pendientes.length} pendiente(s)</span>
                    ) : (
                      <span className="text-[#B8B2A3]">Al corriente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/inscripciones/${i.id_inscripcion}`}
                      className="text-xs text-[#C9A24B] hover:text-[#DDB95F]"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {inscripciones.length === 0 && (
          <p className="p-6 text-[#B8B2A3]">Todavía no hay inscripciones.</p>
        )}
      </div>
    </main>
  );
}