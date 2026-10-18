import { randomBytes } from 'crypto';
import { ejecutar, consultar, esNombreValido, motorValido } from '@/app/lib/db';

// [usuario, privilegios, tablas ('*' = todas las del esquema public)]
const USUARIOS = [
  ['usr_admin', ['ALL'], '*'],
  ['usr_director', ['SELECT', 'INSERT', 'UPDATE'], '*'],
  ['usr_maestro', ['SELECT'], ['alumno', 'inscripcion', 'instrumento']],
  ['usr_recepcion', ['SELECT', 'INSERT', 'UPDATE'], ['alumno', 'inscripcion']],
  ['usr_ventas', ['SELECT', 'INSERT', 'UPDATE'], ['instrumento']],
  ['usr_inventario', ['SELECT', 'INSERT', 'UPDATE', 'DELETE'], ['instrumento', 'categoria_instrumento']],
  ['usr_contador', ['SELECT'], '*'],
  ['usr_soporte', ['SELECT', 'REFERENCES'], '*'],
  ['usr_alumno', ['SELECT'], ['instrumento', 'categoria_instrumento']],
  ['usr_invitado', ['SELECT'], ['categoria_instrumento']],
];

// Script que se ejecuta (contraseñas ocultas si "ocultar" es true)
function script(bd, claves, ocultar) {
  const out = [];
  USUARIOS.forEach(([u, privs, tablas]) => {
    const p = ocultar ? '********' : claves[u];
    out.push(`DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${u}') THEN CREATE ROLE "${u}" LOGIN PASSWORD '${p}'; ELSE ALTER ROLE "${u}" LOGIN PASSWORD '${p}'; END IF; END $$`);
    out.push(`GRANT CONNECT ON DATABASE "${bd}" TO "${u}"`);
    out.push(`GRANT USAGE ON SCHEMA public TO "${u}"`);
    const destino = tablas === '*' ? 'ALL TABLES IN SCHEMA public' : `TABLE ${tablas.map((t) => `"public"."${t}"`).join(', ')}`;
    out.push(`GRANT ${privs.join(', ')} ON ${destino} TO "${u}"`);
  });
  return out;
}

// Crea (o actualiza) los 10 usuarios. Devuelve las contraseñas UNA sola vez.
export async function POST(req) {
  try {
    const { motor: m, bd } = await req.json();
    const motor = motorValido(m);
    if (!esNombreValido(bd)) throw new Error('Indica la base de datos');

    const claves = Object.fromEntries(USUARIOS.map(([u]) => [u, randomBytes(9).toString('base64url')]));
    for (const s of script(bd, claves, false)) await ejecutar(motor, bd, s);
    return Response.json({ ok: true, usuarios: USUARIOS.map(([u]) => ({ usuario: u, password: claves[u] })) });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}

// Muestra el script SQL (sin contraseñas) para correrlo en consola
export async function GET(req) {
  const bd = new URL(req.url).searchParams.get('bd');
  if (!esNombreValido(bd)) return Response.json({ ok: false, error: 'Indica la base de datos' }, { status: 400 });
  return Response.json({ ok: true, sql: script(bd, {}, true).join(';\n') + ';' });
}