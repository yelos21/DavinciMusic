'use client';
import { useState } from 'react';

const TIPOS = ['texto', 'entero', 'decimal', 'fecha', 'booleano'];

export default function Home() {
  const [tabla, setTabla] = useState('');
  const [columna, setColumna] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [tipo, setTipo] = useState('texto');
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);

  const ejecutar = async (accion) => {
    setCargando(true);
    try {
      const res = await fetch('/api/ddl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, tabla, columna, nuevo, tipo }),
      });
      const data = await res.json();
      setHistorial((h) => [
        { ok: data.ok, texto: data.ok ? data.sql : data.error },
        ...h,
      ]);
    } catch {
      setHistorial((h) => [{ ok: false, texto: 'No se pudo conectar con el servidor' }, ...h]);
    }
    setCargando(false);
  };

  const confirmarDrop = () => {
    if (window.confirm(`¿Eliminar la tabla "${tabla}"? Esta acción no se puede deshacer.`)) {
      ejecutar('drop');
    }
  };

  return (
    <main style={s.main}>
      <style>{`
        :root {
          color-scheme: light dark;
          --bg: #ffffff;
          --texto: #111827;
          --suave: #6b7280;
          --borde: #e5e7eb;
          --campo: #ffffff;
          --panel: #f9fafb;
          --ok: #16a34a;
          --err: #dc2626;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0f1115;
            --texto: #e5e7eb;
            --suave: #9ca3af;
            --borde: #2d333b;
            --campo: #161b22;
            --panel: #161b22;
            --ok: #4ade80;
            --err: #f87171;
          }
        }
        body { background: var(--bg); }
        input:focus-visible, select:focus-visible, button:focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 2px;
        }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
      <h1 style={s.h1}>Panel DDL</h1>
      <p style={s.sub}>Crea, modifica y elimina tablas de PostgreSQL (Neon) con Prisma.</p>

      <section style={s.card}>
        <label style={s.label}>
          Tabla
          <input style={s.input} value={tabla} onChange={(e) => setTabla(e.target.value)} placeholder="alumnos" />
        </label>
        <label style={s.label}>
          Columna
          <input style={s.input} value={columna} onChange={(e) => setColumna(e.target.value)} placeholder="nombre" />
        </label>
        <label style={s.label}>
          Nuevo nombre de columna (solo para renombrar)
          <input style={s.input} value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="nombre_completo" />
        </label>
        <label style={s.label}>
          Tipo de dato
          <select style={s.input} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>CREATE</h2>
        <button style={{ ...s.btn, ...s.verde }} disabled={cargando} onClick={() => ejecutar('create')}>
          Crear tabla
        </button>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>ALTER</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => ejecutar('add_column')}>
            Agregar columna
          </button>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => ejecutar('rename_column')}>
            Renombrar columna
          </button>
          <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => ejecutar('drop_column')}>
            Eliminar columna
          </button>
        </div>
      </section>

      <section style={s.grupo}>
        <h2 style={s.h2}>DROP</h2>
        <button style={{ ...s.btn, ...s.rojo }} disabled={cargando} onClick={confirmarDrop}>
          Eliminar tabla
        </button>
      </section>

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
  main: { maxWidth: 640, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif', color: 'var(--texto)', background: 'var(--bg)', minHeight: '100vh' },
  h1: { fontSize: 28, margin: 0 },
  h2: { fontSize: 16, margin: '0 0 8px' },
  sub: { color: 'var(--suave)', marginBottom: 24 },
  card: { display: 'grid', gap: 12, padding: 16, border: '1px solid var(--borde)', borderRadius: 8, marginBottom: 24 },
  label: { display: 'grid', gap: 4, fontSize: 14 },
  input: { padding: 8, border: '1px solid var(--borde)', borderRadius: 6, fontSize: 15, background: 'var(--campo)', color: 'var(--texto)' },
  grupo: { marginBottom: 20 },
  fila: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  btn: { padding: '10px 16px', border: 'none', borderRadius: 6, color: '#fff', fontSize: 15, cursor: 'pointer' },
  verde: { background: '#15803d' },
  azul: { background: '#2563eb' },
  rojo: { background: '#dc2626' },
  vacio: { color: 'var(--suave)', fontSize: 14 },
  log: { margin: '0 0 8px', padding: 10, background: 'var(--panel)', color: 'var(--texto)', borderLeft: '4px solid', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
};