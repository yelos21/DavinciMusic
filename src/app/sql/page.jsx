'use client';
import { useState } from 'react';
import { BASES, EJEMPLOS } from '@/app/lib/ejemplos';

export default function PanelBD() {
  const [motor, setMotor] = useState('prisma');
  const [bd, setBd] = useState('davinci_music');
  const [nuevaBd, setNuevaBd] = useState('');
  const [ejemplo, setEjemplo] = useState('proyecto_42');
  const [sql, setSql] = useState(EJEMPLOS.proyecto_42.sql);
  const [tabla, setTabla] = useState('');
  const [archivo, setArchivo] = useState(null); // { nombre, texto }
  const [historial, setHistorial] = useState([]);
  const [consulta, setConsulta] = useState(null); // { titulo, filas }
  const [cargando, setCargando] = useState(false);

  const agregar = (ok, texto) => setHistorial((h) => [{ ok, texto }, ...h]);

  // Llama a la API; maneja errores de red y de servidor
  const llamar = async (url, opciones) => {
    setCargando(true);
    try {
      const res = await fetch(url, opciones);
      const tipo = res.headers.get('content-type') || '';
      if (res.ok && !tipo.includes('application/json')) return { ok: true, blob: await res.blob(), res };
      return await res.json();
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor' };
    } finally {
      setCargando(false);
    }
  };
  const post = (url, cuerpo) =>
    llamar(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motor, bd, ...cuerpo }) });

  const descargar = (blob, nombre) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // 4.1 Bases de datos
  const accionBd = async (accion, nombre) => {
    const d = await post('/api/db', { accion, nombre });
    agregar(d.ok, d.ok ? d.sql : d.error);
  };
  const crearTodas = async () => {
    for (const n of BASES) await accionBd('create', n);
  };
  const listarBd = async () => {
    const d = await llamar(`/api/db?motor=${motor}`);
    if (d.ok) setConsulta({ titulo: 'Bases de datos', filas: d.filas });
    else agregar(false, d.error);
  };

  // 4.2 / 4.3 SQL
  const elegirEjemplo = (k) => {
    setEjemplo(k);
    setSql(EJEMPLOS[k].sql);
    setBd(EJEMPLOS[k].bd);
  };
  const ejecutarSql = async () => {
    const d = await post('/api/sql', { sql });
    if (!d.ok) return agregar(false, d.error);
    (d.resultados || []).forEach((r) => agregar(true, r.sql.length > 160 ? r.sql.slice(0, 160) + '…' : r.sql));
    const ultimo = [...d.resultados].reverse().find((r) => r.filas);
    if (ultimo) setConsulta({ titulo: 'Resultado de SELECT', filas: ultimo.filas });
  };

  // 4.4 Respaldo y restauración
  const respaldar = async () => {
    const d = await llamar(`/api/respaldo?motor=${motor}&bd=${encodeURIComponent(bd)}`);
    if (d.blob) {
      descargar(d.blob, `respaldo_${bd}.sql`);
      agregar(true, `Respaldo de ${bd} descargado`);
    } else agregar(false, d.error);
  };
  const restaurar = async () => {
    if (!archivo) return agregar(false, 'Elige un archivo .sql de respaldo');
    if (!window.confirm(`Se vaciarán las tablas de "${bd}" antes de restaurar. ¿Continuar?`)) return;
    const d = await post('/api/respaldo', { contenido: archivo.texto });
    agregar(d.ok, d.ok ? `Restauración completa: ${d.sentencias} sentencias` : d.error);
  };

  // 4.5 Usuarios
  const crearUsuarios = async () => {
    const d = await post('/api/usuarios', {});
    if (!d.ok) return agregar(false, d.error);
    agregar(true, 'Usuarios creados. Guarda las contraseñas, no se vuelven a mostrar:\n' + d.usuarios.map((u) => `${u.usuario}  ${u.password}`).join('\n'));
  };
  const verScriptUsuarios = async () => {
    const d = await llamar(`/api/usuarios?bd=${encodeURIComponent(bd)}`);
    agregar(d.ok, d.ok ? d.sql : d.error);
  };

  // 4.6 Importar / exportar
  const exportar = async (formato) => {
    const d = await llamar(`/api/exportar?motor=${motor}&bd=${encodeURIComponent(bd)}&formato=${formato}&tabla=${encodeURIComponent(tabla)}`);
    if (d.blob) {
      const nombre = d.res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || `exportacion.${formato}`;
      descargar(d.blob, nombre);
      agregar(true, `Exportado: ${nombre}`);
    } else agregar(false, d.error);
  };
  const importar = async () => {
    if (!archivo) return agregar(false, 'Elige un archivo .csv o .json');
    const formato = archivo.nombre.toLowerCase().endsWith('.json') ? 'json' : 'csv';
    const d = await post('/api/exportar', { tabla, formato, contenido: archivo.texto });
    agregar(d.ok, d.ok ? `Importadas ${d.filas} filas en ${tabla}` : d.error);
  };

  const leerArchivo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return setArchivo(null);
    const r = new FileReader();
    r.onload = () => setArchivo({ nombre: f.name, texto: String(r.result) });
    r.readAsText(f);
  };

  return (
    <main style={s.main}>
      <style>{`
        :root {
          color-scheme: light dark;
          --bg: #ffffff; --texto: #111827; --suave: #6b7280; --borde: #e5e7eb;
          --campo: #ffffff; --panel: #f9fafb; --ok: #16a34a; --err: #dc2626;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0f1115; --texto: #e5e7eb; --suave: #9ca3af; --borde: #2d333b;
            --campo: #161b22; --panel: #161b22; --ok: #4ade80; --err: #f87171;
          }
        }
        body { background: var(--bg); }
        input:focus-visible, select:focus-visible, button:focus-visible, textarea:focus-visible {
          outline: 2px solid #60a5fa; outline-offset: 2px;
        }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <h1 style={s.h1}>Panel de base de datos</h1>
      <p style={s.sub}>Bases, tablas, restricciones, respaldos, usuarios e importación en PostgreSQL (Neon) con Prisma o Drizzle.</p>

      <section style={s.card}>
        <label style={s.label}>
          Framework
          <select style={s.input} value={motor} onChange={(e) => setMotor(e.target.value)}>
            <option value="prisma">Prisma</option>
            <option value="drizzle">Drizzle ORM</option>
          </select>
        </label>
        <label style={s.label}>
          Base de datos de trabajo
          <input style={s.input} list="bases" value={bd} onChange={(e) => setBd(e.target.value)} placeholder="davinci_music" />
          <datalist id="bases">{BASES.map((b) => <option key={b} value={b} />)}</datalist>
        </label>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>4.1 Bases de datos</h2>
        <div style={s.fila}>
          <input style={{ ...s.input, flex: 1, minWidth: 160 }} value={nuevaBd} onChange={(e) => setNuevaBd(e.target.value)} placeholder="nombre_de_base" />
          <button style={{ ...s.btn, ...s.verde }} disabled={cargando} onClick={() => accionBd('create', nuevaBd)}>Crear</button>
          <button style={{ ...s.btn, ...s.rojo }} disabled={cargando} onClick={() => window.confirm(`¿Eliminar la base "${nuevaBd}"?`) && accionBd('drop', nuevaBd)}>Eliminar</button>
        </div>
        <div style={{ ...s.fila, marginTop: 8 }}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={crearTodas}>Crear proyecto y 3 ejemplos</button>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando} onClick={listarBd}>Ver bases</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>4.2 y 4.3 Tablas, registros y restricciones</h2>
        <select style={{ ...s.input, width: '100%', marginBottom: 8 }} value={ejemplo} onChange={(e) => elegirEjemplo(e.target.value)}>
          {Object.entries(EJEMPLOS).map(([k, v]) => <option key={k} value={k}>{v.titulo}</option>)}
        </select>
        <textarea style={{ ...s.input, ...s.area }} value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false} />
        <div style={{ ...s.fila, marginTop: 8 }}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={ejecutarSql}>Ejecutar en {bd || '…'}</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>4.4 Respaldo y restauración</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.verde }} disabled={cargando} onClick={respaldar}>Descargar respaldo</button>
          <input type="file" accept=".sql" onChange={leerArchivo} />
          <button style={{ ...s.btn, ...s.ambar }} disabled={cargando} onClick={restaurar}>Restaurar</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>4.5 Usuarios (10 usuarios con permisos)</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.verde }} disabled={cargando} onClick={crearUsuarios}>Crear 10 usuarios</button>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando} onClick={verScriptUsuarios}>Ver script SQL</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>4.6 Importar y exportar</h2>
        <input style={{ ...s.input, width: '100%', marginBottom: 8 }} value={tabla} onChange={(e) => setTabla(e.target.value)} placeholder="Tabla (para CSV / JSON)" />
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => exportar('mysql')}>Exportar a MySQL</button>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => exportar('sqlite')}>Exportar a SQLite</button>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando || !tabla} onClick={() => exportar('csv')}>Tabla a CSV</button>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando || !tabla} onClick={() => exportar('json')}>Tabla a JSON</button>
        </div>
        <div style={{ ...s.fila, marginTop: 8 }}>
          <input type="file" accept=".csv,.json" onChange={leerArchivo} />
          <button style={{ ...s.btn, ...s.ambar }} disabled={cargando || !tabla} onClick={importar}>Importar a la tabla</button>
        </div>
      </section>

      {consulta && (
        <section style={s.grupo}>
          <h2 style={s.h2}>{consulta.titulo}</h2>
          {consulta.filas.length === 0 ? (
            <p style={s.vacio}>Sin resultados.</p>
          ) : (
            <div style={s.tablaWrap}>
              <table style={s.tabla}>
                <thead>
                  <tr>{Object.keys(consulta.filas[0]).map((c) => <th key={c} style={s.th}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {consulta.filas.map((f, i) => (
                    <tr key={i}>{Object.values(f).map((v, j) => <td key={j} style={s.td}>{String(v)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section style={s.grupo}>
        <h2 style={s.h2}>Resultado</h2>
        {historial.length === 0 && <p style={s.vacio}>Aún no has ejecutado ninguna sentencia.</p>}
        {historial.map((h, i) => (
          <pre key={i} style={{ ...s.log, borderLeftColor: h.ok ? 'var(--ok)' : 'var(--err)' }}>
            {h.ok ? 'OK  ' : 'ERROR  '}
            {h.texto}
          </pre>
        ))}
      </section>
    </main>
  );
}

const s = {
  main: { maxWidth: 720, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif', color: 'var(--texto)', background: 'var(--bg)', minHeight: '100vh' },
  h1: { fontSize: 28, margin: 0 },
  h2: { fontSize: 16, margin: '0 0 8px' },
  sub: { color: 'var(--suave)', marginBottom: 24 },
  card: { display: 'grid', gap: 12, padding: 16, border: '1px solid var(--borde)', borderRadius: 8, marginBottom: 24 },
  label: { display: 'grid', gap: 4, fontSize: 14 },
  input: { padding: 8, border: '1px solid var(--borde)', borderRadius: 6, fontSize: 15, background: 'var(--campo)', color: 'var(--texto)' },
  area: { width: '100%', minHeight: 220, boxSizing: 'border-box', fontFamily: 'ui-monospace, monospace', fontSize: 13, resize: 'vertical' },
  grupo: { marginBottom: 24 },
  fila: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  btn: { padding: '10px 16px', border: 'none', borderRadius: 6, color: '#fff', fontSize: 15, cursor: 'pointer' },
  verde: { background: '#15803d' },
  azul: { background: '#2563eb' },
  rojo: { background: '#dc2626' },
  ambar: { background: '#b45309' },
  gris: { background: '#4b5563' },
  vacio: { color: 'var(--suave)', fontSize: 14 },
  tablaWrap: { overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--borde)', color: 'var(--suave)', fontWeight: 600 },
  td: { padding: '6px 8px', borderBottom: '1px solid var(--borde)' },
  log: { margin: '0 0 8px', padding: 10, background: 'var(--panel)', color: 'var(--texto)', borderLeft: '4px solid', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
};