'use client';
import { useState } from 'react';
 
const PRIVILEGIOS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'ALL'];
 
export default function PanelDCL() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [privilegio, setPrivilegio] = useState('SELECT');
  const [tabla, setTabla] = useState('');
  const [todas, setTodas] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [consulta, setConsulta] = useState(null); // { titulo, filas }
  const [cargando, setCargando] = useState(false);
 
  const agregar = (ok, texto) => setHistorial((h) => [{ ok, texto }, ...h]);
 
  const ejecutar = async (accion) => {
    setCargando(true);
    try {
      const res = await fetch('/api/dcl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, usuario, password, privilegio, tabla, todas }),
      });
      const data = await res.json();
      agregar(data.ok, data.ok ? data.sql : data.error);
    } catch {
      agregar(false, 'No se pudo conectar con el servidor');
    }
    setCargando(false);
  };
 
  const consultar = async (conUsuario) => {
    setCargando(true);
    try {
      const url = conUsuario ? `/api/dcl?usuario=${encodeURIComponent(usuario)}` : '/api/dcl';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setConsulta({ titulo: conUsuario ? `Permisos de ${usuario}` : 'Usuarios con acceso', filas: data.filas });
      } else {
        agregar(false, data.error);
      }
    } catch {
      agregar(false, 'No se pudo conectar con el servidor');
    }
    setCargando(false);
  };
 
  const confirmarEliminar = () => {
    if (window.confirm(`¿Eliminar el usuario "${usuario}" y sus permisos?`)) ejecutar('drop_user');
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
        input:focus-visible, select:focus-visible, button:focus-visible {
          outline: 2px solid #60a5fa; outline-offset: 2px;
        }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
 
      <h1 style={s.h1}>Panel DCL</h1>
      <p style={s.sub}>Crea usuarios y controla sus permisos en PostgreSQL (Neon) con GRANT y REVOKE.</p>
 
      <section style={s.card}>
        <label style={s.label}>
          Usuario
          <input style={s.input} value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usr_ana" />
        </label>
        <label style={s.label}>
          Contraseña (solo para crear usuario)
          <input style={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </label>
        <label style={s.label}>
          Privilegio
          <select style={s.input} value={privilegio} onChange={(e) => setPrivilegio(e.target.value)}>
            {PRIVILEGIOS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label style={s.label}>
          Tabla
          <input style={s.input} value={tabla} onChange={(e) => setTabla(e.target.value)} placeholder="alumnos" disabled={todas} />
        </label>
        <label style={s.check}>
          <input type="checkbox" checked={todas} onChange={(e) => setTodas(e.target.checked)} />
          Aplicar a todas las tablas del esquema public
        </label>
      </section>
 
      <section style={s.grupo}>
        <h2 style={s.h2}>Usuarios</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.verde }} disabled={cargando} onClick={() => ejecutar('create_user')}>
            Crear usuario
          </button>
          <button style={{ ...s.btn, ...s.rojo }} disabled={cargando} onClick={confirmarEliminar}>
            Eliminar usuario
          </button>
        </div>
      </section>
 
      <section style={s.grupo}>
        <h2 style={s.h2}>GRANT</h2>
        <button style={{ ...s.btn, ...s.azul }} disabled={cargando} onClick={() => ejecutar('grant')}>
          Otorgar permiso
        </button>
      </section>
 
      <section style={s.grupo}>
        <h2 style={s.h2}>REVOKE</h2>
        <button style={{ ...s.btn, ...s.ambar }} disabled={cargando} onClick={() => ejecutar('revoke')}>
          Quitar permiso
        </button>
      </section>
 
      <section style={s.grupo}>
        <h2 style={s.h2}>Consultar</h2>
        <div style={s.fila}>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando} onClick={() => consultar(false)}>
            Ver usuarios
          </button>
          <button style={{ ...s.btn, ...s.gris }} disabled={cargando || !usuario} onClick={() => consultar(true)}>
            Ver permisos del usuario
          </button>
        </div>
        {consulta && (
          <div style={s.tablaWrap}>
            <p style={s.tituloTabla}>{consulta.titulo}</p>
            {consulta.filas.length === 0 ? (
              <p style={s.vacio}>Sin resultados.</p>
            ) : (
              <table style={s.tabla}>
                <thead>
                  <tr>
                    {Object.keys(consulta.filas[0]).map((c) => (
                      <th key={c} style={s.th}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consulta.filas.map((f, i) => (
                    <tr key={i}>
                      {Object.values(f).map((v, j) => (
                        <td key={j} style={s.td}>{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
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
  check: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
  input: { padding: 8, border: '1px solid var(--borde)', borderRadius: 6, fontSize: 15, background: 'var(--campo)', color: 'var(--texto)' },
  grupo: { marginBottom: 20 },
  fila: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  btn: { padding: '10px 16px', border: 'none', borderRadius: 6, color: '#fff', fontSize: 15, cursor: 'pointer' },
  verde: { background: '#15803d' },
  azul: { background: '#2563eb' },
  rojo: { background: '#dc2626' },
  ambar: { background: '#b45309' },
  gris: { background: '#4b5563' },
  vacio: { color: 'var(--suave)', fontSize: 14 },
  tablaWrap: { marginTop: 12, overflowX: 'auto' },
  tituloTabla: { fontSize: 14, margin: '0 0 6px' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--borde)', color: 'var(--suave)', fontWeight: 600 },
  td: { padding: '6px 8px', borderBottom: '1px solid var(--borde)' },
  log: { margin: '0 0 8px', padding: 10, background: 'var(--panel)', color: 'var(--texto)', borderLeft: '4px solid', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
};
