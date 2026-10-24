/*
  Warnings:

  - You are about to drop the `Instrumento` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Instrumento";

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido_paterno" TEXT NOT NULL,
    "apellido_materno" TEXT,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,
    "curp" TEXT NOT NULL,
    "ine" TEXT,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "contrasena_hash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id_cliente" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "administrador" (
    "id_administrador" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha_contratacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administrador_pkey" PRIMARY KEY ("id_administrador")
);

-- CreateTable
CREATE TABLE "maestro" (
    "id_maestro" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "especialidad" TEXT NOT NULL,
    "fecha_contratacion" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "maestro_pkey" PRIMARY KEY ("id_maestro")
);

-- CreateTable
CREATE TABLE "periodo_academico" (
    "id_periodo" SERIAL NOT NULL,
    "nombre_periodo" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "periodo_academico_pkey" PRIMARY KEY ("id_periodo")
);

-- CreateTable
CREATE TABLE "categoria_instrumento" (
    "id_categoria" SERIAL NOT NULL,
    "nombre_categoria" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categoria_instrumento_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "instrumento" (
    "id_instrumento" SERIAL NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "nombre_instrumento" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "tamano" TEXT,
    "color" TEXT,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "instrumento_pkey" PRIMARY KEY ("id_instrumento")
);

-- CreateTable
CREATE TABLE "clase" (
    "id_clase" SERIAL NOT NULL,
    "id_maestro" INTEGER NOT NULL,
    "id_instrumento" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "nombre_clase" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "costo_mensual" DECIMAL(10,2) NOT NULL,
    "cupo_maximo" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clase_pkey" PRIMARY KEY ("id_clase")
);

-- CreateTable
CREATE TABLE "horario_clase" (
    "id_horario" SERIAL NOT NULL,
    "id_clase" INTEGER NOT NULL,
    "dia_semana" TEXT NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "salon" TEXT,

    CONSTRAINT "horario_clase_pkey" PRIMARY KEY ("id_horario")
);

-- CreateTable
CREATE TABLE "inscripcion_clase" (
    "id_inscripcion" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_clase" INTEGER NOT NULL,
    "fecha_inscripcion" TIME NOT NULL,
    "costo_mensual_acordado" DECIMAL(10,2) NOT NULL,
    "estado_inscripcion" TEXT NOT NULL DEFAULT 'Activa',

    CONSTRAINT "inscripcion_clase_pkey" PRIMARY KEY ("id_inscripcion")
);

-- CreateTable
CREATE TABLE "pago_clase" (
    "id_pago_clase" SERIAL NOT NULL,
    "id_inscripcion" INTEGER NOT NULL,
    "periodo_pagado" TIME NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3),
    "metodo_pago" TEXT,
    "estado_pago" TEXT NOT NULL DEFAULT 'Pendiente',

    CONSTRAINT "pago_clase_pkey" PRIMARY KEY ("id_pago_clase")
);

-- CreateTable
CREATE TABLE "venta" (
    "id_venta" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_administrador" INTEGER NOT NULL,
    "fecha_venta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo_pago" TEXT NOT NULL,
    "estado_venta" TEXT NOT NULL DEFAULT 'Completada',

    CONSTRAINT "venta_pkey" PRIMARY KEY ("id_venta")
);

-- CreateTable
CREATE TABLE "detalle_venta" (
    "id_venta" INTEGER NOT NULL,
    "id_instrumento" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("id_venta","id_instrumento")
);

-- CreateTable
CREATE TABLE "proveedor" (
    "id_proovedor" SERIAL NOT NULL,
    "nombre_proveedor" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("id_proovedor")
);

-- CreateTable
CREATE TABLE "orden_abastecimiento" (
    "id_orden" SERIAL NOT NULL,
    "id_proovedor" INTEGER NOT NULL,
    "id_administrador" INTEGER NOT NULL,
    "fecha_orden" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_orden" TEXT NOT NULL DEFAULT 'Pendiente',

    CONSTRAINT "orden_abastecimiento_pkey" PRIMARY KEY ("id_orden")
);

-- CreateTable
CREATE TABLE "detalles_orden" (
    "id_orden" INTEGER NOT NULL,
    "id_instrumento" INTEGER NOT NULL,
    "cantidad_solicitada" INTEGER NOT NULL,
    "cantidad_recibida" INTEGER NOT NULL DEFAULT 0,
    "costo_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalles_orden_pkey" PRIMARY KEY ("id_orden","id_instrumento")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_nombre_usuario_key" ON "usuario"("nombre_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_curp_key" ON "usuario"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_ine_key" ON "usuario"("ine");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_id_usuario_key" ON "cliente"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "administrador_id_usuario_key" ON "administrador"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "maestro_id_usuario_key" ON "maestro"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "periodo_academico_nombre_periodo_key" ON "periodo_academico"("nombre_periodo");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_instrumento_nombre_categoria_key" ON "categoria_instrumento"("nombre_categoria");

-- CreateIndex
CREATE UNIQUE INDEX "proveedor_rfc_key" ON "proveedor"("rfc");

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrador" ADD CONSTRAINT "administrador_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maestro" ADD CONSTRAINT "maestro_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instrumento" ADD CONSTRAINT "instrumento_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria_instrumento"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clase" ADD CONSTRAINT "clase_id_maestro_fkey" FOREIGN KEY ("id_maestro") REFERENCES "maestro"("id_maestro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clase" ADD CONSTRAINT "clase_id_instrumento_fkey" FOREIGN KEY ("id_instrumento") REFERENCES "instrumento"("id_instrumento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clase" ADD CONSTRAINT "clase_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "periodo_academico"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_clase" ADD CONSTRAINT "horario_clase_id_clase_fkey" FOREIGN KEY ("id_clase") REFERENCES "clase"("id_clase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion_clase" ADD CONSTRAINT "inscripcion_clase_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion_clase" ADD CONSTRAINT "inscripcion_clase_id_clase_fkey" FOREIGN KEY ("id_clase") REFERENCES "clase"("id_clase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_clase" ADD CONSTRAINT "pago_clase_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripcion_clase"("id_inscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_id_administrador_fkey" FOREIGN KEY ("id_administrador") REFERENCES "administrador"("id_administrador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "venta"("id_venta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_id_instrumento_fkey" FOREIGN KEY ("id_instrumento") REFERENCES "instrumento"("id_instrumento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_abastecimiento" ADD CONSTRAINT "orden_abastecimiento_id_proovedor_fkey" FOREIGN KEY ("id_proovedor") REFERENCES "proveedor"("id_proovedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_abastecimiento" ADD CONSTRAINT "orden_abastecimiento_id_administrador_fkey" FOREIGN KEY ("id_administrador") REFERENCES "administrador"("id_administrador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_orden" ADD CONSTRAINT "detalles_orden_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "orden_abastecimiento"("id_orden") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_orden" ADD CONSTRAINT "detalles_orden_id_instrumento_fkey" FOREIGN KEY ("id_instrumento") REFERENCES "instrumento"("id_instrumento") ON DELETE RESTRICT ON UPDATE CASCADE;
