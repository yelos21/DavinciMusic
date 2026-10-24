import Button from "@/components/ui/Button";
import { enviarMensaje } from "./actions";

// son de ejemplo
    const DIRECCION = "jhon.Doe@gmail.com"
    const HORARIO = "[Lunes a sábado, 10:00 a 19:00]";
    const TELEFONO = "3322331155"

    const inputClass =
        "h-12 w-full rounded-lg border border-[#33333a] bg-[#17171A] px-4 text-[#F5F1E8] " +
        "placeholder:text-[#8a8577] focus-visible:outline-2 focus-visible:outline-[#C9A24B]";

        
export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string; asunto?: string }>;
}) {
  const { enviado, error, asunto } = await searchParams;
  const asuntoInicial = asunto === "clase-muestra" ? "Clase muestra" : "Tienda";

  return (
    <div className="bg-[#0F0F10] px-8 py-12 text-[#F5F1E8]">
      <h1 className="font-serif text-4xl font-semibold">Contacto</h1>
      <p className="mt-2 text-[#B8B2A3]">
        Escríbenos para preguntar por un instrumento o agendar tu clase muestra.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* Datos y mapa */}
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-2 text-[#B8B2A3]">
            <li><span className="text-[#F5F1E8]">Dirección:</span> {DIRECCION}</li>
            <li><span className="text-[#F5F1E8]">Horario:</span> {HORARIO}</li>
            <li><span className="text-[#F5F1E8]">Teléfono:</span> {TELEFONO}</li>
          </ul>

          <iframe
            title="Mapa con la ubicación de Davinci Music"
            src={`https://www.google.com/maps?q=${encodeURIComponent(DIRECCION)}&output=embed`}
            loading="lazy"
            className="h-80 w-full rounded-2xl border-0"
          />
        </div>

        {/* Formulario */}
        <form action={enviarMensaje} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
            <input id="nombre" name="nombre" required className={inputClass} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="correo" className="text-sm font-medium">Correo electrónico</label>
            <input id="correo" name="correo" type="email" required className={inputClass} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="telefono" className="text-sm font-medium">Teléfono (opcional)</label>
            <input id="telefono" name="telefono" type="tel" className={inputClass} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="asunto" className="text-sm font-medium">Asunto</label>
            <select id="asunto" name="asunto" defaultValue={asuntoInicial} className={inputClass}>
              <option>Tienda</option>
              <option>Clase muestra</option>
              <option>Otro</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="mensaje" className="text-sm font-medium">Mensaje</label>
            <textarea
              id="mensaje"
              name="mensaje"
              required
              minLength={10}
              maxLength={1000}
              className={`${inputClass} min-h-32 py-3`}
            />
          </div>

          {/* Campo trampa para bots: oculto a personas y lectores de pantalla */}
          <input
            name="sitio_web"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {enviado && (
            <p role="status" className="text-sm text-green-400">
              ¡Gracias! Recibimos tu mensaje y te responderemos pronto.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-400">
              Revisa los datos: el mensaje debe tener entre 10 y 1000 caracteres y el correo debe ser válido.
            </p>
          )}

          <Button type="submit" size="lg" className="self-start">
            Enviar mensaje
          </Button>
        </form>
      </div>
    </div>
  );
}