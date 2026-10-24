import type { MaestroConUsuario } from "@/services/maestros";

export default function TeacherCard({maestro}: {maestro: MaestroConUsuario}){
    const {nombre, apellido_paterno} = maestro.usuario;
    const iniciales = `${nombre[0]}${apellido_paterno?.[0] ?? ""}`;

    return(
        <article className="flex items-center gap-4 rounded-2x1 bg-[#17171A] p-5 text-[#F5F1E8]">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#1F1F24] text-xl font-semibold text-[#C9A24B]">
                {iniciales}
            </div>
            <div>
                <p className="font-semibold">
                    {nombre} {apellido_paterno ?? ""}
                </p>
                <p className="text-sm text-{#B8B2A3]">{maestro.especialidad}</p>
            </div>
        </article>

    );


}