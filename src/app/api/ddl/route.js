import { prisma } from '@/app/lib/prisma';

const TIPOS = {
  texto: 'VARCHAR(100)',
  entero: 'INTEGER',
  decimal: 'NUMERIC(10,2)',
  fecha: 'DATE',
  booleano: 'BOOLEAN',
};
 
// Solo letras, números y guion bajo (evita SQL injection en nombres)
const esNombreValido = (n) => typeof n === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(n);
 
function construirSQL({ accion, tabla, columna, nuevo, tipo }) {
  if (!esNombreValido(tabla)) throw new Error('Nombre de tabla inválido');
  const t = `"${tabla}"`;
 
  if (accion === 'create') {
    if (!esNombreValido(columna)) throw new Error('Nombre de columna inválido');
    if (!TIPOS[tipo]) throw new Error('Tipo inválido');
    return `CREATE TABLE ${t} (id SERIAL PRIMARY KEY, "${columna}" ${TIPOS[tipo]})`;
  }
  if (accion === 'add_column') {
    if (!esNombreValido(columna)) throw new Error('Nombre de columna inválido');
    if (!TIPOS[tipo]) throw new Error('Tipo inválido');
    return `ALTER TABLE ${t} ADD COLUMN "${columna}" ${TIPOS[tipo]}`;
  }
  if (accion === 'drop_column') {
    if (!esNombreValido(columna)) throw new Error('Nombre de columna inválido');
    return `ALTER TABLE ${t} DROP COLUMN "${columna}"`;
  }
  if (accion === 'rename_column') {
    if (!esNombreValido(columna) || !esNombreValido(nuevo)) throw new Error('Nombre de columna inválido');
    return `ALTER TABLE ${t} RENAME COLUMN "${columna}" TO "${nuevo}"`;
  }
  if (accion === 'drop') {
    return `DROP TABLE IF EXISTS ${t}`;
  }
  throw new Error('Acción no permitida');
}
 
export async function POST(req) {
  try {
    const body = await req.json();
    const sql = construirSQL(body);
    await prisma.$executeRawUnsafe(sql);
    return Response.json({ ok: true, sql });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}
