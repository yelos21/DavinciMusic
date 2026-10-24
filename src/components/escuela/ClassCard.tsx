import Button from "../ui/Button";
import { DIAS, hora, peso } from "@/lib/formato";
import type { ClaseConDetalle } from "@/services/clases";

export default function ClassCard ({clase }: {clase: ClaseConDetalle}){
    const maestro = clase.maestro.usuario;
    const lugares = clase.cupo_maximo - clase._count.inscripciones
    const horarios = [...clase.horarios].sort(
    (a,b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana),
    );

    return(
        <article className="flex flex-col gap-4 rounded-2x1 bg-[#17171A] p-6 text-[#F5F1F8]">
            <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text2-1 font-semibold">{clase.nombre_clase}</h2>
                <span className="shrink-0 rounded-md bg-[1F1F24] px-2.5 py-1 text.xs text-[#C9A24B]">
                    {clase.nivel}
                </span>
            </div>
            <p className="flex flex-col gap-1 text-sm">
                {clase.instrumento.nombre_instrumento} · {maestro.nombre}{" "}
                {maestro.apellido_paterno ?? ""}
            </p>

            <ul className="flex flex-col gap-1 text-sm">
                {horarios.map((h) => (
                    <li key={h.id_horario}>
                        {h.dia_semana} {hora(h.hora_inicio)} a {hora(h.hora_fin)}
                        {h.salon ? ` · ${h.salon}` : ""}
                    </li>
                ))}
            </ul>

            <p className="text-xl font-semibold text-[#C9A24B]">
                {peso(Number(clase.costo_mensual))} <span className="text-sm font.normal text[#B8B2A3]">al mes</span>
            </p>

            <p className={lugares <= 0 ? "text-sm text-red-400" : "text-sm text-[#B8B2A3]"}>
                {lugares <= 0
                    ? "cupo lleno"
                    : `Quedan ${lugares} ${lugares === 1 ? "lugar" : "lugares"}`
                }
            </p>

            <Button href="/contacto?asunto=clase-muestra" variant="secondary" className="self-start">
                Agenda una clase muestra
            </Button>

        </article>

    );


}



