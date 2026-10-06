import type { PrismaClient } from "../src/generated/prisma/client";

// Datos de EJEMPLO para el prototipo (precios en MXN)
const categorias = [
  { nombre_categoria: "Guitarras y bajos", descripcion: "Acústicas, eléctricas y bajos" },
  { nombre_categoria: "Teclados y pianos", descripcion: "Teclados, pianos digitales y sintetizadores" },
  { nombre_categoria: "Batería y percusión", descripcion: "Baterías, cajones y accesorios" },
  { nombre_categoria: "Audio y accesorios", descripcion: "Bocinas, micrófonos, cuerdas y fundas" },
];

const instrumentos = [
  { categoria: "Guitarras y bajos", nombre: "Guitarra acústica", marca: "Yamaha", modelo: "F310", tamano: "4/4", color: "Natural", precio: 3899, stock: 8 },
  { categoria: "Guitarras y bajos", nombre: "Guitarra eléctrica Stratocaster", marca: "Squier", modelo: "Affinity", tamano: "4/4", color: "Sunburst", precio: 7499, stock: 5 },
  { categoria: "Guitarras y bajos", nombre: "Guitarra clásica", marca: "Cordoba", modelo: "C5", tamano: "4/4", color: "Caoba", precio: 5299, stock: 2 },
  { categoria: "Guitarras y bajos", nombre: "Bajo eléctrico", marca: "Ibanez", modelo: "GSR200", tamano: "4 cuerdas", color: "Negro", precio: 8999, stock: 3 },
  { categoria: "Teclados y pianos", nombre: "Teclado 61 teclas", marca: "Casio", modelo: "CT-S200", tamano: "61 teclas", color: "Negro", precio: 3299, stock: 10 },
  { categoria: "Teclados y pianos", nombre: "Piano digital", marca: "Yamaha", modelo: "P-45", tamano: "88 teclas", color: "Negro", precio: 12999, stock: 1 },
  { categoria: "Batería y percusión", nombre: "Batería acústica 5 piezas", marca: "Pearl", modelo: "Roadshow", tamano: "5 piezas", color: "Rojo", precio: 16999, stock: 2 },
  { categoria: "Batería y percusión", nombre: "Cajón flamenco", marca: "Meinl", modelo: "Jumbo", tamano: "Estándar", color: "Madera", precio: 2499, stock: 0 },
  { categoria: "Audio y accesorios", nombre: "Micrófono dinámico", marca: "Shure", modelo: "SM58", tamano: "Estándar", color: "Plata", precio: 2899, stock: 12 },
  { categoria: "Audio y accesorios", nombre: "Juego de cuerdas acústicas", marca: "D'Addario", modelo: "EJ16", tamano: "012-053", color: "Bronce", precio: 289, stock: 40 },
];

export async function seedInstrumentos(prisma: PrismaClient) {
  // 1. Categorías (si ya existen, solo las actualiza)
  const ids = new Map<string, number>();
  for (const cat of categorias) {
    const c = await prisma.categoriaInstrumento.upsert({
      where: { nombre_categoria: cat.nombre_categoria },
      update: {},
      create: cat,
    });
    ids.set(c.nombre_categoria, c.id_categoria);
  }

  // 2. Instrumentos (si ya existe uno con el mismo nombre, lo salta)
  for (const i of instrumentos) {
    const existe = await prisma.instrumento.findFirst({
      where: { nombre_instrumento: i.nombre, marca: i.marca },
    });
    if (existe) continue;

    await prisma.instrumento.create({
      data: {
        id_categoria: ids.get(i.categoria)!,
        nombre_instrumento: i.nombre,
        marca: i.marca,
        modelo: i.modelo,
        tamano: i.tamano,
        color: i.color,
        precio_venta: i.precio,
        stock_actual: i.stock,
      },
    });
  }

  console.log(`Seed de instrumentos listo (${instrumentos.length} productos)`);
}