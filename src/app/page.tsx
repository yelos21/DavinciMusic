import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 p-24">
      <h1 className="text-4xl font-bold text-gray-900">
        Davinci Music
      </h1>
      <p className="text-lg text-gray-600">
        Tu academia y tienda de instrumentos musicales
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/tienda" 
          className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Explorar Tienda
        </Link>
        <Link 
          href="/escuela" 
          className="rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
        >
          Ver Cursos
        </Link>
      </div>
    </main>
  );
}