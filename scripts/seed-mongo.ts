import "dotenv/config";
import mongoose from "mongoose";
import { conectarMongo } from "../src/lib/mongo";
import {
  Clase,
  Inscripcion,
  Instrumento,
  Mensaje,
  Orden,
  Periodo,
  Proveedor,
  Usuario,
  Venta,
  dinero,
} from "../src/models";

const categorias: Record<string, string> = {
  "Guitarras y bajos": "Acústicas, eléctricas y bajos",
  "Teclados y pianos": "Teclados, pianos digitales y sintetizadores",
  "Batería y percusión": "Baterías, cajones y accesorios",
  "Audio y accesorios": "Bocinas, micrófonos, cuerdas y fundas",
};

const instrumentos = [
  { categoria: "Guitarras y bajos", nombre: "Guitarra acústica", marca: "Yamaha", modelo: "F310", tamano: "4/4", color: "Natural", precio: 3899, stock: 8, imagen: "/instrumentos/guitarra-acustica.jpg" },
  { categoria: "Guitarras y bajos", nombre: "Guitarra eléctrica Stratocaster", marca: "Squier", modelo: "Affinity", tamano: "4/4", color: "Sunburst", precio: 7499, stock: 5, imagen: "/instrumentos/guitarra-electrica.jpg" },
  { categoria: "Guitarras y bajos", nombre: "Guitarra clásica", marca: "Cordoba", modelo: "C5", tamano: "4/4", color: "Caoba", precio: 5299, stock: 2, imagen: "/instrumentos/guitarra-clasica.jpg" },
  { categoria: "Guitarras y bajos", nombre: "Bajo eléctrico", marca: "Ibanez", modelo: "GSR200", tamano: "4 cuerdas", color: "Negro", precio: 8999, stock: 3, imagen: "/instrumentos/bajo-electrico.jpg" },
  { categoria: "Teclados y pianos", nombre: "Teclado 61 teclas", marca: "Casio", modelo: "CT-S200", tamano: "61 teclas", color: "Negro", precio: 3299, stock: 10, imagen: "/instrumentos/teclado-61.jpg" },
  { categoria: "Teclados y pianos", nombre: "Piano digital", marca: "Yamaha", modelo: "P-45", tamano: "88 teclas", color: "Negro", precio: 12999, stock: 1, imagen: "/instrumentos/piano-digital.jpg" },
  { categoria: "Batería y percusión", nombre: "Batería acústica 5 piezas", marca: "Pearl", modelo: "Roadshow", tamano: "5 piezas", color: "Rojo", precio: 16999, stock: 2, imagen: "/instrumentos/bateria-acustica.jpg" },
  { categoria: "Batería y percusión", nombre: "Cajón flamenco", marca: "Meinl", modelo: "Jumbo", tamano: "Estándar", color: "Madera", precio: 2499, stock: 0, imagen: "/instrumentos/cajon-flamenco.jpg" },
  { categoria: "Audio y accesorios", nombre: "Micrófono dinámico", marca: "Shure", modelo: "SM58", tamano: "Estándar", color: "Plata", precio: 2899, stock: 12, imagen: "/instrumentos/microfono-dinamico.jpg" },
  { categoria: "Audio y accesorios", nombre: "Juego de cuerdas acústicas", marca: "D'Addario", modelo: "EJ16", tamano: "012-053", color: "Bronce", precio: 289, stock: 40, imagen: "/instrumentos/cuerdas-acusticas.jpg" },
];

const personas = [
  { correo: "maestro.guitarra@ejemplo.com", nombre: "Ana", paterno: "Ramírez", rol: "maestro", perfil: { especialidad: "Guitarra", fecha_contratacion: new Date("2024-01-15") } },
  { correo: "maestro.piano@ejemplo.com", nombre: "Luis", paterno: "Hernández", rol: "maestro", perfil: { especialidad: "Piano", fecha_contratacion: new Date("2023-08-01") } },
  { correo: "maestro.bateria@ejemplo.com", nombre: "Carla", paterno: "Soto", rol: "maestro", perfil: { especialidad: "Batería", fecha_contratacion: new Date("2025-02-10") } },
  { correo: "admin@ejemplo.com", nombre: "Diego", paterno: "Núñez", rol: "administrador", perfil: { fecha_contratacion: new Date("2022-06-01"), turno: "Matutino" } },
  { correo: "cliente.maria@ejemplo.com", nombre: "María", paterno: "López", rol: "cliente", perfil: { fecha_alta: new Date("2026-08-20"), telefono_emergencia: "555-123-4567" } },
  { correo: "cliente.jorge@ejemplo.com", nombre: "Jorge", paterno: "Pérez", rol: "cliente", perfil: { fecha_alta: new Date("2026-08-22"), telefono_emergencia: "555-987-6543" } },
  { correo: "cliente.sofia@ejemplo.com", nombre: "Sofía", paterno: "Torres", rol: "cliente", perfil: { fecha_alta: new Date("2026-09-01"), telefono_emergencia: "555-555-1212" } },
];

// horarios: [día, inicio, fin, salón]
const clases = [
  { nombre: "Guitarra para principiantes", nivel: "Principiante", maestro: "maestro.guitarra@ejemplo.com", instrumento: "Guitarra acústica", costo: 800, cupo: 8,
    horarios: [["Lunes", "16:00", "17:00", "Salón 1"], ["Miércoles", "16:00", "17:00", "Salón 1"]] },
  { nombre: "Guitarra eléctrica intermedio", nivel: "Intermedio", maestro: "maestro.guitarra@ejemplo.com", instrumento: "Guitarra eléctrica Stratocaster", costo: 950, cupo: 6,
    horarios: [["Martes", "18:00", "19:30", "Salón 2"]] },
  { nombre: "Piano inicial", nivel: "Principiante", maestro: "maestro.piano@ejemplo.com", instrumento: "Piano digital", costo: 900, cupo: 5,
    horarios: [["Martes", "16:00", "17:00", "Salón 3"], ["Jueves", "16:00", "17:00", "Salón 3"]] },
  { nombre: "Teclado para niños", nivel: "Principiante", maestro: "maestro.piano@ejemplo.com", instrumento: "Teclado 61 teclas", costo: 750, cupo: 10,
    horarios: [["Sábado", "10:00", "11:00", "Salón 3"]] },
  { nombre: "Batería desde cero", nivel: "Principiante", maestro: "maestro.bateria@ejemplo.com", instrumento: "Batería acústica 5 piezas", costo: 1000, cupo: 4,
    horarios: [["Viernes", "17:00", "18:30", "Salón 4"]] },
];

async function main() {
  await conectarMongo();

  // Empezamos de cero para que el seed sea repetible.
  await Promise.all([
    Usuario.deleteMany({}),
    Instrumento.deleteMany({}),
    Periodo.deleteMany({}),
    Clase.deleteMany({}),
    Inscripcion.deleteMany({}),
    Venta.deleteMany({}),
    Proveedor.deleteMany({}),
    Orden.deleteMany({}),
    Mensaje.deleteMany({}),
  ]);

  // Crea colecciones e índices aunque todavía no haya documentos.
  await mongoose.syncIndexes();

  // 1. Personas (cliente / maestro / administrador en una sola colección)
  const usuarios = [];
  for (const p of personas) {
    usuarios.push(
      await Usuario.create({
        nombre: p.nombre,
        apellido_paterno: p.paterno,
        correo: p.correo,
        rol: p.rol,
        perfil: p.perfil,
      }),
    );
  }
  const idUsuario = new Map(usuarios.map((u) => [u.correo, u._id]));

  // 2. Instrumentos con la categoría embebida
  const instrumentosCreados = [];
  for (const i of instrumentos) {
    instrumentosCreados.push(
      await Instrumento.create({
        nombre_instrumento: i.nombre,
        marca: i.marca,
        modelo: i.modelo,
        tamano: i.tamano,
        color: i.color,
        categoria: { nombre: i.categoria, descripcion: categorias[i.categoria] },
        precio_venta: dinero(i.precio),
        stock_actual: i.stock,
        imagen_url: i.imagen,
      }),
    );
  }
  const idInstrumento = new Map(
    instrumentosCreados.map((i) => [i.nombre_instrumento, i._id]),
  );

  // 3. Periodo académico
  const periodo = await Periodo.create({
    nombre_periodo: "Otoño 2026",
    fecha_inicio: new Date("2026-08-24"),
    fecha_fin: new Date("2026-12-18"),
    estado: "Activo",
  });

  // 4. Clases con horarios embebidos
  const clasesCreadas = [];
  for (const c of clases) {
    clasesCreadas.push(
      await Clase.create({
        nombre_clase: c.nombre,
        nivel: c.nivel,
        maestro: idUsuario.get(c.maestro),
        instrumento: idInstrumento.get(c.instrumento),
        periodo: periodo._id,
        costo_mensual: dinero(c.costo),
        cupo_maximo: c.cupo,
        horarios: c.horarios.map(([dia, inicio, fin, salon]) => ({
          dia_semana: dia,
          hora_inicio: inicio,
          hora_fin: fin,
          salon,
        })),
      }),
    );
  }
  const idClase = new Map(clasesCreadas.map((c) => [c.nombre_clase, c._id]));

  // 5. Inscripciones con sus pagos embebidos
  await Inscripcion.create([
    {
      cliente: idUsuario.get("cliente.maria@ejemplo.com"),
      clase: idClase.get("Guitarra para principiantes"),
      fecha_inscripcion: new Date("2026-08-21"),
      costo_mensual_acordado: dinero(800),
      estado_inscripcion: "Activa",
      pagos: [
        {
          periodo_pagado: new Date("2026-10-01"),
          importe: dinero(800),
          fecha_vencimiento: new Date("2026-10-05"),
          fecha_pago: new Date("2026-10-03"),
          metodo_pago: "Transferencia",
          estado_pago: "Pagado",
        },
        {
          periodo_pagado: new Date("2026-11-01"),
          importe: dinero(800),
          fecha_vencimiento: new Date("2026-11-05"),
          estado_pago: "Pendiente",
        },
      ],
    },
    {
      cliente: idUsuario.get("cliente.jorge@ejemplo.com"),
      clase: idClase.get("Piano inicial"),
      fecha_inscripcion: new Date("2026-08-23"),
      costo_mensual_acordado: dinero(900),
      estado_inscripcion: "Activa",
      pagos: [
        {
          periodo_pagado: new Date("2026-10-01"),
          importe: dinero(900),
          fecha_vencimiento: new Date("2026-10-05"),
          fecha_pago: new Date("2026-10-04"),
          metodo_pago: "Efectivo",
          estado_pago: "Pagado",
        },
      ],
    },
    {
      cliente: idUsuario.get("cliente.sofia@ejemplo.com"),
      clase: idClase.get("Batería desde cero"),
      fecha_inscripcion: new Date("2026-09-02"),
      costo_mensual_acordado: dinero(1000),
      estado_inscripcion: "Activa",
      pagos: [
        {
          periodo_pagado: new Date("2026-11-01"),
          importe: dinero(1000),
          fecha_vencimiento: new Date("2026-11-05"),
          estado_pago: "Pendiente",
        },
      ],
    },
  ]);

  // 6. Ventas con detalle embebido (precio histórico congelado)
  await Venta.create([
    {
      cliente: idUsuario.get("cliente.maria@ejemplo.com"),
      administrador: idUsuario.get("admin@ejemplo.com"),
      fecha_venta: new Date("2026-09-10"),
      metodo_pago: "Tarjeta",
      estado_venta: "Completada",
      detalles: [
        {
          instrumento: idInstrumento.get("Guitarra acústica"),
          nombre_instrumento: "Guitarra acústica",
          cantidad: 1,
          precio_unitario: dinero(3899),
        },
        {
          instrumento: idInstrumento.get("Juego de cuerdas acústicas"),
          nombre_instrumento: "Juego de cuerdas acústicas",
          cantidad: 2,
          precio_unitario: dinero(289),
        },
      ],
    },
    {
      cliente: idUsuario.get("cliente.jorge@ejemplo.com"),
      administrador: idUsuario.get("admin@ejemplo.com"),
      fecha_venta: new Date("2026-10-02"),
      metodo_pago: "Efectivo",
      estado_venta: "Completada",
      detalles: [
        {
          instrumento: idInstrumento.get("Micrófono dinámico"),
          nombre_instrumento: "Micrófono dinámico",
          cantidad: 1,
          precio_unitario: dinero(2899),
        },
      ],
    },
  ]);

  // 7. Proveedores y órdenes de abastecimiento
  const proveedores = await Proveedor.create([
    {
      nombre_proveedor: "Instrumentos del Norte",
      rfc: "INO950101AB1",
      correo: "ventas@instrumentosdelnorte.mx",
      direccion: "Av. Industrial 120, Monterrey, NL",
      telefono: "818-123-4567",
    },
    {
      nombre_proveedor: "Audio Pro MX",
      rfc: "APM010203CD4",
      correo: "contacto@audiopromx.com",
      direccion: "Calle 5 de Mayo 45, CDMX",
      telefono: "555-321-9876",
    },
  ]);

  await Orden.create([
    {
      proveedor: proveedores[0]._id,
      administrador: idUsuario.get("admin@ejemplo.com"),
      fecha_orden: new Date("2026-10-05"),
      estado_orden: "Pendiente",
      detalles: [
        {
          instrumento: idInstrumento.get("Guitarra acústica"),
          nombre_instrumento: "Guitarra acústica",
          cantidad_solicitada: 10,
          costo_unitario: dinero(2400),
        },
        {
          instrumento: idInstrumento.get("Teclado 61 teclas"),
          nombre_instrumento: "Teclado 61 teclas",
          cantidad_solicitada: 5,
          costo_unitario: dinero(2100),
        },
      ],
    },
    {
      proveedor: proveedores[1]._id,
      administrador: idUsuario.get("admin@ejemplo.com"),
      fecha_orden: new Date("2026-09-20"),
      estado_orden: "Recibida",
      detalles: [
        {
          instrumento: idInstrumento.get("Micrófono dinámico"),
          nombre_instrumento: "Micrófono dinámico",
          cantidad_solicitada: 20,
          cantidad_recibida: 20,
          costo_unitario: dinero(1800),
        },
      ],
    },
  ]);

  // 8. Mensajes del formulario de contacto
  await Mensaje.create([
    {
      nombre: "Laura Méndez",
      correo: "laura@ejemplo.com",
      telefono: "555-111-2222",
      asunto: "Informes de clases de piano",
      mensaje: "Buen día, quisiera saber si hay lugares en piano inicial.",
      fecha_envio: new Date("2026-11-01T10:15:00"),
    },
    {
      nombre: "Ricardo Salas",
      correo: "ricardo@ejemplo.com",
      asunto: "Precio de guitarra eléctrica",
      mensaje: "¿La Stratocaster sigue disponible?",
      leido: true,
      fecha_envio: new Date("2026-11-03T17:40:00"),
    },
  ]);

  const resumen = {
    usuarios: await Usuario.countDocuments(),
    instrumentos: await Instrumento.countDocuments(),
    periodos: await Periodo.countDocuments(),
    clases: await Clase.countDocuments(),
    inscripciones: await Inscripcion.countDocuments(),
    ventas: await Venta.countDocuments(),
    proveedores: await Proveedor.countDocuments(),
    ordenes: await Orden.countDocuments(),
    mensajes: await Mensaje.countDocuments(),
  };

  console.log("Seed de MongoDB listo:", resumen);
}

main()
  .catch((error) => {
    console.error("Error en el seed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
