import { ejecutar, consultar, esNombreValido, motorValido } from '@/app/lib/db';

// Solo sentencias de tablas, restricciones, índices y registros.
// (CREATE ROLE, GRANT, DROP DATABASE, etc. tienen sus propios paneles)
const PERMITIDAS = /^(CREATE\s+(UNIQUE\s+)?(TABLE|INDEX)|ALTER\s+TABLE|DROP\s+(TABLE|INDEX)|INSERT\s+INTO|UPDATE|DELETE\s+FROM|SELECT)\b/i;

export async function POST(req) {
  try {
    const { motor: m, bd, sql } = await req.json();
    const motor = motorValido(m);
    if (!esNombreValido(bd)) throw new Error('Indica la base de datos');

    const sentencias = String(sql || '')
      .replace(/^\s*--.*$/gm, '') // quita comentarios de línea
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentencias.length === 0) throw new Error('No hay sentencias');

    const resultados = [];
    for (const s of sentencias) {
      if (!PERMITIDAS.test(s)) throw new Error(`Sentencia no permitida: ${s.slice(0, 40)}...`);
      try {
        if (/^SELECT/i.test(s)) resultados.push({ sql: s, filas: await consultar(motor, bd, s) });
        else {
          await ejecutar(motor, bd, s);
          resultados.push({ sql: s });
        }
      } catch (e) {
        return Response.json({ ok: false, error: `${e.message}\n→ ${s.slice(0, 120)}`, resultados }, { status: 400 });
      }
    }
    return Response.json({ ok: true, resultados });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}