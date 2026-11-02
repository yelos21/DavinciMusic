// Práctica 5: consultas, JOIN, agregadas, vistas, funciones y disparadores.
// Solo opera sobre bases cuyo nombre empiece con "practica_": la base real
// del proyecto (neondb, usada por Prisma y better-auth) nunca se toca.

export const NOMBRE_PRACTICA = /^practica_[a-z0-9_]{1,40}$/;
export const esBasePractica = (n) => typeof n === 'string' && NOMBRE_PRACTICA.test(n);

// ============ Esquema del proyecto (mismo que Prisma, sin las tablas de auth) ============

export const DDL = [
  `CREATE TABLE IF NOT EXISTS usuario (
      id_usuario SERIAL PRIMARY KEY,
      nombre_usuario TEXT,
      nombre TEXT NOT NULL,
      apellido_paterno TEXT,
      apellido_materno TEXT,
      fecha_nacimiento TIMESTAMP(3),
      curp TEXT,
      ine TEXT,
      correo TEXT NOT NULL,
      telefono TEXT,
      direccion TEXT,
      contrasena_hash TEXT,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      fecha_registro TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS categoria_instrumento (
      id_categoria SERIAL PRIMARY KEY,
      nombre_categoria TEXT NOT NULL,
      descripcion TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS instrumento (
      id_instrumento SERIAL PRIMARY KEY,
      id_categoria INTEGER NOT NULL REFERENCES categoria_instrumento(id_categoria),
      nombre_instrumento TEXT NOT NULL,
      marca TEXT,
      modelo TEXT,
      tamano TEXT,
      color TEXT,
      precio_venta NUMERIC(10,2) NOT NULL,
      stock_actual INTEGER NOT NULL DEFAULT 0,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      imagen_url TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS cliente (
      id_cliente SERIAL PRIMARY KEY,
      id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
      fecha_alta TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS maestro (
      id_maestro SERIAL PRIMARY KEY,
      id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
      especialidad TEXT NOT NULL,
      fecha_contratacion TIMESTAMP(3) NOT NULL,
      activo BOOLEAN NOT NULL DEFAULT TRUE
  )`,
  `CREATE TABLE IF NOT EXISTS administrador (
      id_administrador SERIAL PRIMARY KEY,
      id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
      fecha_contratacion TIMESTAMP(3) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS periodo_academico (
      id_periodo SERIAL PRIMARY KEY,
      nombre_periodo TEXT NOT NULL,
      fecha_inicio TIMESTAMP(3) NOT NULL,
      fecha_fin TIMESTAMP(3) NOT NULL,
      estado TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS clase (
      id_clase SERIAL PRIMARY KEY,
      id_maestro INTEGER NOT NULL REFERENCES maestro(id_maestro),
      id_instrumento INTEGER NOT NULL REFERENCES instrumento(id_instrumento),
      id_periodo INTEGER NOT NULL REFERENCES periodo_academico(id_periodo),
      nombre_clase TEXT NOT NULL,
      nivel TEXT NOT NULL,
      costo_mensual NUMERIC(10,2) NOT NULL,
      cupo_maximo INTEGER NOT NULL,
      activa BOOLEAN NOT NULL DEFAULT TRUE
  )`,
  `CREATE TABLE IF NOT EXISTS horario_clase (
      id_horario SERIAL PRIMARY KEY,
      id_clase INTEGER NOT NULL REFERENCES clase(id_clase),
      dia_semana TEXT NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fin TIME NOT NULL,
      salon TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS inscripcion_clase (
      id_inscripcion SERIAL PRIMARY KEY,
      id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente),
      id_clase INTEGER NOT NULL REFERENCES clase(id_clase),
      costo_mensual_acordado NUMERIC(10,2) NOT NULL,
      estado_inscripcion TEXT NOT NULL DEFAULT 'Activa',
      fecha_inscripcion TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS pago_clase (
      id_pago_clase SERIAL PRIMARY KEY,
      id_inscripcion INTEGER NOT NULL REFERENCES inscripcion_clase(id_inscripcion),
      importe NUMERIC(10,2) NOT NULL,
      fecha_vencimiento TIMESTAMP(3) NOT NULL,
      fecha_pago TIMESTAMP(3),
      metodo_pago TEXT,
      estado_pago TEXT NOT NULL DEFAULT 'Pendiente',
      periodo_pagado DATE NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS venta (
      id_venta SERIAL PRIMARY KEY,
      id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente),
      id_administrador INTEGER NOT NULL REFERENCES administrador(id_administrador),
      fecha_venta TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      metodo_pago TEXT NOT NULL,
      estado_venta TEXT NOT NULL DEFAULT 'Completada'
  )`,
  `CREATE TABLE IF NOT EXISTS detalle_venta (
      id_venta INTEGER NOT NULL REFERENCES venta(id_venta),
      id_instrumento INTEGER NOT NULL REFERENCES instrumento(id_instrumento),
      cantidad INTEGER NOT NULL,
      precio_unitario NUMERIC(10,2) NOT NULL,
      PRIMARY KEY (id_venta, id_instrumento)
  )`,
  `CREATE TABLE IF NOT EXISTS proveedor (
      id_proovedor SERIAL PRIMARY KEY,
      nombre_proveedor TEXT NOT NULL,
      rfc TEXT NOT NULL UNIQUE,
      correo TEXT NOT NULL,
      direccion TEXT,
      telefono TEXT NOT NULL,
      activo BOOLEAN NOT NULL DEFAULT TRUE
  )`,
  `CREATE TABLE IF NOT EXISTS orden_abastecimiento (
      id_orden SERIAL PRIMARY KEY,
      id_proovedor INTEGER NOT NULL REFERENCES proveedor(id_proovedor),
      id_administrador INTEGER NOT NULL REFERENCES administrador(id_administrador),
      fecha_orden TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      estado_orden TEXT NOT NULL DEFAULT 'Pendiente'
  )`,
  `CREATE TABLE IF NOT EXISTS detalles_orden (
      id_orden INTEGER NOT NULL REFERENCES orden_abastecimiento(id_orden),
      id_instrumento INTEGER NOT NULL REFERENCES instrumento(id_instrumento),
      cantidad_solicitada INTEGER NOT NULL,
      cantidad_recibida INTEGER NOT NULL DEFAULT 0,
      costo_unitario NUMERIC(10,2) NOT NULL,
      PRIMARY KEY (id_orden, id_instrumento)
  )`,
];

// ============ Datos de ejemplo ============

export const LIMPIAR = [
  'DROP TRIGGER IF EXISTS trg_validar_stock ON detalle_venta',
  'DROP TRIGGER IF EXISTS trg_descontar_stock ON detalle_venta',
  'DROP TRIGGER IF EXISTS trg_auditar_precio ON instrumento',
  'TRUNCATE detalles_orden, orden_abastecimiento, detalle_venta, venta, pago_clase, inscripcion_clase, horario_clase, clase, instrumento, categoria_instrumento, periodo_academico, administrador, maestro, cliente, usuario, proveedor RESTART IDENTITY CASCADE',
];

export const DEMO = [
  `INSERT INTO usuario (id_usuario, nombre_usuario, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, curp, correo, telefono, direccion, activo, fecha_registro) VALUES
    (1, 'ana',       'Ana',    'López',     'Hernández', '1990-05-12', 'LOHA900512MDFRRN01', 'ana@correo.com',    '5512345678', 'Av. Reforma 100',  TRUE,  CURRENT_DATE - 200),
    (2, 'luis',      'Luis',   'Martínez',  NULL,       '1985-11-03', 'MALO851103HDFRRS02', 'luis@correo.com',   NULL,         NULL,               TRUE,  CURRENT_DATE - 180),
    (3, 'maria',     'María',  'García',    'Ruiz',     '1998-02-20', 'GARM980220MDFRCR03', 'maria@correo.com',  '5598765432', 'Calle Juárez 45',  TRUE,  CURRENT_DATE - 150),
    (4, 'pedro',     'Pedro',  'Ramírez',   'Soto',     '2001-07-08', 'RASP010708HDFRST04', 'pedro@correo.com',  NULL,         'Av. Hidalgo 7',    TRUE,  CURRENT_DATE - 120),
    (5, 'elena',     'Elena',  'Vargas',    'Luna',     '1995-03-30', 'VALA950330MDFRNL05', 'elena@correo.com',  '5544332211', NULL,               TRUE,  CURRENT_DATE - 90),
    (6, 'carlos',    'Carlos', 'Hernández', 'Paz',      '1980-01-15', 'HEPC800115HDFRPZ06', 'carlos@davinci.mx', '5551112233', 'Conservatorio 1',  TRUE,  CURRENT_DATE - 400),
    (7, 'sofia',     'Sofía',  'Torres',    'Mena',     '1987-09-21', 'TOME870921MDFRMN07', 'sofia@davinci.mx',  '5554445566', NULL,               TRUE,  CURRENT_DATE - 380),
    (8, 'diego',     'Diego',  'Flores',    'Canales',  '1983-06-04', 'FOCD830604HDFRNC08', 'diego@davinci.mx',  '5557778899', 'Av. Sur 900',      TRUE,  CURRENT_DATE - 350),
    (9, 'laura',     'Laura',  'Méndez',    'Ibarra',   '1992-12-11', 'MEIL921211MDFRBR09', 'laura@davinci.mx',  '5559990011', NULL,               TRUE,  CURRENT_DATE - 300),
    (10, 'jorge',    'Jorge',  'Ruiz',      'Nava',     '1988-04-25', 'RUNJ880425HDFRVC10', 'jorge@davinci.mx',  '5552223344', 'Av. Norte 22',     TRUE,  CURRENT_DATE - 280)`,
  `INSERT INTO cliente (id_cliente, id_usuario, fecha_alta) VALUES
    (1, 1, CURRENT_DATE - 190), (2, 2, CURRENT_DATE - 170), (3, 3, CURRENT_DATE - 140),
    (4, 4, CURRENT_DATE - 110), (5, 5, CURRENT_DATE - 80)`,
  `INSERT INTO maestro (id_maestro, id_usuario, especialidad, fecha_contratacion, activo) VALUES
    (1, 6, 'Guitarra',  CURRENT_DATE - 400, TRUE),
    (2, 7, 'Piano',     CURRENT_DATE - 380, TRUE),
    (3, 8, 'Percusión', CURRENT_DATE - 350, FALSE)`,
  `INSERT INTO administrador (id_administrador, id_usuario, fecha_contratacion) VALUES
    (1, 9, CURRENT_DATE - 300), (2, 10, CURRENT_DATE - 280)`,
  `INSERT INTO periodo_academico (id_periodo, nombre_periodo, fecha_inicio, fecha_fin, estado) VALUES
    (1, '2026-1', CURRENT_DATE - 300, CURRENT_DATE - 100, 'Cerrado'),
    (2, '2026-2', CURRENT_DATE - 70,  CURRENT_DATE + 60,  'Activo')`,
  `INSERT INTO categoria_instrumento (id_categoria, nombre_categoria, descripcion) VALUES
    (1, 'Cuerda',    'Guitarras, violines y afines'),
    (2, 'Teclado',   'Pianos y sintetizadores'),
    (3, 'Percusión', 'Baterías y tambores'),
    (4, 'Viento',    'Saxofones y flautas')`,
  `INSERT INTO instrumento (id_instrumento, id_categoria, nombre_instrumento, marca, modelo, tamano, color, precio_venta, stock_actual, activo) VALUES
    (1,  1, 'Guitarra acústica',   'Yamaha',  'F310',        '4/4', 'Natural', 3500.00,  8, TRUE),
    (2,  1, 'Guitarra eléctrica',  'Fender',  'Stratocaster','4/4', 'Sunburst',12500.00, 3, TRUE),
    (3,  1, 'Violín',              'Stentor', 'Student II',  '4/4', 'Café',    4800.00,  0, TRUE),
    (4,  2, 'Piano digital',       'Yamaha',  'P-125',       NULL,  'Negro',  18900.00,  4, TRUE),
    (5,  2, 'Teclado sintetizador','Roland',  'Juno-DS',     '61',  'Negro',  15200.00,  2, TRUE),
    (6,  3, 'Batería acústica',    'Pearl',   'Roadshow',    NULL,  'Rojo',   14800.00,  1, TRUE),
    (7,  3, 'Batería electrónica', 'Alesis',  'Nitro Mesh',  NULL,  'Negro',   9800.00,  5, TRUE),
    (8,  4, 'Saxofón alto',        'Selmer',  'Prelude',     NULL,  'Dorado', 21000.00,  1, TRUE),
    (9,  4, 'Flauta traversa',     'Gemeinhardt', '2SP',     NULL,  'Plateado',8900.00,  0, TRUE),
    (10, 1, 'Ukelele soprano',     'Kala',    'KA-15S',      NULL,  NULL,      1800.00, 15, TRUE),
    (11, 4, 'Melódica',            NULL,      NULL,          NULL,  'Azul',     950.00,  6, FALSE)`,
  `INSERT INTO clase (id_clase, id_maestro, id_instrumento, id_periodo, nombre_clase, nivel, costo_mensual, cupo_maximo, activa) VALUES
    (1, 1, 1, 2, 'Guitarra principiantes', 'Principiante',  800.00, 15, TRUE),
    (2, 1, 2, 2, 'Guitarra intermedia',    'Intermedio',   1100.00, 10, TRUE),
    (3, 2, 4, 2, 'Piano inicial',          'Principiante',  900.00, 12, TRUE),
    (4, 3, 6, 2, 'Percusión juvenil',      'Intermedio',   1000.00,  8, TRUE),
    (5, 2, 4, 1, 'Piano avanzado',         'Avanzado',     1500.00,  6, FALSE)`,
  `INSERT INTO horario_clase (id_horario, id_clase, dia_semana, hora_inicio, hora_fin, salon) VALUES
    (1, 1, 'Lunes',     '09:00', '11:00', 'A-1'),
    (2, 1, 'Miércoles', '09:00', '11:00', 'A-1'),
    (3, 2, 'Martes',    '16:00', '18:00', 'A-2'),
    (4, 3, 'Jueves',    '10:00', '12:00', NULL),
    (5, 4, 'Viernes',   '17:00', '19:00', NULL),
    (6, 5, 'Sábado',    '08:00', '10:00', 'B-1')`,
  `INSERT INTO inscripcion_clase (id_inscripcion, id_cliente, id_clase, costo_mensual_acordado, estado_inscripcion, fecha_inscripcion) VALUES
    (1, 1, 1,  800.00, 'Activa', CURRENT_DATE - 60),
    (2, 2, 1,  800.00, 'Activa', CURRENT_DATE - 55),
    (3, 3, 3,  900.00, 'Activa', CURRENT_DATE - 50),
    (4, 4, 4,  950.00, 'Baja',   CURRENT_DATE - 45),
    (5, 5, 2, 1100.00, 'Activa', CURRENT_DATE - 30),
    (6, 1, 3,  900.00, 'Activa', CURRENT_DATE - 20)`,
  `INSERT INTO pago_clase (id_pago_clase, id_inscripcion, importe, fecha_vencimiento, fecha_pago, metodo_pago, estado_pago, periodo_pagado) VALUES
    (1, 1,  800.00, CURRENT_DATE - 55, CURRENT_DATE - 54, 'efectivo',      'Pagado',    CURRENT_DATE - 55),
    (2, 1,  800.00, CURRENT_DATE - 25, CURRENT_DATE - 24, 'tarjeta',       'Pagado',    CURRENT_DATE - 25),
    (3, 2,  800.00, CURRENT_DATE - 25, NULL,              NULL,            'Pendiente', CURRENT_DATE - 25),
    (4, 3,  900.00, CURRENT_DATE - 20, CURRENT_DATE - 19, 'transferencia', 'Pagado',    CURRENT_DATE - 20),
    (5, 4,  950.00, CURRENT_DATE - 15, NULL,              NULL,            'Vencido',   CURRENT_DATE - 15),
    (6, 5, 1100.00, CURRENT_DATE - 10, CURRENT_DATE - 9,  'tarjeta',       'Pagado',    CURRENT_DATE - 10),
    (7, 6,  900.00, CURRENT_DATE - 5,  NULL,              NULL,            'Pendiente', CURRENT_DATE - 5)`,
  `INSERT INTO proveedor (id_proovedor, nombre_proveedor, rfc, correo, direccion, telefono, activo) VALUES
    (1, 'Distribuidora Musical del Valle', 'DMV010101AB1', 'ventas@dmv.com',   'Bodega 1', '5551112233', TRUE),
    (2, 'Importadora Sonora',              'ISO020202CD2', 'contacto@iso.com', NULL,       '5554445566', TRUE),
    (3, 'Instrumentos del Norte',          'INM030303EF3', 'info@idn.com',     'Av. Sur 900','5557778899', FALSE)`,
  `INSERT INTO orden_abastecimiento (id_orden, id_proovedor, id_administrador, fecha_orden, estado_orden) VALUES
    (1, 1, 1, CURRENT_DATE - 30, 'Recibida'),
    (2, 2, 2, CURRENT_DATE - 15, 'Pendiente')`,
  `INSERT INTO detalles_orden (id_orden, id_instrumento, cantidad_solicitada, cantidad_recibida, costo_unitario) VALUES
    (1, 1, 10, 10, 2500.00),
    (1, 10, 20, 20, 1200.00),
    (2, 4,  5,  2, 14000.00)`,
  `INSERT INTO venta (id_venta, id_cliente, id_administrador, fecha_venta, metodo_pago, estado_venta) VALUES
    (1, 1, 1, CURRENT_DATE - 2,  'tarjeta',       'Completada'),
    (2, 2, 2, CURRENT_DATE - 5,  'efectivo',      'Completada'),
    (3, 3, 1, CURRENT_DATE - 12, 'transferencia', 'Completada'),
    (4, 4, 2, CURRENT_DATE - 40, 'efectivo',      'Completada'),
    (5, 5, 1, CURRENT_DATE - 1,  'tarjeta',       'Completada')`,
  `INSERT INTO detalle_venta (id_venta, id_instrumento, cantidad, precio_unitario) VALUES
    (1, 1,  1,  3500.00),
    (1, 10, 2,  1800.00),
    (2, 4,  1, 18900.00),
    (3, 5,  1, 15200.00),
    (3, 7,  1,  9800.00),
    (4, 2,  1, 12500.00),
    (5, 8,  1, 21000.00)`,
];

// Las inserciones de ejemplo usan ids explícitos, así que hay que adelantar
// las secuencias (si no, el siguiente INSERT choca con la llave primaria).
export const SECUENCIAS = [
  ['usuario', 'id_usuario'], ['cliente', 'id_cliente'], ['maestro', 'id_maestro'],
  ['administrador', 'id_administrador'], ['periodo_academico', 'id_periodo'],
  ['categoria_instrumento', 'id_categoria'], ['instrumento', 'id_instrumento'],
  ['clase', 'id_clase'], ['horario_clase', 'id_horario'],
  ['inscripcion_clase', 'id_inscripcion'], ['pago_clase', 'id_pago_clase'],
  ['venta', 'id_venta'], ['proveedor', 'id_proovedor'], ['orden_abastecimiento', 'id_orden'],
].map(([tabla, columna]) =>
  `SELECT setval(pg_get_serial_sequence('${tabla}', '${columna}'), COALESCE((SELECT MAX(${columna}) FROM ${tabla}), 1))`
);

// ============ 5.1 25 consultas simples ============

export const CONSULTAS = [
  ['Todas las categorías de instrumento', 'SELECT id_categoria, nombre_categoria, descripcion FROM categoria_instrumento ORDER BY nombre_categoria'],
  ['Instrumentos activos con su precio', 'SELECT nombre_instrumento, marca, precio_venta, stock_actual FROM instrumento WHERE activo = TRUE ORDER BY precio_venta DESC'],
  ['Instrumentos con precio mayor a 10000', 'SELECT nombre_instrumento, precio_venta FROM instrumento WHERE precio_venta > 10000 ORDER BY precio_venta DESC'],
  ['Instrumentos agotados o con stock bajo', 'SELECT nombre_instrumento, stock_actual FROM instrumento WHERE stock_actual <= 3 ORDER BY stock_actual'],
  ['Los 5 instrumentos más caros', 'SELECT nombre_instrumento, precio_venta FROM instrumento ORDER BY precio_venta DESC LIMIT 5'],
  ['Marcas distintas que se manejan', 'SELECT DISTINCT marca FROM instrumento WHERE marca IS NOT NULL ORDER BY marca'],
  ['Usuarios cuyo nombre empieza con A', "SELECT nombre, apellido_paterno FROM usuario WHERE nombre LIKE 'A%' ORDER BY nombre"],
  ['Correos del dominio davinci.mx', "SELECT nombre, correo FROM usuario WHERE correo LIKE '%@davinci.mx' ORDER BY correo"],
  ['Clientes dados de alta en los últimos 120 días', 'SELECT id_cliente, id_usuario, fecha_alta FROM cliente WHERE fecha_alta >= CURRENT_DATE - 120 ORDER BY fecha_alta'],
  ['Maestros activos', 'SELECT id_maestro, especialidad, activo FROM maestro WHERE activo = TRUE'],
  ['Instrumentos de las categorías 1 y 2', 'SELECT nombre_instrumento, id_categoria FROM instrumento WHERE id_categoria IN (1, 2) ORDER BY id_categoria, nombre_instrumento'],
  ['Instrumentos con precio entre 3000 y 12000', 'SELECT nombre_instrumento, precio_venta FROM instrumento WHERE precio_venta BETWEEN 3000 AND 12000 ORDER BY precio_venta'],
  ['Usuarios sin teléfono registrado', 'SELECT nombre, apellido_paterno, telefono FROM usuario WHERE telefono IS NULL'],
  ['Nombre completo concatenado de cada usuario', "SELECT nombre || ' ' || COALESCE(apellido_paterno, '') || ' ' || COALESCE(apellido_materno, '') AS nombre_completo FROM usuario ORDER BY 1"],
  ['IVA (16%) estimado por instrumento', 'SELECT nombre_instrumento, precio_venta, ROUND(precio_venta * 0.16, 2) AS iva FROM instrumento ORDER BY precio_venta DESC'],
  ['Precio con 10% de descuento', 'SELECT nombre_instrumento, precio_venta, ROUND(precio_venta * 0.90, 2) AS precio_oferta FROM instrumento WHERE activo = TRUE ORDER BY precio_venta DESC'],
  ['Categorías en mayúsculas', 'SELECT UPPER(nombre_categoria) AS categoria FROM categoria_instrumento ORDER BY 1'],
  ['Longitud del nombre de cada clase', 'SELECT nombre_clase, LENGTH(nombre_clase) AS caracteres FROM clase ORDER BY 2 DESC, 1'],
  ['Clases con costo mensual mayor a 1000', 'SELECT nombre_clase, nivel, costo_mensual FROM clase WHERE costo_mensual > 1000 ORDER BY costo_mensual DESC'],
  ['Clases disponibles por nivel', 'SELECT DISTINCT nivel FROM clase ORDER BY nivel'],
  ['Inscripciones activas', "SELECT id_inscripcion, id_cliente, id_clase, costo_mensual_acordado FROM inscripcion_clase WHERE estado_inscripcion = 'Activa' ORDER BY id_inscripcion"],
  ['Pagos pendientes o vencidos', "SELECT id_pago_clase, importe, estado_pago FROM pago_clase WHERE estado_pago IN ('Pendiente', 'Vencido') ORDER BY fecha_vencimiento"],
  ['Pagos que aún no tienen fecha de pago', 'SELECT id_pago_clase, importe, fecha_vencimiento FROM pago_clase WHERE fecha_pago IS NULL ORDER BY fecha_vencimiento'],
  ['Horarios del turno matutino', "SELECT id_horario, dia_semana, hora_inicio, hora_fin FROM horario_clase WHERE hora_inicio < TIME '12:00' ORDER BY hora_inicio"],
  ['Ventas de los últimos 30 días', 'SELECT id_venta, fecha_venta, metodo_pago, estado_venta FROM venta WHERE fecha_venta >= CURRENT_DATE - 30 ORDER BY fecha_venta DESC'],
];

// ============ 5.2 15 operaciones JOIN ============

export const JOINS = [
  ['INNER JOIN: instrumento con su categoría',
    'SELECT i.nombre_instrumento, c.nombre_categoria, i.precio_venta FROM instrumento i INNER JOIN categoria_instrumento c ON c.id_categoria = i.id_categoria ORDER BY c.nombre_categoria, i.nombre_instrumento'],
  ['INNER JOIN: cliente con los datos de su usuario',
    'SELECT c.id_cliente, u.nombre, u.apellido_paterno, u.correo FROM cliente c INNER JOIN usuario u ON u.id_usuario = c.id_usuario ORDER BY c.id_cliente'],
  ['INNER JOIN: maestro con su usuario',
    'SELECT m.especialidad, u.nombre, u.apellido_paterno FROM maestro m INNER JOIN usuario u ON u.id_usuario = m.id_usuario ORDER BY m.id_maestro'],
  ['INNER JOIN: clase con su maestro',
    'SELECT cl.nombre_clase, u.nombre || \' \' || COALESCE(u.apellido_paterno, \'\') AS maestro, cl.nivel FROM clase cl INNER JOIN maestro m ON m.id_maestro = cl.id_maestro INNER JOIN usuario u ON u.id_usuario = m.id_usuario ORDER BY cl.id_clase'],
  ['INNER JOIN: clase con el instrumento que se imparte',
    'SELECT cl.nombre_clase, i.nombre_instrumento, i.marca FROM clase cl INNER JOIN instrumento i ON i.id_instrumento = cl.id_instrumento ORDER BY cl.id_clase'],
  ['INNER JOIN: clase con su periodo académico',
    'SELECT cl.nombre_clase, p.nombre_periodo, p.estado FROM clase cl INNER JOIN periodo_academico p ON p.id_periodo = cl.id_periodo ORDER BY p.nombre_periodo, cl.nombre_clase'],
  ['INNER JOIN: horario con la clase y su salón',
    'SELECT h.dia_semana, h.hora_inicio, h.hora_fin, cl.nombre_clase FROM horario_clase h INNER JOIN clase cl ON cl.id_clase = h.id_clase ORDER BY h.dia_semana, h.hora_inicio'],
  ['INNER JOIN: inscripción con alumno y clase',
    'SELECT ic.id_inscripcion, u.nombre AS alumno, cl.nombre_clase, ic.estado_inscripcion FROM inscripcion_clase ic INNER JOIN cliente c ON c.id_cliente = ic.id_cliente INNER JOIN usuario u ON u.id_usuario = c.id_usuario INNER JOIN clase cl ON cl.id_clase = ic.id_clase ORDER BY ic.id_inscripcion'],
  ['INNER JOIN: pagos con la inscripción y el alumno',
    'SELECT pc.id_pago_clase, u.nombre AS alumno, pc.importe, pc.estado_pago FROM pago_clase pc INNER JOIN inscripcion_clase ic ON ic.id_inscripcion = pc.id_inscripcion INNER JOIN cliente c ON c.id_cliente = ic.id_cliente INNER JOIN usuario u ON u.id_usuario = c.id_usuario ORDER BY pc.id_pago_clase'],
  ['INNER JOIN: venta con cliente y administrador',
    'SELECT v.id_venta, uc.nombre AS cliente, ua.nombre AS administrador, v.fecha_venta FROM venta v INNER JOIN cliente c ON c.id_cliente = v.id_cliente INNER JOIN usuario uc ON uc.id_usuario = c.id_usuario INNER JOIN administrador a ON a.id_administrador = v.id_administrador INNER JOIN usuario ua ON ua.id_usuario = a.id_usuario ORDER BY v.id_venta'],
  ['INNER JOIN: detalle de venta con el instrumento',
    'SELECT dv.id_venta, i.nombre_instrumento, dv.cantidad, dv.precio_unitario FROM detalle_venta dv INNER JOIN instrumento i ON i.id_instrumento = dv.id_instrumento ORDER BY dv.id_venta, i.nombre_instrumento'],
  ['INNER JOIN: orden de abastecimiento con proveedor',
    'SELECT o.id_orden, pr.nombre_proveedor, o.fecha_orden, o.estado_orden FROM orden_abastecimiento o INNER JOIN proveedor pr ON pr.id_proovedor = o.id_proovedor ORDER BY o.id_orden'],
  ['LEFT JOIN: clases que no tienen ninguna inscripción',
    'SELECT cl.id_clase, cl.nombre_clase FROM clase cl LEFT JOIN inscripcion_clase ic ON ic.id_clase = cl.id_clase WHERE ic.id_inscripcion IS NULL ORDER BY cl.id_clase'],
  ['LEFT JOIN: instrumentos que nunca se han vendido',
    'SELECT i.id_instrumento, i.nombre_instrumento FROM instrumento i LEFT JOIN detalle_venta dv ON dv.id_instrumento = i.id_instrumento WHERE dv.id_instrumento IS NULL ORDER BY i.id_instrumento'],
  ['SELF JOIN: usuarios que comparten apellido paterno',
    'SELECT a.nombre AS usuario_1, b.nombre AS usuario_2, a.apellido_paterno FROM usuario a INNER JOIN usuario b ON a.apellido_paterno = b.apellido_paterno AND a.id_usuario < b.id_usuario ORDER BY a.apellido_paterno'],
];

// ============ 5.3 15 funciones agregadas ============

export const AGREGADAS = [
  ['COUNT: total de instrumentos', 'SELECT COUNT(*) AS total_instrumentos FROM instrumento'],
  ['SUM: piezas en inventario', 'SELECT SUM(stock_actual) AS piezas_en_stock FROM instrumento'],
  ['AVG: precio de venta promedio', 'SELECT ROUND(AVG(precio_venta), 2) AS precio_promedio FROM instrumento'],
  ['MIN y MAX: instrumento más barato y más caro', 'SELECT MIN(precio_venta) AS mas_barato, MAX(precio_venta) AS mas_caro FROM instrumento'],
  ['GROUP BY: instrumentos por categoría', 'SELECT c.nombre_categoria, COUNT(i.id_instrumento) AS instrumentos FROM categoria_instrumento c LEFT JOIN instrumento i ON i.id_categoria = c.id_categoria GROUP BY c.nombre_categoria ORDER BY instrumentos DESC, c.nombre_categoria'],
  ['GROUP BY: existencias por categoría', 'SELECT c.nombre_categoria, COALESCE(SUM(i.stock_actual), 0) AS piezas FROM categoria_instrumento c LEFT JOIN instrumento i ON i.id_categoria = c.id_categoria GROUP BY c.nombre_categoria ORDER BY piezas DESC'],
  ['HAVING: categorías con más de dos instrumentos', 'SELECT c.nombre_categoria, COUNT(i.id_instrumento) AS instrumentos FROM categoria_instrumento c INNER JOIN instrumento i ON i.id_categoria = c.id_categoria GROUP BY c.nombre_categoria HAVING COUNT(i.id_instrumento) > 2 ORDER BY instrumentos DESC'],
  ['SUM: valor total del inventario', 'SELECT ROUND(SUM(stock_actual * precio_venta), 2) AS valor_inventario FROM instrumento'],
  ['GROUP BY: ventas y monto por método de pago', 'SELECT v.metodo_pago, COUNT(DISTINCT v.id_venta) AS ventas, ROUND(SUM(dv.cantidad * dv.precio_unitario), 2) AS monto FROM venta v LEFT JOIN detalle_venta dv ON dv.id_venta = v.id_venta GROUP BY v.metodo_pago ORDER BY monto DESC NULLS LAST'],
  ['SUM: dinero total vendido', 'SELECT ROUND(SUM(cantidad * precio_unitario), 2) AS total_vendido FROM detalle_venta'],
  ['AVG: ticket promedio por venta', 'SELECT ROUND(AVG(total), 2) AS ticket_promedio FROM (SELECT id_venta, SUM(cantidad * precio_unitario) AS total FROM detalle_venta GROUP BY id_venta) t'],
  ['COUNT DISTINCT: ventas y clientes distintos', 'SELECT COUNT(*) AS ventas, COUNT(DISTINCT id_cliente) AS clientes FROM venta'],
  ['AVG y MAX: piezas promedio y máxima por línea', 'SELECT ROUND(AVG(cantidad), 2) AS promedio, MAX(cantidad) AS maximo FROM detalle_venta'],
  ['MAX: venta más reciente', 'SELECT MAX(fecha_venta) AS ultima_venta FROM venta'],
  ['SUM: ingresos por clases pagadas y pagos pendientes', "SELECT ROUND(SUM(CASE WHEN estado_pago = 'Pagado' THEN importe ELSE 0 END), 2) AS cobrado, ROUND(SUM(CASE WHEN estado_pago <> 'Pagado' THEN importe ELSE 0 END), 2) AS por_cobrar, COUNT(*) AS pagos FROM pago_clase"],
];

// ============ 5.4 5 vistas ============

export const VISTAS = {
  v_instrumentos_categoria: `CREATE OR REPLACE VIEW v_instrumentos_categoria AS
    SELECT i.id_instrumento, i.nombre_instrumento, c.nombre_categoria,
           i.marca, i.precio_venta, i.stock_actual, i.activo
    FROM instrumento i
    INNER JOIN categoria_instrumento c ON c.id_categoria = i.id_categoria`,
  v_clases_detalle: `CREATE OR REPLACE VIEW v_clases_detalle AS
    SELECT cl.id_clase, cl.nombre_clase, cl.nivel, cl.costo_mensual, cl.cupo_maximo, cl.activa,
           u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS maestro,
           i.nombre_instrumento, p.nombre_periodo
    FROM clase cl
    INNER JOIN maestro m ON m.id_maestro = cl.id_maestro
    INNER JOIN usuario u ON u.id_usuario = m.id_usuario
    INNER JOIN instrumento i ON i.id_instrumento = cl.id_instrumento
    INNER JOIN periodo_academico p ON p.id_periodo = cl.id_periodo`,
  v_inscripciones_resumen: `CREATE OR REPLACE VIEW v_inscripciones_resumen AS
    SELECT ic.id_inscripcion,
           u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS alumno,
           cl.nombre_clase, ic.costo_mensual_acordado, ic.estado_inscripcion,
           (SELECT COUNT(*) FROM pago_clase pc WHERE pc.id_inscripcion = ic.id_inscripcion) AS pagos,
           COALESCE((SELECT SUM(pc.importe) FROM pago_clase pc
                     WHERE pc.id_inscripcion = ic.id_inscripcion AND pc.estado_pago = 'Pagado'), 0) AS pagado
    FROM inscripcion_clase ic
    INNER JOIN cliente c ON c.id_cliente = ic.id_cliente
    INNER JOIN usuario u ON u.id_usuario = c.id_usuario
    INNER JOIN clase cl ON cl.id_clase = ic.id_clase`,
  v_ventas_resumen: `CREATE OR REPLACE VIEW v_ventas_resumen AS
    SELECT v.id_venta, v.fecha_venta, v.metodo_pago, v.estado_venta,
           u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS cliente,
           COALESCE(SUM(dv.cantidad), 0) AS articulos,
           COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) AS total
    FROM venta v
    INNER JOIN cliente c ON c.id_cliente = v.id_cliente
    INNER JOIN usuario u ON u.id_usuario = c.id_usuario
    LEFT JOIN detalle_venta dv ON dv.id_venta = v.id_venta
    GROUP BY v.id_venta, v.fecha_venta, v.metodo_pago, v.estado_venta, u.nombre, u.apellido_paterno`,
  v_stock_bajo: `CREATE OR REPLACE VIEW v_stock_bajo AS
    SELECT i.id_instrumento, i.nombre_instrumento, c.nombre_categoria, i.stock_actual,
           CASE WHEN i.stock_actual = 0 THEN 'Agotado' ELSE 'Bajo' END AS situacion,
           (3 - i.stock_actual) AS faltante
    FROM instrumento i
    INNER JOIN categoria_instrumento c ON c.id_categoria = i.id_categoria
    WHERE i.stock_actual <= 3`,
};

// ============ 5.5 5 funciones y 3 disparadores ============

export const AUDITORIA = `CREATE TABLE IF NOT EXISTS auditoria_precio_instrumento (
  id_auditoria SERIAL PRIMARY KEY,
  id_instrumento INTEGER NOT NULL REFERENCES instrumento(id_instrumento) ON DELETE CASCADE,
  precio_anterior NUMERIC(10,2) NOT NULL,
  precio_nuevo NUMERIC(10,2) NOT NULL,
  cambiado_en TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export const FUNCIONES = [
  ['fn_ingresos_venta: total en dinero de una venta', `CREATE OR REPLACE FUNCTION fn_ingresos_venta(p_venta INTEGER)
    RETURNS NUMERIC AS $$
      SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
      FROM detalle_venta WHERE id_venta = p_venta;
    $$ LANGUAGE sql STABLE`],
  ['fn_alumnos_por_clase: alumnos inscritos en una clase', `CREATE OR REPLACE FUNCTION fn_alumnos_por_clase(p_clase INTEGER)
    RETURNS TABLE (alumno TEXT, estado TEXT, costo NUMERIC) AS $$
      SELECT u.nombre || ' ' || COALESCE(u.apellido_paterno, ''),
             ic.estado_inscripcion,
             ic.costo_mensual_acordado
      FROM inscripcion_clase ic
      INNER JOIN cliente c ON c.id_cliente = ic.id_cliente
      INNER JOIN usuario u ON u.id_usuario = c.id_usuario
      WHERE ic.id_clase = p_clase
      ORDER BY 1;
    $$ LANGUAGE sql STABLE`],
  ['fn_validar_stock: rechaza ventas sin existencias', `CREATE OR REPLACE FUNCTION fn_validar_stock()
    RETURNS TRIGGER AS $$
    DECLARE
      v_stock INTEGER;
    BEGIN
      SELECT stock_actual INTO v_stock FROM instrumento WHERE id_instrumento = NEW.id_instrumento;
      IF v_stock IS NULL THEN
        RAISE EXCEPTION 'El instrumento % no existe', NEW.id_instrumento;
      END IF;
      IF NEW.cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
      END IF;
      IF v_stock < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente del instrumento %: hay %, se piden %',
          NEW.id_instrumento, v_stock, NEW.cantidad;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`],
  ['fn_descontar_stock: baja el inventario al vender', `CREATE OR REPLACE FUNCTION fn_descontar_stock()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE instrumento
      SET stock_actual = stock_actual - NEW.cantidad
      WHERE id_instrumento = NEW.id_instrumento;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`],
  ['fn_auditar_precio: registra cambios de precio', `CREATE OR REPLACE FUNCTION fn_auditar_precio()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.precio_venta <> OLD.precio_venta THEN
        INSERT INTO auditoria_precio_instrumento (id_instrumento, precio_anterior, precio_nuevo)
        VALUES (NEW.id_instrumento, OLD.precio_venta, NEW.precio_venta);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`],
];

export const DISPARADORES = [
  ['trg_validar_stock (BEFORE INSERT en detalle_venta)', `DROP TRIGGER IF EXISTS trg_validar_stock ON detalle_venta;
    CREATE TRIGGER trg_validar_stock BEFORE INSERT ON detalle_venta
    FOR EACH ROW EXECUTE FUNCTION fn_validar_stock()`],
  ['trg_descontar_stock (AFTER INSERT en detalle_venta)', `DROP TRIGGER IF EXISTS trg_descontar_stock ON detalle_venta;
    CREATE TRIGGER trg_descontar_stock AFTER INSERT ON detalle_venta
    FOR EACH ROW EXECUTE FUNCTION fn_descontar_stock()`],
  ['trg_auditar_precio (AFTER UPDATE en instrumento)', `DROP TRIGGER IF EXISTS trg_auditar_precio ON instrumento;
    CREATE TRIGGER trg_auditar_precio AFTER UPDATE ON instrumento
    FOR EACH ROW EXECUTE FUNCTION fn_auditar_precio()`],
];
