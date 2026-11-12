-- CreateTable
CREATE TABLE "carrito_item" (
    "id_cliente" INTEGER NOT NULL,
    "id_instrumento" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha_agregado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrito_item_pkey" PRIMARY KEY ("id_cliente","id_instrumento")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id_pedido" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "fecha_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_pedido" TEXT NOT NULL DEFAULT 'Pendiente',
    "metodo_pago" TEXT NOT NULL,
    "direccion_envio" TEXT NOT NULL,
    "telefono_contacto" TEXT NOT NULL,
    "stripe_session_id" TEXT,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "detalle_pedido" (
    "id_pedido" INTEGER NOT NULL,
    "id_instrumento" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalle_pedido_pkey" PRIMARY KEY ("id_pedido","id_instrumento")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedido_stripe_session_id_key" ON "pedido"("stripe_session_id");

-- AddForeignKey
ALTER TABLE "carrito_item" ADD CONSTRAINT "carrito_item_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrito_item" ADD CONSTRAINT "carrito_item_id_instrumento_fkey" FOREIGN KEY ("id_instrumento") REFERENCES "instrumento"("id_instrumento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_instrumento_fkey" FOREIGN KEY ("id_instrumento") REFERENCES "instrumento"("id_instrumento") ON DELETE RESTRICT ON UPDATE CASCADE;
