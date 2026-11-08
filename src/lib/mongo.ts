import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB ?? "davinci_music";

if (!MONGODB_URI) {
  throw new Error("Falta MONGODB_URI en .env");
}

// En desarrollo Next.js recarga los módulos en cada cambio: guardamos la
// conexión en global para no abrir un pool nuevo en cada hot reload.
const globalForMongo = global as unknown as { mongo?: typeof mongoose };

export async function conectarMongo() {
  if (globalForMongo.mongo) return globalForMongo.mongo;

  const conexion = await mongoose.connect(MONGODB_URI!, {
    dbName: MONGODB_DB,
    serverSelectionTimeoutMS: 10_000,
  });

  globalForMongo.mongo = conexion;
  return conexion;
}

export default conectarMongo;
