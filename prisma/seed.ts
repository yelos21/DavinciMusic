import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg"; 
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({connectionString: process.env.DaTABASE_URL});
const prisma = new PrismaClient({adapter});

async function main() {
await prisma.categoria_instrumento.createMany({
    data: [
        {id_categoria: 1, nombre_categoria : "Cuerdas", descripcion: "Instrumentos de cuerda como guitarras, violines y bajos"},
        {id_categoria: 2, nombre_categoria : "Percusión", descripcion: "Instrumentos de percusión como baterias, bongos y congas"},
        {id_categoria: 3, nombre_categoria: "Viento", descripcion: "Instrumentos de viento como flautas, saxofón y trompeta" },
        {id_categoria: 4, nombre_categoria: "Teclado", descripcion: "Instrumentos de teclado como pianos y órgano" },
        {id_categoria: 5, nombre_categoria: "Electrónico", descripcion: "Instrumentos electronicos como sintetizadores y controladores MIDI"}
    ],
})
    console.log("Categorias de instrumentos insertadas correctamente");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });