import type { PrismaClient } from "../src/generated/prisma/client";

const maestros = [
  { correo: "maestro.guitarra@ejemplo.com", nombre: "Ana", paterno: "Ramírez", especialidad: "Guitarra" },
  { correo: "maestro.piano@ejemplo.com", nombre: "Luis", paterno: "Hernández", especialidad: "Piano" },
  { correo: "maestro.bateria@ejemplo.com", nombre: "Carla", paterno: "Soto", especialidad: "Batería" },
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

const toHora = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00Z`);

export async function seedEscuela(prisma: PrismaClient) {
  // 1. Periodo académico
  const periodo = await prisma.periodoAcademico.upsert({
    where: { nombre_periodo: "Otoño 2026" },
    update: {},
    create: {
      nombre_periodo: "Otoño 2026",
      fecha_inicio: new Date("2026-08-24"),
      fecha_fin: new Date("2026-12-18"),
      estado: "Activo",
    },
  });

  // 2. Maestros (usuario + rol), sin duplicar
  for (const m of maestros) {
    const existe = await prisma.usuario.findUnique({ where: { correo: m.correo } });
    if (existe) continue;

    await prisma.usuario.create({
      data: {
        nombre: m.nombre,
        apellido_paterno: m.paterno,
        correo: m.correo,
        maestro: {
          create: { especialidad: m.especialidad, fecha_contratacion: new Date() },
        },
      },
    });
  }

  for (const c of clases) {
    const maestro = await prisma.maestro.findFirst({ where: { usuario: { correo: c.maestro } } });
    const instrumento = await prisma.instrumento.findFirst({ where: { nombre_instrumento: c.instrumento } });
    if (!maestro || !instrumento) continue;

    const existe = await prisma.clase.findFirst({
      where: { nombre_clase: c.nombre, id_periodo: periodo.id_periodo },
    });
    if (existe) continue;

    await prisma.clase.create({
      data: {
        id_maestro: maestro.id_maestro,
        id_instrumento: instrumento.id_instrumento,
        id_periodo: periodo.id_periodo,
        nombre_clase: c.nombre,
        nivel: c.nivel,
        costo_mensual: c.costo,
        cupo_maximo: c.cupo,
        horarios: {
          create: c.horarios.map(([dia, inicio, fin, salon]) => ({
            dia_semana: dia,
            hora_inicio: toHora(inicio),
            hora_fin: toHora(fin),
            salon,
          })),
        },
      },
    });
  }

  console.log(`Seed de escuela listo (${maestros.length} maestros, ${clases.length} clases)`);
}