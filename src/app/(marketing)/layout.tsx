import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { esAdministrador } from "@/lib/rol";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const esAdmin = await esAdministrador();

  return (
    <>
      <Navbar esAdmin={esAdmin} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}