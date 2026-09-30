import Link from 'next/link';

import Button from "@/components/ui/Button";

export default function Page() {
  return (
    <div className="flex gap-4 p-8">
      <Button>Agregar</Button>
      <Button variant="secondary" size="lg">Agenda tu clase muestra</Button>
      <Button href="/login" variant="secondary">Iniciar sesión</Button>
    </div>
  );
}
