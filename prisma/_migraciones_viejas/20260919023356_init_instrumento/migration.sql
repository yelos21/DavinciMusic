-- CreateTable
CREATE TABLE "Instrumento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "categoria" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "disponibleRenta" BOOLEAN NOT NULL DEFAULT false,
    "precioRenta" DECIMAL(10,2),
    "descripcion" TEXT,
    "imagenUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instrumento_pkey" PRIMARY KEY ("id")
);
