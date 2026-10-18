import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

// Solo letras, números y guion bajo (evita SQL injection en nombres)
export const esNombreValido = (n) => typeof n === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(n);
export const motorValido = (m) => (m === 'drizzle' ? 'drizzle' : 'prisma');

// Un cliente por (framework + base de datos), reutilizado entre peticiones
const cache = globalThis.__dbCache || (globalThis.__dbCache = new Map());

function urlDe(bd) {
  const u = new URL(process.env.DATABASE_URL);
  if (bd) u.pathname = '/' + bd;
  return u.toString();
}

function cliente(motor, bd) {
  if (bd && !esNombreValido(bd)) throw new Error('Nombre de base de datos inválido');
  const k = `${motor}:${bd || ''}`;
  if (!cache.has(k)) {
    const url = urlDe(bd);
    cache.set(
      k,
      motor === 'drizzle'
        ? drizzle(url)
        : new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
    );
  }
  return cache.get(k);
}

export async function ejecutar(motor, bd, texto) {
  const c = cliente(motor, bd);
  if (motor === 'drizzle') await c.execute(sql.raw(texto));
  else await c.$executeRawUnsafe(texto);
}

export async function consultar(motor, bd, texto) {
  const c = cliente(motor, bd);
  const filas = motor === 'drizzle' ? (await c.execute(sql.raw(texto))).rows : await c.$queryRawUnsafe(texto);
  return seguro(filas);
}

// BigInt y Decimal no se serializan a JSON directamente
export const seguro = (x) => JSON.parse(JSON.stringify(x, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

// Valor -> literal SQL de PostgreSQL (una sentencia = una línea)
export function lit(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return `E'${s.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;
}

// Tablas de public ordenadas: primero las "padre" (para que las FK no fallen al restaurar)
export async function tablasOrdenadas(motor, bd) {
  const t = (
    await consultar(motor, bd, `SELECT table_name AS t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`)
  )
    .map((r) => r.t)
    .filter((n) => esNombreValido(n) && !n.startsWith('_prisma'));
  const fk = await consultar(
    motor,
    bd,
    `SELECT tc.table_name AS hijo, ccu.table_name AS padre
     FROM information_schema.table_constraints tc
     JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`
  );
  const orden = [];
  const pend = new Set(t);
  while (pend.size) {
    const listo = [...pend].find((n) => !fk.some((f) => f.hijo === n && f.padre !== n && pend.has(f.padre)));
    const x = listo ?? [...pend][0];
    orden.push(x);
    pend.delete(x);
  }
  return orden;
}

// Filas como objetos JSON (fechas como texto, números exactos)
export const filasDe = async (motor, bd, tabla) =>
  (await consultar(motor, bd, `SELECT to_jsonb(t) AS fila FROM "${tabla}" t`)).map((r) => r.fila);