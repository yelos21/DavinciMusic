import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token || error) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-serif text-4xl font-semibold">Enlace no válido</h1>
        <p className="text-[#B8B2A3]">
          El enlace venció o ya se usó. Pide uno nuevo para continuar.
        </p>
        <Link href="/recuperar" className="text-[#C9A24B] hover:text-[#DDB95F]">
          Pedir otro enlace
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}