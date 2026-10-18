import { ejecutar, consultar, esNombreValido, motorValido, lit, tablasOrdenadas, filasDe } from '@/app/lib/db';

// Respaldo: devuelve un .sql con los datos (TRUNCATE + INSERT, una sentencia por línea).
// La estructura se respalda con pg_dump en consola o con los scripts 4.2 / 4.3.
export async function GET(req) {
  try {
    const p = new URL(req.url).searchParams;
    const motor = motorValido(p.get('motor'));
    const bd = p.get('bd');
    if (!esNombreValido(bd)) throw new Error('Indica la base de datos');

    const tablas = await tablasOrdenadas(motor, bd);
    const out = [`-- Respaldo de ${bd} (${new Date().toISOString()})`];
    if (tablas.length) out.push(`TRUNCATE ${tablas.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`);

    for (const t of tablas) {
      for (const f of await filasDe(motor, bd, t)) {
        const cols = Object.keys(f);
        out.push(`INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map((c) => lit(f[c])).join(', ')});`);
      }
      // Ajusta los contadores SERIAL para que los próximos INSERT no choquen
      const seriales = await consultar(
        motor,
        bd,
        `SELECT column_name AS c FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}' AND column_default LIKE 'nextval%'`
      );
      for (const { c } of seriales) {
        if (esNombreValido(c)) out.push(`SELECT setval(pg_get_serial_sequence('"${t}"', '${c}'), COALESCE((SELECT MAX("${c}") FROM "${t}"), 1));`);
      }
    }

    return new Response(out.join('\n') + '\n', {
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="respaldo_${bd}.sql"`,
      },
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}

// Restauración: ejecuta un .sql generado por el respaldo
export async function POST(req) {
  try {
    const { motor: m, bd, contenido } = await req.json();
    const motor = motorValido(m);
    if (!esNombreValido(bd)) throw new Error('Indica la base de datos');

    const lineas = String(contenido || '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('--'));
    let n = 0;
    for (const l of lineas) {
      if (!/^(TRUNCATE|INSERT INTO|SELECT setval)\b/i.test(l)) throw new Error(`Línea no permitida: ${l.slice(0, 50)}`);
      await ejecutar(motor, bd, l.replace(/;$/, ''));
      n++;
    }
    return Response.json({ ok: true, sentencias: n });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}