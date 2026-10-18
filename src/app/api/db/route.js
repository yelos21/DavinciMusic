import { ejecutar, consultar, esNombreValido, motorValido } from '@/app/lib/db';

// Listar bases de datos
export async function GET(req) {
  try {
    const motor = motorValido(new URL(req.url).searchParams.get('motor'));
    const filas = await consultar(motor, null, `SELECT datname AS base_de_datos FROM pg_database WHERE NOT datistemplate ORDER BY datname`);
    return Response.json({ ok: true, filas });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}

// Crear o eliminar una base de datos (CREATE DATABASE / DROP DATABASE)
export async function POST(req) {
  try {
    const { motor: m, accion, nombre } = await req.json();
    const motor = motorValido(m);
    if (!esNombreValido(nombre)) throw new Error('Nombre de base de datos inválido');

    let sql;
    if (accion === 'create') {
      sql = `CREATE DATABASE "${nombre}"`;
    } else if (accion === 'drop') {
      const [{ actual }] = await consultar(motor, null, `SELECT current_database() AS actual`);
      if (nombre === actual || nombre === 'postgres') throw new Error('No se puede eliminar esa base de datos');
      sql = `DROP DATABASE IF EXISTS "${nombre}"`;
    } else {
      throw new Error('Acción no permitida');
    }
    await ejecutar(motor, null, sql);
    return Response.json({ ok: true, sql });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}