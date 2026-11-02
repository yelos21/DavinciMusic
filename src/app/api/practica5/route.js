import { ejecutar, consultar, motorValido } from '@/app/lib/db';
import {
  esBasePractica, DDL, LIMPIAR, DEMO, SECUENCIAS, CONSULTAS, JOINS, AGREGADAS,
  VISTAS, AUDITORIA, FUNCIONES, DISPARADORES,
} from '@/app/lib/practica5';

const LISTAS = { consultas: CONSULTAS, joins: JOINS, agregadas: AGREGADAS };

// PostgreSQL no permite varias sentencias en una sola llamada; los cuerpos
// PL/pgSQL ($$ ... $$) sí llevan punto y coma, así que esos van completos.
async function ejecutarVarias(motor, bd, texto) {
  const partes = String(texto).includes('$$') ? [texto] : String(texto).split(';');
  for (const p of partes.map((s) => s.trim()).filter(Boolean)) {
    await ejecutar(motor, bd, p);
  }
}

function seguroLista(lista) {
  if (!lista) throw new Error('Sección desconocida');
  return lista;
}

async function correrLista(motor, bd, lista) {
  const resultados = [];
  for (let i = 0; i < lista.length; i += 1) {
    const [titulo, sql] = lista[i];
    try {
      resultados.push({ n: i + 1, titulo, sql, filas: await consultar(motor, bd, sql) });
    } catch (e) {
      resultados.push({ n: i + 1, titulo, sql, error: e.message });
    }
  }
  return resultados;
}

function resumen(resultados) {
  const errores = resultados.filter((r) => r.error).map((r) => `${r.n}. ${r.titulo}: ${r.error}`);
  return { total: resultados.length, correctas: resultados.length - errores.length, errores };
}

async function baseExiste(motor, bd) {
  const filas = await consultar(motor, null, `SELECT 1 AS ok FROM pg_database WHERE datname = '${bd}'`);
  return filas.length > 0;
}

async function crearBase(motor, bd) {
  if (!(await baseExiste(motor, bd))) await ejecutar(motor, null, `CREATE DATABASE "${bd}"`);
}

async function sembrar(motor, bd) {
  for (const sql of LIMPIAR) await ejecutar(motor, bd, sql);
  for (const sql of DEMO) await ejecutar(motor, bd, sql);
  // setval devuelve una fila, por eso va con consultar y no con ejecutar
  for (const sql of SECUENCIAS) await consultar(motor, bd, sql);
}

async function preparar(motor, bd) {
  await crearBase(motor, bd);
  for (const sql of DDL) await ejecutar(motor, bd, sql);
  await sembrar(motor, bd);
  const [{ instrumentos, clases, ventas }] = await consultar(
    motor,
    bd,
    `SELECT (SELECT COUNT(*) FROM instrumento) AS instrumentos,
            (SELECT COUNT(*) FROM clase) AS clases,
            (SELECT COUNT(*) FROM venta) AS ventas`
  );
  return { instrumentos: Number(instrumentos), clases: Number(clases), ventas: Number(ventas) };
}

// ============ GET: consultas, joins, agregadas, vistas, funciones ============

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const motor = motorValido(url.searchParams.get('motor'));
    const bd = String(url.searchParams.get('bd') || '');
    const seccion = String(url.searchParams.get('seccion') || 'consultas');
    if (!esBasePractica(bd)) throw new Error('Solo se trabaja sobre bases que empiezan con practica_');

    if (LISTAS[seccion]) {
      const resultados = await correrLista(motor, bd, seguroLista(LISTAS[seccion]));
      return Response.json({ ok: true, seccion, bd, ...resumen(resultados), resultados });
    }

    if (seccion === 'vistas') {
      const nombres = await consultar(
        motor,
        bd,
        `SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'v\\_%' ORDER BY 1`
      );
      const vistas = [];
      for (const { viewname } of nombres) {
        const [{ filas }] = await consultar(motor, bd, `SELECT COUNT(*) AS filas FROM "${viewname}"`);
        vistas.push({ vista: viewname, filas: Number(filas) });
      }
      return Response.json({ ok: true, seccion, bd, total: vistas.length, vistas });
    }

    if (seccion === 'vista') {
      const vista = String(url.searchParams.get('vista') || '');
      if (!VISTAS[vista]) throw new Error(`La vista ${vista} no pertenece a la práctica`);
      const filas = await consultar(motor, bd, `SELECT * FROM "${vista}" LIMIT 10`);
      return Response.json({ ok: true, seccion, bd, vista, filas });
    }

    if (seccion === 'funciones') {
      const funciones = await consultar(
        motor,
        bd,
        `SELECT p.proname AS nombre FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname LIKE 'fn\\_%' ORDER BY 1`
      );
      const disparadores = await consultar(
        motor,
        bd,
        `SELECT event_object_table AS tabla, trigger_name AS nombre,
                action_timing AS momento, event_manipulation AS evento
         FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY 1, 2`
      );
      const existeAuditoria = await consultar(
        motor, bd, `SELECT to_regclass('public.auditoria_precio_instrumento')::text AS t`
      );
      const [{ total }] = existeAuditoria[0].t
        ? await consultar(motor, bd, `SELECT COUNT(*) AS total FROM auditoria_precio_instrumento`)
        : [{ total: 0 }];
      return Response.json({
        ok: true,
        seccion,
        bd,
        funciones: funciones.map((f) => f.nombre),
        disparadores: disparadores.map(
          (d) => `${d.tabla}: ${d.nombre} (${d.momento} ${d.evento})`
        ),
        registros_auditoria: Number(total),
      });
    }

    throw new Error(`Sección desconocida: ${seccion}`);
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}

// ============ POST: preparar, vistas, funciones, probar, avance3 ============

export async function POST(req) {
  try {
    const cuerpo = await req.json();
    const motor = motorValido(cuerpo.motor);
    const bd = String(cuerpo.bd || '');
    const accion = String(cuerpo.accion || '');
    if (!esBasePractica(bd)) throw new Error('Solo se trabaja sobre bases que empiezan con practica_');

    if (accion === 'preparar') {
      const conteos = await preparar(motor, bd);
      return Response.json({
        ok: true,
        mensaje: `Base ${bd} preparada con el esquema del proyecto y datos de ejemplo`,
        conteos,
      });
    }

    if (accion === 'vistas') {
      for (const sql of Object.values(VISTAS)) await ejecutarVarias(motor, bd, sql);
      return Response.json({
        ok: true,
        mensaje: `${Object.keys(VISTAS).length} vistas creadas en ${bd}`,
        vistas: Object.keys(VISTAS),
      });
    }

    if (accion === 'funciones') {
      await ejecutarVarias(motor, bd, AUDITORIA);
      for (const [titulo, sql] of FUNCIONES) {
        try {
          await ejecutarVarias(motor, bd, sql);
        } catch (e) {
          throw new Error(`${titulo}: ${e.message}`);
        }
      }
      for (const [titulo, sql] of DISPARADORES) {
        try {
          await ejecutarVarias(motor, bd, sql);
        } catch (e) {
          throw new Error(`${titulo}: ${e.message}`);
        }
      }
      return Response.json({
        ok: true,
        mensaje: `${FUNCIONES.length} funciones y ${DISPARADORES.length} disparadores creados en ${bd}`,
        funciones: FUNCIONES.map(([t]) => t.split(':')[0]),
        disparadores: DISPARADORES.map(([t]) => t.split(' (')[0]),
      });
    }

    if (accion === 'probar') {
      const pruebas = [];
      const [stockInicial] = await consultar(
        motor, bd, 'SELECT stock_actual FROM instrumento WHERE id_instrumento = 1'
      );
      const stockAntes = stockInicial?.stock_actual;
      if (stockAntes === undefined) throw new Error('La base no tiene datos: pulsa "5.0 Preparar base"');

      // 1) función de ingresos
      const [venta] = await consultar(motor, bd, 'SELECT MIN(id_venta) AS id FROM venta');
      if (venta?.id) {
        const [r] = await consultar(motor, bd, `SELECT fn_ingresos_venta(${Number(venta.id)}) AS total`);
        pruebas.push(`FUNCIÓN fn_ingresos_venta(${venta.id}) = ${r.total}`);
      }

      // 2) función de alumnos por clase
      const alumnos = await consultar(motor, bd, 'SELECT * FROM fn_alumnos_por_clase(1)');
      pruebas.push(
        'FUNCIÓN fn_alumnos_por_clase(1) -> ' +
          (alumnos.length
            ? alumnos.map((a) => `${a.alumno} (${a.estado}, ${a.costo})`).join(', ')
            : 'sin alumnos inscritos')
      );

      // 3) disparador que descuenta stock al vender
      const [{ id }] = await consultar(
        motor, bd,
        `INSERT INTO venta (id_cliente, id_administrador, metodo_pago)
         VALUES (1, 1, 'efectivo') RETURNING id_venta AS id`
      );
      await ejecutar(
        motor, bd,
        `INSERT INTO detalle_venta (id_venta, id_instrumento, cantidad, precio_unitario)
         VALUES (${Number(id)}, 1, 3, 3500.00)`
      );
      const [stockDespues] = await consultar(
        motor, bd, 'SELECT stock_actual FROM instrumento WHERE id_instrumento = 1'
      );
      pruebas.push(
        `DISPARADOR trg_descontar_stock: stock del instrumento 1 pasó de ${stockAntes} a ${stockDespues.stock_actual} (se vendieron 3)`
      );

      // 4) disparador que rechaza ventas sin existencias
      try {
        await ejecutar(
          motor, bd,
          `INSERT INTO detalle_venta (id_venta, id_instrumento, cantidad, precio_unitario)
           VALUES (${Number(id)}, 2, 999999, 12500.00)`
        );
        pruebas.push('ADVERTENCIA  trg_validar_stock no rechazó la venta de 999999 piezas');
      } catch (e) {
        const detalle = e.message.match(/Message: `([^`]*)`/)?.[1] || e.message.replace(/\s+/g, ' ').trim();
        pruebas.push(`RECHAZADO  venta de 999999 piezas -> ${detalle}`);
      }

      // 5) disparador de auditoría de precios
      await ejecutar(
        motor, bd,
        'UPDATE instrumento SET precio_venta = precio_venta + 1 WHERE id_instrumento = 1'
      );
      const [auditoria] = await consultar(
        motor, bd,
        'SELECT id_instrumento, precio_anterior, precio_nuevo FROM auditoria_precio_instrumento ORDER BY id_auditoria DESC LIMIT 1'
      );
      pruebas.push(
        auditoria
          ? `DISPARADOR trg_auditar_precio: instrumento ${auditoria.id_instrumento} pasó de ${auditoria.precio_anterior} a ${auditoria.precio_nuevo}`
          : 'ADVERTENCIA  trg_auditar_precio no registró el cambio'
      );

      // Limpieza: quitar la venta de prueba y devolver stock y precio
      await ejecutar(
        motor, bd,
        `DELETE FROM detalle_venta WHERE id_venta = ${Number(id)}`
      );
      await ejecutar(motor, bd, `DELETE FROM venta WHERE id_venta = ${Number(id)}`);
      await ejecutar(
        motor, bd,
        `UPDATE instrumento SET stock_actual = ${Number(stockAntes)},
         precio_venta = precio_venta - 1 WHERE id_instrumento = 1`
      );

      return Response.json({ ok: true, mensaje: 'Pruebas de funciones y disparadores', pruebas });
    }

    if (accion === 'avance3') {
      await crearBase(motor, bd);
      for (const sql of DDL) await ejecutar(motor, bd, sql);
      const [{ hay }] = await consultar(motor, bd, 'SELECT COUNT(*) AS hay FROM usuario');
      const sembrado = Number(hay) === 0;
      if (sembrado) await sembrar(motor, bd);

      for (const sql of Object.values(VISTAS)) await ejecutarVarias(motor, bd, sql);
      await ejecutarVarias(motor, bd, AUDITORIA);
      for (const [, sql] of FUNCIONES) await ejecutarVarias(motor, bd, sql);
      for (const [, sql] of DISPARADORES) await ejecutarVarias(motor, bd, sql);

      const r51 = await correrLista(motor, bd, CONSULTAS);
      const r52 = await correrLista(motor, bd, JOINS);
      const r53 = await correrLista(motor, bd, AGREGADAS);

      const conteos = {};
      for (const t of ['usuario', 'instrumento', 'clase', 'inscripcion_clase', 'venta', 'detalle_venta']) {
        const [{ n }] = await consultar(motor, bd, `SELECT COUNT(*) AS n FROM ${t}`);
        conteos[t] = Number(n);
      }

      return Response.json({
        ok: true,
        mensaje: `Tercer avance presentado sobre ${bd}`,
        bd,
        datos_de_ejemplo: sembrado ? 'insertados' : 'ya existían',
        registros: conteos,
        vistas: { creadas: Object.keys(VISTAS).length, nombres: Object.keys(VISTAS) },
        funciones: { creadas: FUNCIONES.length, disparadores: DISPARADORES.length },
        secciones: [
          { seccion: '5.1 Consultas simples', ...resumen(r51) },
          { seccion: '5.2 Operaciones JOIN', ...resumen(r52) },
          { seccion: '5.3 Funciones agregadas', ...resumen(r53) },
        ],
        ejemplos: { 5.1: r51[0] || null, 5.2: r52[r52.length - 1] || null, 5.3: r53[9] || r53[r53.length - 1] || null },
      });
    }

    throw new Error(`Acción desconocida: ${accion}`);
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}
