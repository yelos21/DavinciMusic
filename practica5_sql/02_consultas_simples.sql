-- ============================================================
--  Práctica 5 · 5.1  25 consultas simples
--  Requiere haber ejecutado 01_datos.sql
--
--    psql "postgresql://.../practica_davinci" -f 02_consultas_simples.sql
-- ============================================================

\echo ''
\echo '=================================================='
\echo ' 5.1  25 CONSULTAS SIMPLES'
\echo '=================================================='

\echo ''
\echo '1) Todas las categorías de instrumento'
SELECT id_categoria, nombre_categoria, descripcion
FROM categoria_instrumento
ORDER BY nombre_categoria;

\echo ''
\echo '2) Instrumentos activos con su precio'
SELECT nombre_instrumento, marca, precio_venta, stock_actual
FROM instrumento
WHERE activo = TRUE
ORDER BY precio_venta DESC;

\echo ''
\echo '3) Instrumentos con precio mayor a 10000'
SELECT nombre_instrumento, precio_venta
FROM instrumento
WHERE precio_venta > 10000
ORDER BY precio_venta DESC;

\echo ''
\echo '4) Instrumentos agotados o con stock bajo (<= 3)'
SELECT nombre_instrumento, stock_actual
FROM instrumento
WHERE stock_actual <= 3
ORDER BY stock_actual;

\echo ''
\echo '5) Los 5 instrumentos más caros'
SELECT nombre_instrumento, precio_venta
FROM instrumento
ORDER BY precio_venta DESC
LIMIT 5;

\echo ''
\echo '6) Marcas distintas que se manejan'
SELECT DISTINCT marca
FROM instrumento
WHERE marca IS NOT NULL
ORDER BY marca;

\echo ''
\echo '7) Usuarios cuyo nombre empieza con A'
SELECT nombre, apellido_paterno
FROM usuario
WHERE nombre LIKE 'A%'
ORDER BY nombre;

\echo ''
\echo '8) Correos del dominio davinci.mx'
SELECT nombre, correo
FROM usuario
WHERE correo LIKE '%@davinci.mx'
ORDER BY correo;

\echo ''
\echo '9) Clientes dados de alta en los últimos 120 días'
SELECT id_cliente, id_usuario, fecha_alta
FROM cliente
WHERE fecha_alta >= CURRENT_DATE - 120
ORDER BY fecha_alta;

\echo ''
\echo '10) Maestros activos'
SELECT id_maestro, especialidad, activo
FROM maestro
WHERE activo = TRUE;

\echo ''
\echo '11) Instrumentos de las categorías 1 y 2'
SELECT nombre_instrumento, id_categoria
FROM instrumento
WHERE id_categoria IN (1, 2)
ORDER BY id_categoria, nombre_instrumento;

\echo ''
\echo '12) Instrumentos con precio entre 3000 y 12000'
SELECT nombre_instrumento, precio_venta
FROM instrumento
WHERE precio_venta BETWEEN 3000 AND 12000
ORDER BY precio_venta;

\echo ''
\echo '13) Usuarios sin teléfono registrado'
SELECT nombre, apellido_paterno, telefono
FROM usuario
WHERE telefono IS NULL;

\echo ''
\echo '14) Nombre completo concatenado de cada usuario'
SELECT nombre || ' ' || COALESCE(apellido_paterno, '') || ' ' || COALESCE(apellido_materno, '') AS nombre_completo
FROM usuario
ORDER BY 1;

\echo ''
\echo '15) IVA (16%) estimado por instrumento'
SELECT nombre_instrumento, precio_venta, ROUND(precio_venta * 0.16, 2) AS iva
FROM instrumento
ORDER BY precio_venta DESC;

\echo ''
\echo '16) Precio con 10% de descuento'
SELECT nombre_instrumento, precio_venta, ROUND(precio_venta * 0.90, 2) AS precio_oferta
FROM instrumento
WHERE activo = TRUE
ORDER BY precio_venta DESC;

\echo ''
\echo '17) Categorías en mayúsculas'
SELECT UPPER(nombre_categoria) AS categoria
FROM categoria_instrumento
ORDER BY 1;

\echo ''
\echo '18) Longitud del nombre de cada clase'
SELECT nombre_clase, LENGTH(nombre_clase) AS caracteres
FROM clase
ORDER BY 2 DESC, 1;

\echo ''
\echo '19) Clases con costo mensual mayor a 1000'
SELECT nombre_clase, nivel, costo_mensual
FROM clase
WHERE costo_mensual > 1000
ORDER BY costo_mensual DESC;

\echo ''
\echo '20) Niveles distintos que se imparten'
SELECT DISTINCT nivel
FROM clase
ORDER BY nivel;

\echo ''
\echo '21) Inscripciones activas'
SELECT id_inscripcion, id_cliente, id_clase, costo_mensual_acordado
FROM inscripcion_clase
WHERE estado_inscripcion = 'Activa'
ORDER BY id_inscripcion;

\echo ''
\echo '22) Pagos pendientes o vencidos'
SELECT id_pago_clase, importe, estado_pago
FROM pago_clase
WHERE estado_pago IN ('Pendiente', 'Vencido')
ORDER BY fecha_vencimiento;

\echo ''
\echo '23) Pagos que aún no tienen fecha de pago'
SELECT id_pago_clase, importe, fecha_vencimiento
FROM pago_clase
WHERE fecha_pago IS NULL
ORDER BY fecha_vencimiento;

\echo ''
\echo '24) Horarios del turno matutino'
SELECT id_horario, dia_semana, hora_inicio, hora_fin
FROM horario_clase
WHERE hora_inicio < TIME '12:00'
ORDER BY hora_inicio;

\echo ''
\echo '25) Ventas de los últimos 30 días'
SELECT id_venta, fecha_venta, metodo_pago, estado_venta
FROM venta
WHERE fecha_venta >= CURRENT_DATE - 30
ORDER BY fecha_venta DESC;
