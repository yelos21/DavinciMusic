import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-8 py-24">
      <svg
        aria-hidden="true"
        viewBox="0 0 620 620"
        fill="none"
        stroke="#C9A24B"
        strokeWidth="1"
        className="absolute -right-24 top-4 size-[560px] opacity-15"
      >
        <circle cx="310" cy="310" r="290" />
        <rect x="60" y="60" width="500" height="500" />
        <circle cx="310" cy="310" r="180" />
        <path d="M310 20V600M20 310H600M105 105L515 515M515 105L105 515" />
      </svg>

      <div className="relative flex max-w-2xl flex-col gap-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#C9A24B]">
          TIENDA DE INSTRUMENTOS Y ESCUELA DE MÚSICA
        </p>
        <h1 className="font-serif text-5xl font-bold leading-tight md:text-6xl">
          El arte de hacer música, en tus manos
        </h1>
        <p className="max-w-lg text-lg text-[#B8B2A3]">
          Instrumentos seleccionados y clases con maestros que te acompañan
          desde tu primera nota.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button href="/tienda" size="lg">
            Comprar instrumentos
          </Button>
          <Button href="/escuela" size="lg" variant="secondary">
            Agenda tu clase muestra
          </Button>
        </div>
      </div>
    </section>
  );
}