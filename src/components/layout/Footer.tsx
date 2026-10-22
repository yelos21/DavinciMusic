import Link from "next/link";

const columnas = [
  {
    titulo: "Tienda",
    enlaces: [
      { href: "/tienda", label: "Todos los instrumentos" },
      { href: "/", label: "Categorías" },
    ],
  },
  {
    titulo: "Escuela",
    enlaces: [
      { href: "/escuela", label: "Clases" },
      { href: "/escuela", label: "Maestros" },
    ],
  },
  {
    titulo: "Ayuda",
    enlaces: [
      { href: "/contacto", label: "Contacto" },
      { href: "/login", label: "Mi cuenta" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#33333a] bg-[#17171A] px-8 py-12 text-[#F5F1E8]">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-2xl font-bold text-[#C9A24B]">Davinci Music</p>
          <p className="mt-3 text-sm text-[#B8B2A3]">
            [Dirección de ejemplo] · [Horario de ejemplo]
          </p>
        </div>

        {columnas.map((col) => (
          <div key={col.titulo}>
            <p className="font-semibold">{col.titulo}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-[#B8B2A3]">
              {col.enlaces.map((e) => (
                <li key={e.label}>
                  <Link href={e.href} className="hover:text-[#DDB95F]">
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-[#B8B2A3]">
        © {new Date().getFullYear()} Davinci Music. Todos los derechos reservados.
      </p>
    </footer>
  );
}