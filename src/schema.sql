-- ==========================================
-- DAVINCI MUSIC - schema.sql (PostgreSQL)
-- Convención: tablas y columnas en snake_case minúsculas
-- ==========================================

CREATE TABLE usuario (
    id                 SERIAL PRIMARY KEY,
    nombre_usuario     VARCHAR(100) NOT NULL UNIQUE,
    nombre             VARCHAR(100) NOT NULL,
    apellido_paterno   VARCHAR(100) NOT NULL,
    apellido_materno   VARCHAR(100),              -- opcional
    fecha_nacimiento   DATE NOT NULL,
    curp               VARCHAR(18) NOT NULL UNIQUE,
    ine                VARCHAR(20) UNIQUE,         -- opcional
    correo             VARCHAR(150) NOT NULL UNIQUE,
    telefono           VARCHAR(20),                -- opcional
    direccion          VARCHAR(255),               -- opcional
    contrasena_hash    VARCHAR(255) NOT NULL,
    activo             BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cliente (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL UNIQUE REFERENCES usuario(id),
    fecha_alta  DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE administrador (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INT NOT NULL UNIQUE REFERENCES usuario(id),
    fecha_contratacion  DATE NOT NULL
);

CREATE TABLE maestro (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INT NOT NULL UNIQUE REFERENCES usuario(id),
    especialidad        VARCHAR(100) NOT NULL,
    fecha_contratacion  DATE NOT NULL,
    activo              BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE periodo_academico (
    id              SERIAL PRIMARY KEY,
    nombre_periodo  VARCHAR(100) NOT NULL UNIQUE,
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE NOT NULL,
    estado          VARCHAR(30) NOT NULL
);

CREATE TABLE categoria_instrumento (
    id                SERIAL PRIMARY KEY,
    nombre_categoria  VARCHAR(100) NOT NULL UNIQUE,
    descripcion       VARCHAR(255)               -- opcional
);

CREATE TABLE instrumento (
    id                  SERIAL PRIMARY KEY,
    categoria_id        INT NOT NULL REFERENCES categoria_instrumento(id),
    nombre_instrumento  VARCHAR(100) NOT NULL,
    marca               VARCHAR(100),            -- opcional
    modelo              VARCHAR(100),            -- opcional
    tamano              VARCHAR(50),             -- opcional
    color               VARCHAR(50),             -- opcional
    precio_venta        DECIMAL(10,2) NOT NULL,
    stock_actual        INT NOT NULL DEFAULT 0,
    activo              BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE clase (
    id              SERIAL PRIMARY KEY,
    maestro_id      INT NOT NULL REFERENCES maestro(id),
    instrumento_id  INT NOT NULL REFERENCES instrumento(id),
    periodo_id      INT NOT NULL REFERENCES periodo_academico(id),
    nombre_clase    VARCHAR(100) NOT NULL,
    nivel           VARCHAR(30) NOT NULL,
    costo_mensual   DECIMAL(10,2) NOT NULL,
    cupo_maximo     INT NOT NULL,
    activa          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE horario_clase (
    id           SERIAL PRIMARY KEY,
    clase_id     INT NOT NULL REFERENCES clase(id),
    dia_semana   VARCHAR(20) NOT NULL,
    hora_inicio  TIME NOT NULL,
    hora_fin     TIME NOT NULL,
    salon        VARCHAR(50)                      -- opcional
);

CREATE TABLE inscripcion_clase (
    id                       SERIAL PRIMARY KEY,
    cliente_id               INT NOT NULL REFERENCES cliente(id),
    clase_id                 INT NOT NULL REFERENCES clase(id),
    fecha_inscripcion        DATE NOT NULL DEFAULT CURRENT_DATE,
    costo_mensual_acordado   DECIMAL(10,2) NOT NULL,
    estado_inscripcion       VARCHAR(30) NOT NULL DEFAULT 'Activa'
);

CREATE TABLE pago_clase (
    id                  SERIAL PRIMARY KEY,
    inscripcion_id      INT NOT NULL REFERENCES inscripcion_clase(id),
    periodo_pagado      DATE NOT NULL,
    importe             DECIMAL(10,2) NOT NULL,
    fecha_vencimiento   DATE NOT NULL,
    fecha_pago          TIMESTAMP,                 -- opcional: nulo mientras esté pendiente
    metodo_pago         VARCHAR(30),               -- opcional: se llena al pagar
    estado_pago         VARCHAR(30) NOT NULL DEFAULT 'Pendiente'
);

CREATE TABLE venta (
    id                SERIAL PRIMARY KEY,
    cliente_id        INT NOT NULL REFERENCES cliente(id),
    administrador_id  INT NOT NULL REFERENCES administrador(id),
    fecha_venta       TIMESTAMP NOT NULL DEFAULT NOW(),
    metodo_pago       VARCHAR(30) NOT NULL,
    estado_venta      VARCHAR(30) NOT NULL DEFAULT 'Completada'
);

CREATE TABLE detalle_venta (
    venta_id         INT NOT NULL REFERENCES venta(id),
    instrumento_id   INT NOT NULL REFERENCES instrumento(id),
    cantidad         INT NOT NULL,
    precio_unitario  DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (venta_id, instrumento_id)
);

CREATE TABLE proveedor (
    id                 SERIAL PRIMARY KEY,
    nombre_proveedor   VARCHAR(150) NOT NULL,
    rfc                VARCHAR(13) NOT NULL UNIQUE,
    correo             VARCHAR(150),               -- opcional
    direccion          VARCHAR(255),               -- opcional
    telefono           VARCHAR(20),                -- opcional
    activo             BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orden_abastecimiento (
    id                SERIAL PRIMARY KEY,
    proveedor_id      INT NOT NULL REFERENCES proveedor(id),
    administrador_id  INT NOT NULL REFERENCES administrador(id),
    fecha_orden       TIMESTAMP NOT NULL DEFAULT NOW(),
    estado_orden      VARCHAR(30) NOT NULL DEFAULT 'Pendiente'
);

CREATE TABLE detalle_orden (
    orden_id             INT NOT NULL REFERENCES orden_abastecimiento(id),
    instrumento_id       INT NOT NULL REFERENCES instrumento(id),
    cantidad_solicitada  INT NOT NULL,
    cantidad_recibida    INT NOT NULL DEFAULT 0,   -- 0 hasta que llegue mercancía
    costo_unitario       DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (orden_id, instrumento_id)
);
