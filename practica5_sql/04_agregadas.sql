-- ============================================================
--  Práctica 5 · 5.3  15 funciones agregadas
--  Requiere haber ejecutado 01_datos.sql
--
--    psql "postgresql://.../practica_davinci" -f 04_agregadas.sql
-- ============================================================

\echo ''
\echo '=================================================='
\echo ' 5.3  15 FUNCIONES AGREGADAS'
\echo '=================================================='

\echo ''
\echo '1) COUNT: total de instrumentos'
SELECT COUNT(*) AS total_instrumentos FROM instrumento;

\echo ''
\echo '2) SUM: piezas en inventario'
SELECT SUM(stock_actual) AS piezas_en_stock FROM instrumento;

\echo ''
\echo '3) AVG: precio de venta promedio'
SELECT ROUND(AVG(precio_venta), 2) AS precio_promedio FROM instrumento;

\echo ''
\echo '4) MIN y MAX: instrumento más barato y más caro'
SELECT MIN(precio_venta) AS mas_barato, MAX(precio_venta) AS mas_caro FROM instrumento;

\echo ''
\echo '5) GROUP BY: instrumentos por categoría'
SELECT c.nombre_categoria, COUNT(i.id_instrumento) AS instrumentos
FROM categoria_instrumento c
LEFT JOIN instrumento i ON i.id_categoria = c.id_categoria
GROUP BY c.nombre_categoria
ORDER BY instrumentos DESC, c.nombre_categoria;

\echo ''
\echo '6) GROUP BY: existencias por categoría'
SELECT c.nombre_categoria, COALESCE(SUM(i.stock_actual), 0) AS piezas
FROM categoria_instrumento c
LEFT JOIN instrumento i ON i.id_categoria = c.id_categoria
GROUP BY c.nombre_categoria
ORDER BY piezas DESC;

\echo ''
\echo '7) HAVING: categorías con más de dos instrumentos'
SELECT c.nombre_categoria, COUNT(i.id_instrumento) AS instrumentos
FROM categoria_instrumento c
INNER JOIN instrumento i ON i.id_categoria = c.id_categoria
GROUP BY c.nombre_categoria
HAVING COUNT(i.id_instrumento) > 2
ORDER BY instrumentos DESC;

\echo ''
\echo '8) SUM: valor total del inventario'
SELECT ROUND(SUM(stock_actual * precio_venta), 2) AS valor_inventario FROM instrumento;

\echo ''
\echo '9) GROUP BY: ventas y monto por método de pago'
SELECT v.metodo_pago,
       COUNT(DISTINCT v.id_venta) AS ventas,
       ROUND(SUM(dv.cantidad * dv.precio_unitario), 2) AS monto
FROM venta v
LEFT JOIN detalle_venta dv ON dv.id_venta = v.id_venta
GROUP BY v.metodo_pago
ORDER BY monto DESC NULLS LAST;

\echo ''
\echo '10) SUM: dinero total vendido'
SELECT ROUND(SUM(cantidad * precio_unitario), 2) AS total_vendido FROM detalle_venta;

\echo ''
\echo '11) AVG: ticket promedio por venta'
SELECT ROUND(AVG(total), 2) AS ticket_promedio
FROM (
  SELECT id_venta, SUM(cantidad * precio_unitario) AS total
  FROM detalle_venta
  GROUP BY id_venta
) t;

\echo ''
\echo '12) COUNT DISTINCT: ventas y clientes distintos'
SELECT COUNT(*) AS ventas, COUNT(DISTINCT id_cliente) AS clientes FROM venta;

\echo ''
\echo '13) AVG y MAX: piezas promedio y máxima por línea'
SELECT ROUND(AVG(cantidad), 2) AS promedio, MAX(cantidad) AS maximo FROM detalle_venta;

\echo ''
\echo '14) MAX: venta más reciente'
SELECT MAX(fecha_venta) AS ultima_venta FROM venta;

\echo ''
\echo '15) SUM con CASE: cobrado vs por cobrar en clases'
SELECT ROUND(SUM(CASE WHEN estado_pago = 'Pagado' THEN importe ELSE 0 END), 2) AS cobrado,
       ROUND(SUM(CASE WHEN estado_pago <> 'Pagado' THEN importe ELSE 0 END), 2) AS por_cobrar,
       COUNT(*) AS pagos
FROM pago_clase;
