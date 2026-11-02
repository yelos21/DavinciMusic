-- ============================================================
--  Práctica 5 · 5.2  15 operaciones JOIN
--  Requiere haber ejecutado 01_datos.sql
--
--    psql "postgresql://.../practica_davinci" -f 03_joins.sql
-- ============================================================

\echo ''
\echo '=================================================='
\echo ' 5.2  15 OPERACIONES JOIN'
\echo '=================================================='

\echo ''
\echo '1) INNER JOIN: instrumento con su categoría'
SELECT i.nombre_instrumento, c.nombre_categoria, i.precio_venta
FROM instrumento i
INNER JOIN categoria_instrumento c ON c.id_categoria = i.id_categoria
ORDER BY c.nombre_categoria, i.nombre_instrumento;

\echo ''
\echo '2) INNER JOIN: cliente con los datos de su usuario'
SELECT c.id_cliente, u.nombre, u.apellido_paterno, u.correo
FROM cliente c
INNER JOIN usuario u ON u.id_usuario = c.id_usuario
ORDER BY c.id_cliente;

\echo ''
\echo '3) INNER JOIN: maestro con su usuario'
SELECT m.especialidad, u.nombre, u.apellido_paterno
FROM maestro m
INNER JOIN usuario u ON u.id_usuario = m.id_usuario
ORDER BY m.id_maestro;

\echo ''
\echo '4) INNER JOIN: clase con su maestro'
SELECT cl.nombre_clase,
       u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS maestro,
       cl.nivel
FROM clase cl
INNER JOIN maestro m ON m.id_maestro = cl.id_maestro
INNER JOIN usuario u ON u.id_usuario = m.id_usuario
ORDER BY cl.id_clase;

\echo ''
\echo '5) INNER JOIN: clase con el instrumento que se imparte'
SELECT cl.nombre_clase, i.nombre_instrumento, i.marca
FROM clase cl
INNER JOIN instrumento i ON i.id_instrumento = cl.id_instrumento
ORDER BY cl.id_clase;

\echo ''
\echo '6) INNER JOIN: clase con su periodo académico'
SELECT cl.nombre_clase, p.nombre_periodo, p.estado
FROM clase cl
INNER JOIN periodo_academico p ON p.id_periodo = cl.id_periodo
ORDER BY p.nombre_periodo, cl.nombre_clase;

\echo ''
\echo '7) INNER JOIN: horario con la clase'
SELECT h.dia_semana, h.hora_inicio, h.hora_fin, cl.nombre_clase
FROM horario_clase h
INNER JOIN clase cl ON cl.id_clase = h.id_clase
ORDER BY h.dia_semana, h.hora_inicio;

\echo ''
\echo '8) INNER JOIN: inscripción con alumno y clase'
SELECT ic.id_inscripcion, u.nombre AS alumno, cl.nombre_clase, ic.estado_inscripcion
FROM inscripcion_clase ic
INNER JOIN cliente c ON c.id_cliente = ic.id_cliente
INNER JOIN usuario u ON u.id_usuario = c.id_usuario
INNER JOIN clase cl ON cl.id_clase = ic.id_clase
ORDER BY ic.id_inscripcion;

\echo ''
\echo '9) INNER JOIN: pagos con la inscripción y el alumno'
SELECT pc.id_pago_clase, u.nombre AS alumno, pc.importe, pc.estado_pago
FROM pago_clase pc
INNER JOIN inscripcion_clase ic ON ic.id_inscripcion = pc.id_inscripcion
INNER JOIN cliente c ON c.id_cliente = ic.id_cliente
INNER JOIN usuario u ON u.id_usuario = c.id_usuario
ORDER BY pc.id_pago_clase;

\echo ''
\echo '10) INNER JOIN: venta con cliente y administrador'
SELECT v.id_venta, uc.nombre AS cliente, ua.nombre AS administrador, v.fecha_venta
FROM venta v
INNER JOIN cliente c ON c.id_cliente = v.id_cliente
INNER JOIN usuario uc ON uc.id_usuario = c.id_usuario
INNER JOIN administrador a ON a.id_administrador = v.id_administrador
INNER JOIN usuario ua ON ua.id_usuario = a.id_usuario
ORDER BY v.id_venta;

\echo ''
\echo '11) INNER JOIN: detalle de venta con el instrumento'
SELECT dv.id_venta, i.nombre_instrumento, dv.cantidad, dv.precio_unitario
FROM detalle_venta dv
INNER JOIN instrumento i ON i.id_instrumento = dv.id_instrumento
ORDER BY dv.id_venta, i.nombre_instrumento;

\echo ''
\echo '12) INNER JOIN: orden de abastecimiento con proveedor'
SELECT o.id_orden, pr.nombre_proveedor, o.fecha_orden, o.estado_orden
FROM orden_abastecimiento o
INNER JOIN proveedor pr ON pr.id_proovedor = o.id_proovedor
ORDER BY o.id_orden;

\echo ''
\echo '13) LEFT JOIN: clases que no tienen ninguna inscripción'
SELECT cl.id_clase, cl.nombre_clase
FROM clase cl
LEFT JOIN inscripcion_clase ic ON ic.id_clase = cl.id_clase
WHERE ic.id_inscripcion IS NULL
ORDER BY cl.id_clase;

\echo ''
\echo '14) LEFT JOIN: instrumentos que nunca se han vendido'
SELECT i.id_instrumento, i.nombre_instrumento
FROM instrumento i
LEFT JOIN detalle_venta dv ON dv.id_instrumento = i.id_instrumento
WHERE dv.id_instrumento IS NULL
ORDER BY i.id_instrumento;

\echo ''
\echo '15) SELF JOIN: usuarios que comparten apellido paterno'
SELECT a.nombre AS usuario_1, b.nombre AS usuario_2, a.apellido_paterno
FROM usuario a
INNER JOIN usuario b ON a.apellido_paterno = b.apellido_paterno
                    AND a.id_usuario < b.id_usuario
ORDER BY a.apellido_paterno;
