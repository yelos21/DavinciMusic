import { ejecutar, consultar, esNombreValido, motorValido, lit, tablasOrdenadas, filasDe } from '@/app/lib/db';

// Tipos de PostgreSQL -> tipos del otro motor
const TIPOS = {
  mysql: {
    integer: 'INT', bigint: 'BIGINT', smallint: 'SMALLINT', text: 'TEXT', date: 'DATE', boolean: 'TINYINT(1)',
    'character varying': (c) => `VARCHAR(${c.largo || 255})`,
    numeric: (c) => `DECIMAL(${c.p || 10},${c.e ?? 2})`,
    'timestamp without time zone': 'DATETIME', 'timestamp with time zone': 'DATETIME',
  },
  sqlite: {
    integer: 'INTEGER', bigint: 'INTEGER', smallint: 'INTEGER', text: 'TEXT', date: 'TEXT', boolean: 'INTEGER',
    'character varying': 'TEXT', numeric: 'REAL',
    'timestamp without time zone': 'TEXT', 'timestamp with time zone': 'TEXT',
  },
};

function tipoDe(dialecto, c) {
  const t = TIPOS[dialecto][c.tipo] ?? 'TEXT';
  return typeof t === 'function' ? t(c) : t;
}

function valorDe(dialecto, v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (dialecto === 'mysql') s = s.replace(/\\/g, '\\\\');
  return `'${s.replace(/'/g, "''")}'`;
}

async function exportarSQL(motor, bd, dialecto) {
  const q = dialecto === 'mysql' ? (n) => `\`${n}\`` : (n) => `"${n}"`;
  const out = [`-- ${bd} exportada a ${dialecto.toUpperCase()}`];
  if (dialecto === 'mysql') out.push('SET FOREIGN_KEY_CHECKS = 0;');
  for (const t of await tablasOrdenadas(motor, bd)) {
    const cols = await consultar(
      motor,
      bd,
      `SELECT column_name AS c, data_type AS tipo, character_maximum_length AS largo, numeric_precision AS p, numeric_scale AS e, is_nullable AS nulo, column_default AS def
       FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}' ORDER BY ordinal_position`
    );
    const defs = cols.map((c) => {
      if (String(c.def || '').startsWith('nextval')) {
        return dialecto === 'mysql' ? `${q(c.c)} INT AUTO_INCREMENT PRIMARY KEY` : `${q(c.c)} INTEGER PRIMARY KEY AUTOINCREMENT`;
      }
      return `${q(c.c)} ${tipoDe(dialecto, c)}${c.nulo === 'NO' ? ' NOT NULL' : ''}`;
    });
    out.push(`DROP TABLE IF EXISTS ${q(t)};`, `CREATE TABLE ${q(t)} (${defs.join(', ')});`);
    for (const f of await filasDe(motor, bd, t)) {
      const k = Object.keys(f);
      out.push(`INSERT INTO ${q(t)} (${k.map(q).join(', ')}) VALUES (${k.map((x) => valorDe(dialecto, f[x])).join(', ')});`);
    }
  }
  if (dialecto === 'mysql') out.push('SET FOREIGN_KEY_CHECKS = 1;');
  return out.join('\n') + '\n';
}

const csvCelda = (v) => {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function parseCSV(t) {
  const filas = [];
  let f = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"' && t[i + 1] === '"') { c += '"'; i++; }
      else if (ch === '"') q = false;
      else c += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { f.push(c); c = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      f.push(c); c = ''; filas.push(f); f = [];
    } else c += ch;
  }
  if (c !== '' || f.length) { f.push(c); filas.push(f); }
  return filas.filter((r) => r.some((x) => x !== ''));
}

function descarga(texto, nombre, tipo) {
  return new Response(texto, {
    headers: { 'Content-Type': `${tipo}; charset=utf-8`, 'Content-Disposition': `attachment; filename="${nombre}"` },
  });
}

// Exportar: formato = mysql | sqlite (toda la base) | csv | json (una tabla)
export async function GET(req) {
  try {
    const p = new URL(req.url).searchParams;
    const motor = motorValido(p.get('motor'));
    const bd = p.get('bd');
    const formato = p.get('formato');
    const tabla = p.get('tabla');
    if (!esNombreValido(bd)) throw new Error('Indica la base de datos');

    if (formato === 'mysql' || formato === 'sqlite') {
      return descarga(await exportarSQL(motor, bd, formato), `${bd}_${formato}.sql`, 'application/sql');
    }
    if (!esNombreValido(tabla)) throw new Error('Indica la tabla');
    const filas = await filasDe(motor, bd, tabla);
    if (formato === 'json') return descarga(JSON.stringify(filas, null, 2), `${tabla}.json`, 'application/json');
    if (formato === 'csv') {
      const k = filas.length ? Object.keys(filas[0]) : [];
      const csv = [k.join(','), ...filas.map((f) => k.map((x) => csvCelda(f[x])).join(','))].join('\n');
      return descarga(csv + '\n', `${tabla}.csv`, 'text/csv');
    }
    throw new Error('Formato no permitido');
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}

// Importar CSV o JSON a una tabla existente
export async function POST(req) {
  try {
    const { motor: m, bd, tabla, formato, contenido } = await req.json();
    const motor = motorValido(m);
    if (!esNombreValido(bd) || !esNombreValido(tabla)) throw new Error('Indica base de datos y tabla');

    let filas;
    if (formato === 'json') {
      filas = JSON.parse(contenido);
      if (!Array.isArray(filas)) throw new Error('El JSON debe ser una lista de objetos');
    } else if (formato === 'csv') {
      const [enc, ...datos] = parseCSV(String(contenido));
      filas = datos.map((r) => Object.fromEntries(enc.map((c, i) => [c.trim(), r[i]])));
    } else throw new Error('Formato no permitido');

    let n = 0;
    for (const f of filas) {
      const k = Object.keys(f);
      if (!k.every(esNombreValido)) throw new Error('Nombre de columna inválido en el archivo');
      await ejecutar(motor, bd, `INSERT INTO "${tabla}" (${k.map((x) => `"${x}"`).join(', ')}) VALUES (${k.map((x) => lit(f[x])).join(', ')})`);
      n++;
    }
    return Response.json({ ok: true, filas: n });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}