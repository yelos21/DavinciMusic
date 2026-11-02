-- ============================================================
--  Práctica 5 · 5.0  Esquema y datos de ejemplo
--  Proyecto: DavinciMusic (escuela de música)
--
--  Uso:
--    psql "postgresql://usuario:pass@host/practica_davinci" -f 01_datos.sql
--
--  OJO: borra y vuelve a crear las tablas de la base donde lo ejecutes.
--       El bloque de control de abajo impide correrlo fuera de practica_*.
-- ============================================================

DO $$
BEGIN
  IF current_database() NOT LIKE 'practica\_%' THEN
    RAISE EXCEPTION 'Este script solo se puede ejecutar en una base practica_*  (base actual: %)', current_database();
  END IF;
END $$;

-- Silencia los avisos "does not exist, skipping" de los DROP
SET client_min_messages = warning;

\echo ''
\echo '=================================================='
\echo ' 5.0  Creando esquema del proyecto'
\echo '=================================================='

DROP TABLE IF EXISTS auditoria_precio_instrumento CASCADE;
DROP TABLE IF EXISTS detalles_orden                CASCADE;
DROP TABLE IF EXISTS detalle_venta                 CASCADE;
DROP TABLE IF EXISTS orden_abastecimiento          CASCADE;
DROP TABLE IF EXISTS proveedor                     CASCADE;
DROP TABLE IF EXISTS venta                         CASCADE;
DROP TABLE IF EXISTS pago_clase                    CASCADE;
DROP TABLE IF EXISTS inscripcion_clase             CASCADE;
DROP TABLE IF EXISTS horario_clase                 CASCADE;
DROP TABLE IF EXISTS clase                         CASCADE;
DROP TABLE IF EXISTS instrumento                   CASCADE;
DROP TABLE IF EXISTS categoria_instrumento         CASCADE;
DROP TABLE IF EXISTS periodo_academico             CASCADE;
DROP TABLE IF EXISTS administrador                 CASCADE;
DROP TABLE IF EXISTS maestro                       CASCADE;
DROP TABLE IF EXISTS cliente                       CASCADE;
DROP TABLE IF EXISTS usuario                       CASCADE;

CREATE TABLE usuario (
    id_usuario       SERIAL PRIMARY KEY,
    nombre_usuario   TEXT,
    nombre           TEXT NOT NULL,
    apellido_paterno TEXT,
    apellido_materno TEXT,
    fecha_nacimiento TIMESTAMP(3),
    curp             TEXT,
    ine              TEXT,
    correo           TEXT NOT NULL,
    telefono         TEXT,
    direccion        TEXT,
    contrasena_hash  TEXT,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categoria_instrumento (
    id_categoria     SERIAL PRIMARY KEY,
    nombre_categoria TEXT NOT NULL,
    descripcion      TEXT
);

CREATE TABLE instrumento (
    id_instrumento     SERIAL PRIMARY KEY,
    id_categoria       INTEGER NOT NULL REFERENCES categoria_instrumento(id_categoria),
    nombre_instrumento TEXT NOT NULL,
    marca              TEXT,
    modelo             TEXT,
    tamano             TEXT,
    color              TEXT,
    precio_venta       NUMERIC(10,2) NOT NULL,
    stock_actual       INTEGER NOT NULL DEFAULT 0,
    activo             BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    fecha_alta TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maestro (
    id_maestro         SERIAL PRIMARY KEY,
    id_usuario         INTEGER NOT NULL REFERENCES usuario(id_usuario),
    especialidad       TEXT NOT NULL,
    fecha_contratacion TIMESTAMP(3) NOT NULL,
    activo             BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE administrador (
    id_administrador   SERIAL PRIMARY KEY,
    id_usuario         INTEGER NOT NULL REFERENCES usuario(id_usuario),
    fecha_contratacion TIMESTAMP(3) NOT NULL
);

CREATE TABLE periodo_academico (
    id_periodo     SERIAL PRIMARY KEY,
    nombre_periodo TEXT NOT NULL,
    fecha_inicio   TIMESTAMP(3) NOT NULL,
    fecha_fin      TIMESTAMP(3) NOT NULL,
    estado         TEXT NOT NULL
);

CREATE TABLE clase (
    id_clase      SERIAL PRIMARY KEY,
    id_maestro    INTEGER NOT NULL REFERENCES maestro(id_maestro),
    id_instrumento INTEGER NOT NULL REFERENCES instrumento(id_instrumento),
    id_periodo    INTEGER NOT NULL REFERENCES periodo_academico(id_periodo),
    nombre_clase  TEXT NOT NULL,
    nivel         TEXT NOT NULL,
    costo_mensual NUMERIC(10,2) NOT NULL,
    cupo_maximo   INTEGER NOT NULL,
    activa        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE horario_clase (
    id_horario  SERIAL PRIMARY KEY,
    id_clase    INTEGER NOT NULL REFERENCES clase(id_clase),
    dia_semana  TEXT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL,
    salon       TEXT
);

CREATE TABLE inscripcion_clase (
    id_inscripcion        SERIAL PRIMARY KEY,
    id_cliente            INTEGER NOT NULL REFERENCES cliente(id_cliente),
    id_clase              INTEGER NOT NULL REFERENCES clase(id_clase),
    costo_mensual_acordado NUMERIC(10,2) NOT NULL,
    estado_inscripcion    TEXT NOT NULL DEFAULT 'Activa',
    fecha_inscripcion     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pago_clase (
    id_pago_clase     SERIAL PRIMARY KEY,
    id_inscripcion    INTEGER NOT NULL REFERENCES inscripcion_clase(id_inscripcion),
    importe           NUMERIC(10,2) NOT NULL,
    fecha_vencimiento TIMESTAMP(3) NOT NULL,
    fecha_pago        TIMESTAMP(3),
    metodo_pago       TEXT,
    estado_pago       TEXT NOT NULL DEFAULT 'Pendiente',
    periodo_pagado    DATE NOT NULL
);

CREATE TABLE venta (
    id_venta         SERIAL PRIMARY KEY,
    id_cliente       INTEGER NOT NULL REFERENCES cliente(id_cliente),
    id_administrador INTEGER NOT NULL REFERENCES administrador(id_administrador),
    fecha_venta      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo_pago      TEXT NOT NULL,
    estado_venta     TEXT NOT NULL DEFAULT 'Completada'
);

CREATE TABLE detalle_venta (
    id_venta        INTEGER NOT NULL REFERENCES venta(id_venta),
    id_instrumento  INTEGER NOT NULL REFERENCES instrumento(id_instrumento),
    cantidad        INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (id_venta, id_instrumento)
);

CREATE TABLE proveedor (
    id_proovedor     SERIAL PRIMARY KEY,
    nombre_proveedor TEXT NOT NULL,
    rfc              TEXT NOT NULL UNIQUE,
    correo           TEXT NOT NULL,
    direccion        TEXT,
    telefono         TEXT NOT NULL,
    activo           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orden_abastecimiento (
    id_orden         SERIAL PRIMARY KEY,
    id_proovedor     INTEGER NOT NULL REFERENCES proveedor(id_proovedor),
    id_administrador INTEGER NOT NULL REFERENCES administrador(id_administrador),
    fecha_orden      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_orden     TEXT NOT NULL DEFAULT 'Pendiente'
);

CREATE TABLE detalles_orden (
    id_orden             INTEGER NOT NULL REFERENCES orden_abastecimiento(id_orden),
    id_instrumento       INTEGER NOT NULL REFERENCES instrumento(id_instrumento),
    cantidad_solicitada  INTEGER NOT NULL,
    cantidad_recibida    INTEGER NOT NULL DEFAULT 0,
    costo_unitario       NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (id_orden, id_instrumento)
);

\echo '   Tablas creadas. Insertando datos de ejemplo...'

-- ---------------- Usuarios ----------------
INSERT INTO usuario (id_usuario, nombre_usuario, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, curp, correo, telefono, direccion, activo, fecha_registro) VALUES
  (1,  'ana',    'Ana',    'López',     'Hernández', '1990-05-12', 'LOHA900512MDFRRN01', 'ana@correo.com',    '5512345678', 'Av. Reforma 100', TRUE, CURRENT_DATE - 200),
  (2,  'luis',   'Luis',   'Martínez',  NULL,        '1985-11-03', 'MALO851103HDFRRS02', 'luis@correo.com',   NULL,         NULL,              TRUE, CURRENT_DATE - 180),
  (3,  'maria',  'María',  'García',    'Ruiz',      '1998-02-20', 'GARM980220MDFRCR03', 'maria@correo.com',  '5598765432', 'Calle Juárez 45', TRUE, CURRENT_DATE - 150),
  (4,  'pedro',  'Pedro',  'Ramírez',   'Soto',      '2001-07-08', 'RASP010708HDFRST04', 'pedro@correo.com',  NULL,         'Av. Hidalgo 7',   TRUE, CURRENT_DATE - 120),
  (5,  'elena',  'Elena',  'Vargas',    'Luna',      '1995-03-30', 'VALA950330MDFRNL05', 'elena@correo.com',  '5544332211', NULL,              TRUE, CURRENT_DATE - 90),
  (6,  'carlos', 'Carlos', 'Hernández', 'Paz',       '1980-01-15', 'HEPC800115HDFRPZ06', 'carlos@davinci.mx', '5551112233', 'Conservatorio 1', TRUE, CURRENT_DATE - 400),
  (7,  'sofia',  'Sofía',  'Torres',    'Mena',      '1987-09-21', 'TOME870921MDFRMN07', 'sofia@davinci.mx',  '5554445566', NULL,              TRUE, CURRENT_DATE - 380),
  (8,  'diego',  'Diego',  'Flores',    'Canales',   '1983-06-04', 'FOCD830604HDFRNC08', 'diego@davinci.mx',  '5557778899', 'Av. Sur 900',     TRUE, CURRENT_DATE - 350),
  (9,  'laura',  'Laura',  'Méndez',    'Ibarra',    '1992-12-11', 'MEIL921211MDFRBR09', 'laura@davinci.mx',  '5559990011', NULL,              TRUE, CURRENT_DATE - 300),
  (10, 'jorge',  'Jorge',  'Ruiz',      'Nava',      '1988-04-25', 'RUNJ880425HDFRVC10', 'jorge@davinci.mx',  '5552223344', 'Av. Norte 22',    TRUE, CURRENT_DATE - 280);

INSERT INTO cliente (id_cliente, id_usuario, fecha_alta) VALUES
  (1, 1, CURRENT_DATE - 190),
  (2, 2, CURRENT_DATE - 170),
  (3, 3, CURRENT_DATE - 140),
  (4, 4, CURRENT_DATE - 110),
  (5, 5, CURRENT_DATE - 80);

INSERT INTO maestro (id_maestro, id_usuario, especialidad, fecha_contratacion, activo) VALUES
  (1, 6, 'Guitarra',  CURRENT_DATE - 400, TRUE),
  (2, 7, 'Piano',     CURRENT_DATE - 380, TRUE),
  (3, 8, 'Percusión', CURRENT_DATE - 350, FALSE);

INSERT INTO administrador (id_administrador, id_usuario, fecha_contratacion) VALUES
  (1, 9,  CURRENT_DATE - 300),
  (2, 10, CURRENT_DATE - 280);

INSERT INTO periodo_academico (id_periodo, nombre_periodo, fecha_inicio, fecha_fin, estado) VALUES
  (1, '2026-1', CURRENT_DATE - 300, CURRENT_DATE - 100, 'Cerrado'),
  (2, '2026-2', CURRENT_DATE - 70,  CURRENT_DATE + 60,  'Activo');

INSERT INTO categoria_instrumento (id_categoria, nombre_categoria, descripcion) VALUES
  (1, 'Cuerda',    'Guitarras, violines y afines'),
  (2, 'Teclado',   'Pianos y sintetizadores'),
  (3, 'Percusión', 'Baterías y tambores'),
  (4, 'Viento',    'Saxofones y flautas');

INSERT INTO instrumento (id_instrumento, id_categoria, nombre_instrumento, marca, modelo, tamano, color, precio_venta, stock_actual, activo) VALUES
  (1,  1, 'Guitarra acústica',    'Yamaha',      'F310',         '4/4', 'Natural',   3500.00,  8, TRUE),
  (2,  1, 'Guitarra eléctrica',   'Fender',      'Stratocaster', '4/4', 'Sunburst', 12500.00,  3, TRUE),
  (3,  1, 'Violín',               'Stentor',     'Student II',   '4/4', 'Café',      4800.00,  0, TRUE),
  (4,  2, 'Piano digital',        'Yamaha',      'P-125',         NULL, 'Negro',   18900.00,  4, TRUE),
  (5,  2, 'Teclado sintetizador', 'Roland',      'Juno-DS',      '61',  'Negro',   15200.00,  2, TRUE),
  (6,  3, 'Batería acústica',     'Pearl',       'Roadshow',      NULL, 'Rojo',    14800.00,  1, TRUE),
  (7,  3, 'Batería electrónica',  'Alesis',      'Nitro Mesh',    NULL, 'Negro',    9800.00,  5, TRUE),
  (8,  4, 'Saxofón alto',         'Selmer',      'Prelude',       NULL, 'Dorado',  21000.00,  1, TRUE),
  (9,  4, 'Flauta traversa',      'Gemeinhardt', '2SP',           NULL, 'Plateado', 8900.00,  0, TRUE),
  (10, 1, 'Ukelele soprano',      'Kala',        'KA-15S',        NULL, NULL,       1800.00, 15, TRUE),
  (11, 4, 'Melódica',             NULL,          NULL,            NULL, 'Azul',      950.00,  6, FALSE);

INSERT INTO clase (id_clase, id_maestro, id_instrumento, id_periodo, nombre_clase, nivel, costo_mensual, cupo_maximo, activa) VALUES
  (1, 1, 1, 2, 'Guitarra principiantes', 'Principiante',  800.00, 15, TRUE),
  (2, 1, 2, 2, 'Guitarra intermedia',    'Intermedio',   1100.00, 10, TRUE),
  (3, 2, 4, 2, 'Piano inicial',          'Principiante',  900.00, 12, TRUE),
  (4, 3, 6, 2, 'Percusión juvenil',      'Intermedio',   1000.00,  8, TRUE),
  (5, 2, 4, 1, 'Piano avanzado',         'Avanzado',     1500.00,  6, FALSE);

INSERT INTO horario_clase (id_horario, id_clase, dia_semana, hora_inicio, hora_fin, salon) VALUES
  (1, 1, 'Lunes',     '09:00', '11:00', 'A-1'),
  (2, 1, 'Miércoles', '09:00', '11:00', 'A-1'),
  (3, 2, 'Martes',    '16:00', '18:00', 'A-2'),
  (4, 3, 'Jueves',    '10:00', '12:00', NULL),
  (5, 4, 'Viernes',   '17:00', '19:00', NULL),
  (6, 5, 'Sábado',    '08:00', '10:00', 'B-1');

INSERT INTO inscripcion_clase (id_inscripcion, id_cliente, id_clase, costo_mensual_acordado, estado_inscripcion, fecha_inscripcion) VALUES
  (1, 1, 1,  800.00, 'Activa', CURRENT_DATE - 60),
  (2, 2, 1,  800.00, 'Activa', CURRENT_DATE - 55),
  (3, 3, 3,  900.00, 'Activa', CURRENT_DATE - 50),
  (4, 4, 4,  950.00, 'Baja',   CURRENT_DATE - 45),
  (5, 5, 2, 1100.00, 'Activa', CURRENT_DATE - 30),
  (6, 1, 3,  900.00, 'Activa', CURRENT_DATE - 20);

INSERT INTO pago_clase (id_pago_clase, id_inscripcion, importe, fecha_vencimiento, fecha_pago, metodo_pago, estado_pago, periodo_pagado) VALUES
  (1, 1,  800.00, CURRENT_DATE - 55, CURRENT_DATE - 54, 'efectivo',      'Pagado',    CURRENT_DATE - 55),
  (2, 1,  800.00, CURRENT_DATE - 25, CURRENT_DATE - 24, 'tarjeta',       'Pagado',    CURRENT_DATE - 25),
  (3, 2,  800.00, CURRENT_DATE - 25, NULL,              NULL,            'Pendiente', CURRENT_DATE - 25),
  (4, 3,  900.00, CURRENT_DATE - 20, CURRENT_DATE - 19, 'transferencia', 'Pagado',    CURRENT_DATE - 20),
  (5, 4,  950.00, CURRENT_DATE - 15, NULL,              NULL,            'Vencido',   CURRENT_DATE - 15),
  (6, 5, 1100.00, CURRENT_DATE - 10, CURRENT_DATE - 9,  'tarjeta',       'Pagado',    CURRENT_DATE - 10),
  (7, 6,  900.00, CURRENT_DATE - 5,  NULL,              NULL,            'Pendiente', CURRENT_DATE - 5);

INSERT INTO proveedor (id_proovedor, nombre_proveedor, rfc, correo, direccion, telefono, activo) VALUES
  (1, 'Distribuidora Musical del Valle', 'DMV010101AB1', 'ventas@dmv.com',   'Bodega 1',   '5551112233', TRUE),
  (2, 'Importadora Sonora',              'ISO020202CD2', 'contacto@iso.com', NULL,         '5554445566', TRUE),
  (3, 'Instrumentos del Norte',          'INM030303EF3', 'info@idn.com',     'Av. Sur 900','5557778899', FALSE);

INSERT INTO orden_abastecimiento (id_orden, id_proovedor, id_administrador, fecha_orden, estado_orden) VALUES
  (1, 1, 1, CURRENT_DATE - 30, 'Recibida'),
  (2, 2, 2, CURRENT_DATE - 15, 'Pendiente');

INSERT INTO detalles_orden (id_orden, id_instrumento, cantidad_solicitada, cantidad_recibida, costo_unitario) VALUES
  (1, 1,  10, 10,  2500.00),
  (1, 10, 20, 20,  1200.00),
  (2, 4,   5,  2, 14000.00);

INSERT INTO venta (id_venta, id_cliente, id_administrador, fecha_venta, metodo_pago, estado_venta) VALUES
  (1, 1, 1, CURRENT_DATE - 2,  'tarjeta',       'Completada'),
  (2, 2, 2, CURRENT_DATE - 5,  'efectivo',      'Completada'),
  (3, 3, 1, CURRENT_DATE - 12, 'transferencia', 'Completada'),
  (4, 4, 2, CURRENT_DATE - 40, 'efectivo',      'Completada'),
  (5, 5, 1, CURRENT_DATE - 1,  'tarjeta',       'Completada');

INSERT INTO detalle_venta (id_venta, id_instrumento, cantidad, precio_unitario) VALUES
  (1, 1,  1,  3500.00),
  (1, 10, 2,  1800.00),
  (2, 4,  1, 18900.00),
  (3, 5,  1, 15200.00),
  (3, 7,  1,  9800.00),
  (4, 2,  1, 12500.00),
  (5, 8,  1, 21000.00);

-- Las inserciones usan ids explícitos: adelantamos las secuencias para que
-- el siguiente INSERT no choque con la llave primaria.
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'),               (SELECT max(id_usuario) FROM usuario));
SELECT setval(pg_get_serial_sequence('cliente', 'id_cliente'),               (SELECT max(id_cliente) FROM cliente));
SELECT setval(pg_get_serial_sequence('maestro', 'id_maestro'),               (SELECT max(id_maestro) FROM maestro));
SELECT setval(pg_get_serial_sequence('administrador', 'id_administrador'),   (SELECT max(id_administrador) FROM administrador));
SELECT setval(pg_get_serial_sequence('periodo_academico', 'id_periodo'),     (SELECT max(id_periodo) FROM periodo_academico));
SELECT setval(pg_get_serial_sequence('categoria_instrumento', 'id_categoria'), (SELECT max(id_categoria) FROM categoria_instrumento));
SELECT setval(pg_get_serial_sequence('instrumento', 'id_instrumento'),       (SELECT max(id_instrumento) FROM instrumento));
SELECT setval(pg_get_serial_sequence('clase', 'id_clase'),                   (SELECT max(id_clase) FROM clase));
SELECT setval(pg_get_serial_sequence('horario_clase', 'id_horario'),         (SELECT max(id_horario) FROM horario_clase));
SELECT setval(pg_get_serial_sequence('inscripcion_clase', 'id_inscripcion'), (SELECT max(id_inscripcion) FROM inscripcion_clase));
SELECT setval(pg_get_serial_sequence('pago_clase', 'id_pago_clase'),         (SELECT max(id_pago_clase) FROM pago_clase));
SELECT setval(pg_get_serial_sequence('venta', 'id_venta'),                   (SELECT max(id_venta) FROM venta));
SELECT setval(pg_get_serial_sequence('proveedor', 'id_proovedor'),           (SELECT max(id_proovedor) FROM proveedor));
SELECT setval(pg_get_serial_sequence('orden_abastecimiento', 'id_orden'),    (SELECT max(id_orden) FROM orden_abastecimiento));

\echo ''
\echo '--- Resumen de lo cargado ---'
SELECT 'usuario'       AS tabla, COUNT(*) FROM usuario
UNION ALL SELECT 'instrumento',       COUNT(*) FROM instrumento
UNION ALL SELECT 'clase',             COUNT(*) FROM clase
UNION ALL SELECT 'inscripcion_clase', COUNT(*) FROM inscripcion_clase
UNION ALL SELECT 'pago_clase',        COUNT(*) FROM pago_clase
UNION ALL SELECT 'venta',             COUNT(*) FROM venta
UNION ALL SELECT 'detalle_venta',     COUNT(*) FROM detalle_venta
ORDER BY 1;
