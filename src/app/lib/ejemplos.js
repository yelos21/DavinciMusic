// 4.1 Bases de datos: proyecto + tres ejemplos
export const BASES = ['davinci_music', 'ejemplo_escuela', 'ejemplo_tienda', 'ejemplo_biblioteca'];

// Cada ejemplo indica en qué base se ejecuta. El mismo texto se puede pegar en psql.
export const EJEMPLOS = {
  proyecto_42: {
    bd: 'davinci_music',
    titulo: '4.2 Proyecto: tablas y registros',
    sql: `CREATE TABLE IF NOT EXISTS categoria_instrumento (id_categoria SERIAL PRIMARY KEY, nombre_categoria VARCHAR(80), descripcion TEXT);
CREATE TABLE IF NOT EXISTS instrumento (id_instrumento SERIAL PRIMARY KEY, nombre VARCHAR(80), id_categoria INTEGER, precio NUMERIC(10,2), activo BOOLEAN, codigo VARCHAR(20));
CREATE TABLE IF NOT EXISTS alumno (id_alumno SERIAL PRIMARY KEY, nombre VARCHAR(100), correo VARCHAR(120), edad INTEGER, fecha_alta DATE);
CREATE TABLE IF NOT EXISTS inscripcion (id_inscripcion SERIAL PRIMARY KEY, id_alumno INTEGER, id_instrumento INTEGER, fecha DATE);
INSERT INTO categoria_instrumento (nombre_categoria, descripcion) VALUES ('Cuerda', 'Guitarras y violines'), ('Teclado', 'Pianos y órganos'), ('Percusión', 'Baterías y tambores');
INSERT INTO instrumento (nombre, id_categoria, precio, activo, codigo) VALUES ('Guitarra acústica', 1, 3500.00, TRUE, 'GUI-001'), ('Piano digital', 2, 12000.00, TRUE, 'PIA-001'), ('Batería básica', 3, 8500.00, TRUE, 'BAT-001');
INSERT INTO alumno (nombre, correo, edad, fecha_alta) VALUES ('Ana Ruiz', 'ana@correo.com', 12, '2026-08-01'), ('Luis Pérez', 'luis@correo.com', 25, '2026-08-03');
INSERT INTO inscripcion (id_alumno, id_instrumento, fecha) VALUES (1, 1, '2026-08-05'), (2, 2, '2026-08-06');
UPDATE instrumento SET precio = 3800.00 WHERE codigo = 'GUI-001';
INSERT INTO instrumento (nombre, id_categoria, precio, activo, codigo) VALUES ('Prueba', 1, 1, FALSE, 'TMP-001');
DELETE FROM instrumento WHERE codigo = 'TMP-001';
SELECT i.nombre, c.nombre_categoria, i.precio FROM instrumento i JOIN categoria_instrumento c ON c.id_categoria = i.id_categoria ORDER BY i.id_instrumento`,
  },

  proyecto_43: {
    bd: 'davinci_music',
    titulo: '4.3 Proyecto: restricciones (ejecutar después de 4.2)',
    sql: `-- NOT NULL
ALTER TABLE categoria_instrumento ALTER COLUMN nombre_categoria SET NOT NULL;
ALTER TABLE instrumento ALTER COLUMN nombre SET NOT NULL;
ALTER TABLE instrumento ALTER COLUMN id_categoria SET NOT NULL;
ALTER TABLE alumno ALTER COLUMN nombre SET NOT NULL;
-- DEFAULT
ALTER TABLE instrumento ALTER COLUMN activo SET DEFAULT TRUE;
ALTER TABLE alumno ALTER COLUMN fecha_alta SET DEFAULT CURRENT_DATE;
-- UNIQUE
ALTER TABLE categoria_instrumento ADD CONSTRAINT uq_categoria_nombre UNIQUE (nombre_categoria);
ALTER TABLE instrumento ADD CONSTRAINT uq_instrumento_codigo UNIQUE (codigo);
ALTER TABLE alumno ADD CONSTRAINT uq_alumno_correo UNIQUE (correo);
ALTER TABLE inscripcion ADD CONSTRAINT uq_inscripcion UNIQUE (id_alumno, id_instrumento);
-- CHECK
ALTER TABLE instrumento ADD CONSTRAINT ck_instrumento_precio CHECK (precio >= 0);
ALTER TABLE alumno ADD CONSTRAINT ck_alumno_edad CHECK (edad BETWEEN 4 AND 99);
-- FOREIGN KEY
ALTER TABLE instrumento ADD CONSTRAINT fk_instrumento_categoria FOREIGN KEY (id_categoria) REFERENCES categoria_instrumento (id_categoria) ON DELETE RESTRICT;
ALTER TABLE inscripcion ADD CONSTRAINT fk_inscripcion_alumno FOREIGN KEY (id_alumno) REFERENCES alumno (id_alumno) ON DELETE CASCADE;
ALTER TABLE inscripcion ADD CONSTRAINT fk_inscripcion_instrumento FOREIGN KEY (id_instrumento) REFERENCES instrumento (id_instrumento);
-- INDEX
CREATE INDEX idx_instrumento_categoria ON instrumento (id_categoria);
CREATE INDEX idx_alumno_nombre ON alumno (nombre)`,
  },

  escuela: {
    bd: 'ejemplo_escuela',
    titulo: 'Ejemplo 1 (escuela): tablas, restricciones y registros',
    sql: `CREATE TABLE IF NOT EXISTS grupo (id_grupo SERIAL PRIMARY KEY, nombre VARCHAR(40) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS alumno (id_alumno SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, matricula VARCHAR(15) NOT NULL UNIQUE, promedio NUMERIC(4,2) DEFAULT 0 CHECK (promedio BETWEEN 0 AND 10), id_grupo INTEGER REFERENCES grupo (id_grupo));
CREATE INDEX IF NOT EXISTS idx_alumno_grupo ON alumno (id_grupo);
INSERT INTO grupo (nombre) VALUES ('1A'), ('1B');
INSERT INTO alumno (nombre, matricula, promedio, id_grupo) VALUES ('Ana Ruiz', 'A001', 9.5, 1), ('Luis Pérez', 'A002', 8.2, 2);
SELECT a.nombre, a.matricula, g.nombre AS grupo FROM alumno a JOIN grupo g ON g.id_grupo = a.id_grupo`,
  },

  tienda: {
    bd: 'ejemplo_tienda',
    titulo: 'Ejemplo 2 (tienda): tablas, restricciones y registros',
    sql: `CREATE TABLE IF NOT EXISTS cliente (id_cliente SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, correo VARCHAR(120) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS producto (id_producto SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, precio NUMERIC(10,2) NOT NULL CHECK (precio > 0), existencia INTEGER NOT NULL DEFAULT 0 CHECK (existencia >= 0));
CREATE TABLE IF NOT EXISTS venta (id_venta SERIAL PRIMARY KEY, id_cliente INTEGER NOT NULL REFERENCES cliente (id_cliente), id_producto INTEGER NOT NULL REFERENCES producto (id_producto), cantidad INTEGER NOT NULL CHECK (cantidad > 0), fecha DATE DEFAULT CURRENT_DATE);
CREATE INDEX IF NOT EXISTS idx_venta_cliente ON venta (id_cliente);
INSERT INTO cliente (nombre, correo) VALUES ('María López', 'maria@correo.com'), ('Jorge Díaz', 'jorge@correo.com');
INSERT INTO producto (nombre, precio, existencia) VALUES ('Cuerdas de guitarra', 150.00, 40), ('Metrónomo', 320.00, 15);
INSERT INTO venta (id_cliente, id_producto, cantidad) VALUES (1, 1, 2), (2, 2, 1);
SELECT c.nombre, p.nombre AS producto, v.cantidad FROM venta v JOIN cliente c ON c.id_cliente = v.id_cliente JOIN producto p ON p.id_producto = v.id_producto`,
  },

  biblioteca: {
    bd: 'ejemplo_biblioteca',
    titulo: 'Ejemplo 3 (biblioteca): tablas, restricciones y registros',
    sql: `CREATE TABLE IF NOT EXISTS autor (id_autor SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL);
CREATE TABLE IF NOT EXISTS libro (id_libro SERIAL PRIMARY KEY, isbn VARCHAR(20) NOT NULL UNIQUE, titulo VARCHAR(150) NOT NULL, anio INTEGER CHECK (anio BETWEEN 1400 AND 2100), disponible BOOLEAN NOT NULL DEFAULT TRUE, id_autor INTEGER NOT NULL REFERENCES autor (id_autor));
CREATE INDEX IF NOT EXISTS idx_libro_autor ON libro (id_autor);
INSERT INTO autor (nombre) VALUES ('Gabriel García Márquez'), ('Octavio Paz');
INSERT INTO libro (isbn, titulo, anio, id_autor) VALUES ('978-0-00-000001-1', 'Cien años de soledad', 1967, 1), ('978-0-00-000002-8', 'El laberinto de la soledad', 1950, 2);
SELECT l.titulo, a.nombre AS autor FROM libro l JOIN autor a ON a.id_autor = l.id_autor`,
  },
};