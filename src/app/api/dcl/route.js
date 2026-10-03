import { prisma } from '../../lib/prisma';

const PRIVILEGIOS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'ALL'];

// Solo letras, números y guion bajo (evita SQL injection en nombres)
const esNombreValido = (n) => typeof n === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(n);
const esReservado = (n) => /^(pg_|neon|cloud)/i.test(n);

function validarUsuario(usuario) {
  if (!esNombreValido(usuario)) throw new Error('Nombre de usuario inválido');
  if (esReservado(usuario)) throw new Error('Ese nombre está reservado por el sistema');
  return `"${usuario}"`;
}

function objetivo({ tabla, todas }) {
  if (todas) return 'ALL TABLES IN SCHEMA public';
  if (!esNombreValido(tabla)) throw new Error('Nombre de tabla inválido');
  return `TABLE "public"."${tabla}"`;
}

function privilegioValido(p) {
  const priv = String(p || '').toUpperCase();
  if (!PRIVILEGIOS.includes(priv)) throw new Error('Privilegio no permitido');
  return priv;
}

// Devuelve las sentencias a ejecutar y el texto que se muestra en pantalla
function construir(body) {
  const { accion, usuario, password, privilegio } = body;
  const u = validarUsuario(usuario);

  if (accion === 'create_user') {
    if (typeof password !== 'string' || password.length < 8 || /\0/.test(password)) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    const pass = password.replace(/'/g, "''");
    return {
      sentencias: [`CREATE ROLE ${u} LOGIN PASSWORD '${pass}'`],
      mostrar: `CREATE ROLE ${u} LOGIN PASSWORD '********'`,
    };
  }
  if (accion === 'drop_user') {
    return {
      sentencias: [
        `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${u}`,
        `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ${u}`,
        `DROP ROLE IF EXISTS ${u}`,
      ],
      mostrar: `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${u}; DROP ROLE IF EXISTS ${u}`,
    };
  }
  if (accion === 'grant') {
    const sql = `GRANT ${privilegioValido(privilegio)} ON ${objetivo(body)} TO ${u}`;
    return { sentencias: [sql], mostrar: sql };
  }
  if (accion === 'revoke') {
    const sql = `REVOKE ${privilegioValido(privilegio)} ON ${objetivo(body)} FROM ${u}`;
    return { sentencias: [sql], mostrar: sql };
  }
  throw new Error('Acción no permitida');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sentencias, mostrar } = construir(body);
    if (sentencias.length === 1) {
      await prisma.$executeRawUnsafe(sentencias[0]);
    } else {
      await prisma.$transaction(sentencias.map((s) => prisma.$executeRawUnsafe(s)));
    }
    return Response.json({ ok: true, sql: mostrar });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}

// Sin parámetros: lista usuarios. Con ?usuario=x: lista sus permisos sobre tablas.
export async function GET(req) {
  try {
    const usuario = new URL(req.url).searchParams.get('usuario');
    if (usuario) {
      if (!esNombreValido(usuario)) throw new Error('Nombre de usuario inválido');
      const filas = await prisma.$queryRawUnsafe(
        `SELECT table_name AS tabla, privilege_type AS privilegio
         FROM information_schema.role_table_grants
         WHERE grantee = $1 AND table_schema = 'public'
         ORDER BY table_name, privilege_type`,
        usuario
      );
      return Response.json({ ok: true, filas });
    }
    const filas = await prisma.$queryRawUnsafe(
      `SELECT rolname AS usuario FROM pg_roles WHERE rolcanlogin ORDER BY rolname`
    );
    return Response.json({ ok: true, filas });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}