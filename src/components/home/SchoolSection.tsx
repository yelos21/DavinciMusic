import Button from "@/components/ui/Button";

export default function SchoolSection() {
  return (
    <section className="bg-[#17171A] px-8 py-20">
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#C9A24B]">
          ESCUELA DAVINCI
        </p>
        <h2 className="font-serif text-4xl font-semibold leading-tight">
          Aprende con maestros que te acompañan
        </h2>
        <p className="text-[#B8B2A3]">
          Clases para niños, jóvenes y adultos. Agenda una clase muestra y
          conoce el método.
        </p>
        <Button href="/escuela" className="self-start">
          Ver clases
        </Button>
      </div>
    </section>
  );
}