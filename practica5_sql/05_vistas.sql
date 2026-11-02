-- ============================================================
--  Práctica 5 · 5.4  5 vistas
--  Requiere haber ejecutado 01_datos.sql
--
--    psql "postgresql://.../practica_davinci" -f 05_vistas.sql
-- ============================================================

DO $$
BEGIN
  IF current_database() NOT LIKE 'practica\_%' THEN
    RAISE EXCEPTION 'Este script solo se puede ejecutar en una base practica_*  (base actual: %)', current_database();
  END IF;
END $$;

\echo ''
\echo '=================================================='
\echo ' 5.4  5 VISTAS'
\echo '=================================================='

-- 1) Instrumentos con el nombre de su categoría
CREATE OR REPLACE VIEW v_instrumentos_categoria AS
SELECT i.id_instrumento,
       i.nombre_instrumento,
       c.nombre_categoria,
       i.marca,
       i.precio_venta,
       i.stock_actual,
       i.activo
FROM instrumento i
INNER JOIN categoria_instrumento c ON c.id_categoria = i.id_categoria;

-- 2) Clases con maestro, instrumento y periodo
CREATE OR REPLACE VIEW v_clases_detalle AS
SELECT cl.id_clase,
       cl.nombre_clase,
       cl.nivel,
       cl.costo_mensual,
       cl.cupo_maximo,
       cl.activa,
       u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS maestro,
       i.nombre_instrumento,
       p.nombre_periodo
FROM clase cl
INNER JOIN maestro m ON m.id_maestro = cl.id_maestro
INNER JOIN usuario u ON u.id_usuario = m.id_usuario
INNER JOIN instrumento i ON i.id_instrumento = cl.id_instrumento
INNER JOIN periodo_academico p ON p.id_periodo = cl.id_periodo;

-- 3) Inscripciones con el total pagado por alumno
CREATE OR REPLACE VIEW v_inscripciones_resumen AS
SELECT ic.id_inscripcion,
       u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS alumno,
       cl.nombre_clase,
       ic.costo_mensual_acordado,
       ic.estado_inscripcion,
       (SELECT COUNT(*) FROM pago_clase pc
         WHERE pc.id_inscripcion = ic.id_inscripcion) AS pagos,
       COALESCE((SELECT SUM(pc.importe) FROM pago_clase pc
                  WHERE pc.id_inscripcion = ic.id_inscripcion
                    AND pc.estado_pago = 'Pagado'), 0) AS pagado
FROM inscripcion_clase ic
INNER JOIN cliente c ON c.id_cliente = ic.id_cliente
INNER JOIN usuario u ON u.id_usuario = c.id_usuario
INNER JOIN clase cl ON cl.id_clase = ic.id_clase;

-- 4) Ventas con cliente, artículos y total
CREATE OR REPLACE VIEW v_ventas_resumen AS
SELECT v.id_venta,
       v.fecha_venta,
       v.metodo_pago,
       v.estado_venta,
       u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS cliente,
       COALESCE(SUM(dv.cantidad), 0) AS articulos,
       COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) AS total
FROM venta v
INNER JOIN cliente c ON c.id_cliente = v.id_cliente
INNER JOIN usuario u ON u.id_usuario = c.id_usuario
LEFT JOIN detalle_venta dv ON dv.id_venta = v.id_venta
GROUP BY v.id_venta, v.fecha_venta, v.metodo_pago, v.estado_venta,
         u.nombre, u.apellido_paterno;

-- 5) Instrumentos con stock bajo o agotado
CREATE OR REPLACE VIEW v_stock_bajo AS
SELECT i.id_instrumento,
       i.nombre_instrumento,
       c.nombre_categoria,
       i.stock_actual,
       CASE WHEN i.stock_actual = 0 THEN 'Agotado' ELSE 'Bajo' END AS situacion,
       (3 - i.stock_actual) AS faltante
FROM instrumento i
INNER JOIN categoria_instrumento c ON c.id_categoria = i.id_categoria
WHERE i.stock_actual <= 3;

\echo ''
\echo '--- Vistas creadas ---'
SELECT viewname AS vista
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE 'v\_%'
ORDER BY 1;

\echo ''
\echo '--- 1) v_instrumentos_categoria ---'
SELECT * FROM v_instrumentos_categoria ORDER BY nombre_instrumento;

\echo ''
\echo '--- 2) v_clases_detalle ---'
SELECT * FROM v_clases_detalle ORDER BY id_clase;

\echo ''
\echo '--- 3) v_inscripciones_resumen ---'
SELECT * FROM v_inscripciones_resumen ORDER BY id_inscripcion;

\echo ''
\echo '--- 4) v_ventas_resumen ---'
SELECT * FROM v_ventas_resumen ORDER BY id_venta;

\echo ''
\echo '--- 5) v_stock_bajo ---'
SELECT * FROM v_stock_bajo ORDER BY id_instrumento;
