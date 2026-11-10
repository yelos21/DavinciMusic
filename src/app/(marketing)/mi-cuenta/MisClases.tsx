import { mesTexto } from "@/lib/fechas";
import { DIAS, hora, peso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export default async function MisClases({ idCliente }: { idCliente: number }) {
  const inscripciones = await prisma.inscripcionClase.findMany({
    where: { id_cliente: idCliente },
    include: {
      clase: {
        include: {
          instrumento: true,
          horarios: true,
          maestro: { include: { usuario: true } },
        },
      },
      pagos: { orderBy: { periodo_pagado: "desc" } },
    },
    orderBy: { id_inscripcion: "desc" },
  });

  const ahora = new Date();

  // Lo que se debe en total, sumando los cargos pendientes de las
  // inscripciones que siguen vigentes (una baja ya no genera adeudo)
  const adeudo = inscripciones
    .filter((i) => i.estado_inscripcion !== "Baja")
    .flatMap((i) => i.pagos)
    .filter((p) => p.estado_pago === "Pendiente")
    .reduce((suma, p) => suma + Number(p.importe), 0);

  return (
    <section className="mt-10">
      <h2 className="font-serif text-3xl font-semibold">Mis clases y pagos</h2>

      {inscripciones.length === 0 ? (
        <p className="mt-4 text-[#B8B2A3]">
          Todavía no estás inscrito en ninguna clase. Mira las clases disponibles en la
          sección de Escuela.
        </p>
      ) : (
        <>
          <p className="mt-2 text-[#B8B2A3]">
            {adeudo > 0 ? (
              <>
                Saldo pendiente: <span className="text-red-400">{peso(adeudo)}</span>. Puedes
                pagarlo en la escuela.
              </>
            ) : (
              "Estás al corriente en tus pagos."
            )}
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {inscripciones.map((i) => {
              const maestro = i.clase.maestro.usuario;
              const horarios = [...i.clase.horarios].sort(
                (a, b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana),
              );

              return (
                <article key={i.id_inscripcion} className="rounded-2xl bg-[#17171A] p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-2xl font-semibold">{i.clase.nombre_clase}</h3>
                    <span
                      className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${
                        i.estado_inscripcion === "Activa"
                          ? "bg-[#1F1F24] text-[#C9A24B]"
                          : "bg-[#33333a]"
                      }`}
                    >
                      {i.estado_inscripcion}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#B8B2A3]">
                    {i.clase.instrumento.nombre_instrumento} · {maestro.nombre}{" "}
                    {maestro.apellido_paterno ?? ""} · {peso(Number(i.costo_mensual_acordado))} al mes
                  </p>

                  <ul className="mt-3 text-sm">
                    {horarios.map((h) => (
                      <li key={h.id_horario}>
                        {h.dia_semana} {hora(h.hora_inicio)} a {hora(h.hora_fin)}
                        {h.salon ? ` · ${h.salon}` : ""}
                      </li>
                    ))}
                  </ul>

                  <table className="mt-5 w-full text-left text-sm">
                    <thead className="border-b border-[#33333a] text-[#B8B2A3]">
                      <tr>
                        <th className="py-2 font-medium">Mes</th>
                        <th className="py-2 text-right font-medium">Importe</th>
                        <th className="py-2 text-right font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {i.pagos.map((p) => {
                        const vencido =
                          p.estado_pago === "Pendiente" && p.fecha_vencimiento < ahora;
                        return (
                          <tr key={p.id_pago_clase} className="border-b border-[#26262b] last:border-0">
                            <td className="py-2 capitalize">{mesTexto(p.periodo_pagado)}</td>
                            <td className="py-2 text-right text-[#C9A24B]">
                              {peso(Number(p.importe))}
                            </td>
                            <td className="py-2 text-right">
                              {p.estado_pago === "Pagado" ? (
                                <span className="text-[#B8B2A3]">Pagado</span>
                              ) : vencido ? (
                                <span className="text-red-400">Vencido</span>
                              ) : (
                                <span className="text-[#C9A24B]">Pendiente</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}