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
  // 5.x Práctica avanzada: solo bases que empiezan con practica_
  const [bd5, setBd5] = useState('practica_davinci');
  const [seccion5, setSeccion5] = useState(null);
  const [vista5, setVista5] = useState('v_instrumentos_categoria');

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

  // 5.1 - 5.6 Práctica avanzada
  const url5 = (params) =>
    `/api/practica5?motor=${motor}&bd=${encodeURIComponent(bd5)}&${new URLSearchParams(params)}`;

  const lista5 = async (seccion, titulo) => {
    const d = await llamar(url5({ seccion }));
    if (!d.ok) return agregar(false, d.error);
    setSeccion5({ titulo, resultados: d.resultados, resumen: `${d.correctas} de ${d.total} consultas correctas` });
    agregar(d.errores.length === 0, `${titulo}: ${d.correctas}/${d.total} correctas${d.errores.length ? '\n' + d.errores.join('\n') : ''}`);
  };

  const accion5 = async (accion, titulo) => {
    const d = await post('/api/practica5', { accion, bd: bd5 });
    if (!d.ok) return agregar(false, d.error);
    if (d.secciones) setSeccion5({ titulo, avance: d });
    else if (d.pruebas) setSeccion5({ titulo, pruebas: d.pruebas });
    else if (d.vistas) setSeccion5({ titulo, resumen: d.mensaje, resultados: [], lista: d.vistas });
    else agregar(true, d.mensaje || 'Listo');
    if (d.mensaje && !d.secciones) agregar(true, d.mensaje);
  };

  const verVistas5 = async () => {
    const d = await llamar(url5({ seccion: 'vistas' }));
    if (!d.ok) return agregar(false, d.error);
    setConsulta({ titulo: `Vistas en ${bd5}`, filas: d.vistas });
    agregar(true, `${d.total} vistas encontradas en ${bd5}`);
  };

  const verFunciones5 = async () => {
    const d = await llamar(url5({ seccion: 'funciones' }));
    if (!d.ok) return agregar(false, d.error);
    setSeccion5({ titulo: `Funciones y disparadores en ${bd5}`, funciones: d.funciones, disparadores: d.disparadores, auditoria: d.registros_auditoria });
  };

  const consultarVista5 = async () => {
    const d = await llamar(url5({ seccion: 'vista', vista: vista5 }));
    if (!d.ok) return agregar(false, d.error);
    setConsulta({ titulo: vista5, filas: d.filas });
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

      <section style={s.grupo}>
        <h2 style={s.h2}>5. Práctica avanzada (consultas, JOIN, vistas, funciones)</h2>
        <p style={s.vacio}>
          Trabaja sobre una base de práctica con el mismo esquema del proyecto. Solo acepta nombres que empiezan con
          <code> practica_</code>; la base real (neondb) no se modifica.
        </p>
        <input style={{ ...s.input, width: '100%', marginBottom: 8 }} value={bd5} onChange={(e) => setBd5(e.target.value)} placeholder="practica_davinci" />
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.verde }} disabled={cargando} onClick={() => accion5('preparar', '5.0 Base de práctica preparada')}>5.0 Preparar base de práctica</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>5.1 25 consultas simples</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => lista5('consultas', '5.1 Consultas simples')}>Ejecutar las 25 consultas</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>5.2 15 operaciones JOIN</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => lista5('joins', '5.2 Operaciones JOIN')}>Ejecutar los 15 JOIN</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>5.3 15 funciones agregadas</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => lista5('agregadas', '5.3 Funciones agregadas')}>Ejecutar las 15 agregadas</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>5.4 5 vistas</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => accion5('vistas', '5.4 Vistas creadas')}>Crear las 5 vistas</button>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando} onClick={verVistas5}>Ver vistas</button>
        </div>
        <div style={{ ...s.fila, marginTop: 8 }}>
          <select style={{ ...s.input, flex: 1, minWidth: 220 }} value={vista5} onChange={(e) => setVista5(e.target.value)}>
            <option value="v_instrumentos_categoria">v_instrumentos_categoria</option>
            <option value="v_clases_detalle">v_clases_detalle</option>
            <option value="v_inscripciones_resumen">v_inscripciones_resumen</option>
            <option value="v_ventas_resumen">v_ventas_resumen</option>
            <option value="v_stock_bajo">v_stock_bajo</option>
          </select>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando} onClick={consultarVista5}>Consultar vista</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>5.5 5 funciones y 3 disparadores</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => accion5('funciones', '5.5 Funciones y disparadores creados')}>Crear funciones y disparadores</button>
          <button style={{ ...s.btn, ...s.ambar }} disabled={cargando} onClick={() => accion5('probar', '5.5 Prueba de disparadores')}>Probar disparadores</button>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando} onClick={verFunciones5}>Ver funciones</button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>5.6 Tercer avance del proyecto</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.verde }} disabled={cargando} onClick={() => accion5('avance3', '5.6 Tercer avance')}>Presentar tercer avance</button>
        </div>
      </section>

      {seccion5 && (
        <section style={s.grupo}>
          <h2 style={s.h2}>{seccion5.titulo}</h2>
          {seccion5.resumen && <p style={s.vacio}>{seccion5.resumen}</p>}

          {seccion5.avance && (
            <>
              <ul style={s.lista}>
                <li>Base: <strong>{seccion5.avance.bd}</strong> ({seccion5.avance.datos_de_ejemplo})</li>
                <li>Registros: {Object.entries(seccion5.avance.registros).map(([t, n]) => `${t}=${n}`).join(', ')}</li>
                <li>Vistas: {seccion5.avance.vistas.creadas} — {seccion5.avance.vistas.nombres.join(', ')}</li>
                <li>Funciones: {seccion5.avance.funciones.creadas} · Disparadores: {seccion5.avance.funciones.disparadores}</li>
                {seccion5.avance.secciones.map((x) => (
                  <li key={x.seccion}>
                    {x.seccion}: <strong style={{ color: x.errores.length ? 'var(--err)' : 'var(--ok)' }}>{x.correctas}/{x.total}</strong> correctas
                  </li>
                ))}
              </ul>
            </>
          )}

          {seccion5.pruebas && (
            <ul style={s.lista}>
              {seccion5.pruebas.map((p, i) => (
                <li key={i} style={{ color: p.startsWith('RECHAZADO') ? 'var(--err)' : p.startsWith('ADVERTENCIA') ? 'var(--err)' : undefined }}>{p}</li>
              ))}
            </ul>
          )}

          {seccion5.funciones && (
            <>
              <p style={{ ...s.vacio, marginBottom: 4 }}>Funciones: {seccion5.funciones.length ? seccion5.funciones.join(', ') : 'ninguna'}</p>
              <p style={{ ...s.vacio, marginBottom: 4 }}>Disparadores: {seccion5.disparadores.length ? seccion5.disparadores.join(', ') : 'ninguno'}</p>
              <p style={s.vacio}>Registros en auditoría: {seccion5.auditoria}</p>
            </>
          )}

          {seccion5.lista && <p style={s.vacio}>{seccion5.lista.join(', ')}</p>}

          {(seccion5.resultados || []).map((r) => (
            <details key={r.n} style={s.detalle}>
              <summary style={s.summary}>{r.n}. {r.titulo}</summary>
              <pre style={s.sql}>{r.sql}</pre>
              {r.error ? (
                <p style={{ ...s.vacio, color: 'var(--err)' }}>{r.error}</p>
              ) : (
                <TablaFilas filas={r.filas} />
              )}
            </details>
          ))}
        </section>
      )}

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

function TablaFilas({ filas }) {
  if (!filas || filas.length === 0) return <p style={s.vacio}>Sin resultados.</p>;
  const columnas = Object.keys(filas[0]);
  return (
    <div style={s.tablaWrap}>
      <table style={s.tabla}>
        <thead>
          <tr>{columnas.map((c) => <th key={c} style={s.th}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {columnas.map((c) => (
                <td key={c} style={s.td}>{f[c] === null ? 'NULL' : String(f[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  lista: { fontSize: 14, lineHeight: 1.7, margin: '0 0 8px', paddingLeft: 20 },
  detalle: { border: '1px solid var(--borde)', borderRadius: 6, padding: '8px 10px', marginBottom: 8, background: 'var(--panel)' },
  summary: { cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  sql: { margin: '6px 0', padding: 8, background: 'var(--campo)', border: '1px solid var(--borde)', borderRadius: 4, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
};