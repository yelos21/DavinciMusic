import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "davinci_music";

async function main() {
  if (!uri) {
    console.error("Falta MONGODB_URI en .env");
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10_000 });

  const { db } = mongoose.connection;
  const ping = await db!.admin().ping();
  const colecciones = await db!.listCollections().toArray();

  console.log(`Conectado a MongoDB: ${db!.databaseName}`);
  console.log(`Ping: ${JSON.stringify(ping)}`);
  console.log(
    colecciones.length === 0
      ? "La base está vacía (aún no hay colecciones)."
      : `Colecciones: ${colecciones.map((c) => c.name).join(", ")}`,
  );
}

main()
  .catch((error) => {
    console.error("No se pudo conectar:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
