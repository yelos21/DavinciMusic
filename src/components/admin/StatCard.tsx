export default function StatCard({
  titulo,
  valor,
  alerta = false,
}: {
    titulo: string;
    valor: string | number;
    alerta?: boolean;
}) {return (
 <div className="rounded-2xl bg-[#17171A] p-6">
      <p className="text-sm text-[#B8B2A3]">{titulo}</p>
      <p
        className={`mt-1 text-3xl font-semibold ${
          alerta ? "text-red-400" : "text-[#C9A24B]"
        }`}
      >
        {valor}
      </p>
    </div>
  );

}