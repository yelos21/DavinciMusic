import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DIA_MS = 24 * 60 * 60 * 1000;
const haceDias = (n: number) => new Date(Date.now() - n * DIA_MS);

// Primer día del mes actual (desfase 0) o de otro mes (-1 = mes pasado)
function inicioDeMes(desfase: number): Date {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + desfase, 1));
}

// Los datos de demo se reconocen por el dominio @ejemplo.com
const CLIENTES = [
  { correo: "mariana.lopez@ejemplo.com", nombre: "Mariana", paterno: "López" },
  { correo: "carlos.perez@ejemplo.com", nombre: "Carlos", paterno: "Pérez" },
  { correo: "sofia.ruiz@ejemplo.com", nombre: "Sofía", paterno: "Ruiz" },
];

async function obtenerClientes(): Promise<number[]> {
  const ids: number[] = [];

  for (const c of CLIENTES) {
    let usuario = await prisma.usuario.findUnique({
      where: { correo: c.correo },
      include: { cliente: true },
    });

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombre: c.nombre,
          apellido_paterno: c.paterno,
          correo: c.correo,
          cliente: { create: {} },
        },
        include: { cliente: true },
      });
    }

    if (usuario.cliente) ids.push(usuario.cliente.id_cliente);
  }

  return ids;
}

async function abastecerDemo(idProveedor: number, idAdmin: number) {
  const yaHay = await prisma.ordenAbastecimiento.count({
    where: { id_proveedor: idProveedor },
  });
  if (yaHay > 0) {
    console.log("Órdenes de demo: ya existían, se omiten.");
    return;
  }

  const pedido: [string, number, number][] = [
    ["Guitarra acústica", 6, 2600],
    ["Bajo eléctrico", 4, 6200],
    ["Cajón flamenco", 5, 1500],
  ];

  await prisma.$transaction(async (tx) => {
    const lineas: {
      id_instrumento: number;
      cantidad_solicitada: number;
      cantidad_recibida: number;
      costo_unitario: number;
    }[] = [];

    for (const [nombre, cantidad, costo] of pedido) {
      const instrumento = await tx.instrumento.findFirst({
        where: { nombre_instrumento: nombre },
      });
      if (!instrumento) continue;

      // Orden ya recibida completa: el stock sube
      await tx.instrumento.update({
        where: { id_instrumento: instrumento.id_instrumento },
        data: { stock_actual: { increment: cantidad } },
      });
      lineas.push({
        id_instrumento: instrumento.id_instrumento,
        cantidad_solicitada: cantidad,
        cantidad_recibida: cantidad,
        costo_unitario: costo,
      });
    }

    if (lineas.length === 0) return;

    await tx.ordenAbastecimiento.create({
      data: {
        id_proveedor: idProveedor,
        id_administrador: idAdmin,
        fecha_orden: haceDias(10),
        estado_orden: "Recibida",
        detalles: { create: lineas },
      },
    });
  });

  console.log("Orden de abastecimiento de demo creada (recibida).");
}

async function venderDemo(clientes: number[], idAdmin: number) {
  const yaHay = await prisma.venta.count({
    where: { cliente: { usuario: { correo: { endsWith: "@ejemplo.com" } } } },
  });
  if (yaHay > 0) {
    console.log("Ventas de demo: ya existían, se omiten.");
    return;
  }

  const plan = [
    { cliente: 0, dias: 6, pago: "Efectivo", lineas: [["Guitarra acústica", 1], ["Juego de cuerdas acústicas", 2]] },
    { cliente: 1, dias: 4, pago: "Tarjeta", lineas: [["Teclado 61 teclas", 1]] },
    { cliente: 2, dias: 2, pago: "Transferencia", lineas: [["Micrófono dinámico", 1], ["Juego de cuerdas acústicas", 1]] },
    { cliente: 0, dias: 0, pago: "Tarjeta", lineas: [["Guitarra eléctrica Stratocaster", 1]] },
  ] as const;

  for (const v of plan) {
    await prisma.$transaction(async (tx) => {
      const lineas: { id_instrumento: number; cantidad: number; precio_unitario: number }[] = [];

      for (const [nombre, cantidad] of v.lineas) {
        const instrumento = await tx.instrumento.findFirst({
          where: { nombre_instrumento: nombre },
        });
        // Si no hay stock suficiente, esa línea se salta
        if (!instrumento || instrumento.stock_actual < cantidad) continue;

        await tx.instrumento.update({
          where: { id_instrumento: instrumento.id_instrumento },
          data: { stock_actual: { decrement: cantidad } },
        });
        lineas.push({
          id_instrumento: instrumento.id_instrumento,
          cantidad,
          precio_unitario: Number(instrumento.precio_venta),
        });
      }

      if (lineas.length === 0) return;

      await tx.venta.create({
        data: {
          id_cliente: clientes[v.cliente],
          id_administrador: idAdmin,
          fecha_venta: haceDias(v.dias),
          metodo_pago: v.pago,
          detalles: { create: lineas },
        },
      });
    });
  }

  console.log("Ventas de demo creadas (una es de hoy, para el dashboard).");
}

async function inscribirDemo(clientes: number[]) {
  const yaHay = await prisma.inscripcionClase.count({
    where: { cliente: { usuario: { correo: { endsWith: "@ejemplo.com" } } } },
  });
  if (yaHay > 0) {
    console.log("Inscripciones de demo: ya existían, se omiten.");
    return;
  }

  const plan = [
    { cliente: 0, clase: "Guitarra para principiantes", estado: "corriente" },
    { cliente: 1, clase: "Piano inicial", estado: "pendiente" },
    { cliente: 2, clase: "Batería desde cero", estado: "vencido" },
    { cliente: 0, clase: "Teclado para niños", estado: "corriente" },
  ] as const;

  const mesPasado = inicioDeMes(-1);
  const mesActual = inicioDeMes(0);
  const vence = (mes: Date) =>
    new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(), 5));

  for (const p of plan) {
    const clase = await prisma.clase.findFirst({
      where: { nombre_clase: p.clase, activa: true },
    });
    if (!clase) continue;

    const ocupados = await prisma.inscripcionClase.count({
      where: { id_clase: clase.id_clase, estado_inscripcion: "Activa" },
    });
    if (ocupados >= clase.cupo_maximo) continue;

    const costo = Number(clase.costo_mensual);

    const pagos =
      p.estado === "corriente"
        ? [
            { periodo_pagado: mesPasado, importe: costo, fecha_vencimiento: vence(mesPasado), estado_pago: "Pagado", fecha_pago: haceDias(20), metodo_pago: "Efectivo" },
            { periodo_pagado: mesActual, importe: costo, fecha_vencimiento: vence(mesActual), estado_pago: "Pagado", fecha_pago: haceDias(3), metodo_pago: "Transferencia" },
          ]
        : p.estado === "pendiente"
          ? [{ periodo_pagado: mesActual, importe: costo, fecha_vencimiento: new Date(Date.now() + 5 * DIA_MS) }]
          : [{ periodo_pagado: mesPasado, importe: costo, fecha_vencimiento: haceDias(8) }];

    await prisma.inscripcionClase.create({
      data: {
        id_cliente: clientes[p.cliente],
        id_clase: clase.id_clase,
        costo_mensual_acordado: costo,
        pagos: { create: pagos },
      },
    });
  }

  console.log("Inscripciones de demo creadas (al corriente, pendiente y vencida).");
}

async function main() {
  const admin = await prisma.administrador.findFirst();
  const clientes = await obtenerClientes();

  const proveedor = await prisma.proveedor.upsert({
    where: { rfc: "XAXX010101000" },
    update: {},
    create: {
      nombre_proveedor: "Distribuidora Musical Demo",
      rfc: "XAXX010101000",
      correo: "ventas@ejemplo.com",
      telefono: "33 0000 0000",
    },
  });

  if (admin) {
    await abastecerDemo(proveedor.id_proveedor, admin.id_administrador);
    await venderDemo(clientes, admin.id_administrador);
  } else {
    console.log("No hay ningún administrador: se omiten ventas y órdenes.");
  }

  await inscribirDemo(clientes);
  console.log("Datos de demo listos.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });