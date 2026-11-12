import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { contarCarrito } from "@/lib/carrito";
import { esAdministrador } from "@/lib/rol";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [esAdmin, carritoCount] = await Promise.all([
    esAdministrador(),
    contarCarrito(),
  ]);

  return (
    <>
      <Navbar esAdmin={esAdmin} carritoCount={carritoCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}