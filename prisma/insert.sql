-- 1. Registrar un nuevo usuario
INSERT INTO usuario (nombre_usuario, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, curp, correo, contrasena_hash)
VALUES ('jgarcia', 'Juan', 'García', 'López', '2000-05-14', 'GALJ000514HDFXXX01', 'jgarcia@correo.com', 'hash123');

-- 2. Registrar el perfil de cliente para ese usuario
INSERT INTO cliente (id_usuario, fecha_alta)
VALUES (1, CURRENT_DATE);

-- 3. Registrar un nuevo maestro
INSERT INTO maestro (id_usuario, especialidad, fecha_contratacion, activo)
VALUES (2, 'Guitarra', '2026-01-15', true);

-- 4. Registrar un nuevo administrador
INSERT INTO administrador (id_usuario, fecha_contratacion)
VALUES (3, '2025-08-01');

-- 5. Agregar una nueva categoría de instrumento
INSERT INTO categoria_instrumento (nombre_categoria, descripcion)
VALUES ('Cuerdas', 'Instrumentos de cuerda como guitarra, violín y bajo');

-- 6. Agregar un nuevo instrumento al inventario
INSERT INTO instrumento (id_categoria, nombre_instrumento, marca, modelo, precio_venta, stock_actual)
VALUES (1, 'Guitarra acústica', 'Yamaha', 'F310', 3200.00, 15);

-- 7. Crear un nuevo periodo académico
INSERT INTO periodo_academico (nombre_periodo, fecha_inicio, fecha_fin, estado)
VALUES ('Primavera 2026', '2026-02-01', '2026-06-30', 'Activo');

-- 8. Crear una nueva clase
INSERT INTO clase (id_maestro, id_instrumento, id_periodo, nombre_clase, nivel, costo_mensual, cupo_maximo)
VALUES (1, 1, 1, 'Guitarra para principiantes', 'Principiante', 950.00, 12);

-- 9. Registrar un nuevo proveedor
INSERT INTO proveedor (nombre_proveedor, rfc, correo, telefono, activo)
VALUES ('Instrumentos del Norte S.A.', 'INO850101ABC', 'ventas@instnorte.com', '3312345678', true);