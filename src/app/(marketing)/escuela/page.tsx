import TeacherCard  from "@/components/escuela/TeacherCard";
import ClassCard from "@/components/escuela/ClassCard";
import { obtenerClases } from "@/services/clases";
import { ObtenerMaestros } from "@/services/maestros";

export const dynamic = "force-dynamic";

export default async function EscuelaPage(){
    const [clases, maestros] = await Promise.all([obtenerClases(), ObtenerMaestros()]);

    return (
    <div className="bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">Escuela de música</h1>
      <p className="mt-2 max-w-xl text-[#B8B2A3]">
        Clases para niños, jóvenes y adultos. Elige la tuya y agenda una clase muestra.
      </p>

      {clases.length === 0 ? (
        <p className="mt-10 text-[#B8B2A3]">
          Por ahora no hay clases abiertas. Escríbenos y te avisamos del siguiente periodo.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clases.map((c) => (
            <ClassCard key={c.id_clase} clase={c} />
          ))}
        </div>
      )}

      <h2 className="mt-16 font-serif text-3xl font-semibold">Nuestros maestros</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {maestros.map((m) => (
          <TeacherCard key={m.id_maestro} maestro={m} />
        ))}
      </div>
    </div>
  );


}

