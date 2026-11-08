import mongoose from "mongoose";

/**
 * Convierte Decimal128 y ObjectId a tipos normales para que las respuestas
 * (Server Actions, API routes, scripts) puedan serializarse sin sorpresas.
 */
function normalizar(valor: unknown): unknown {
  if (valor instanceof mongoose.Types.Decimal128) return Number(valor.toString());
  if (valor instanceof mongoose.Types.ObjectId) return valor.toString();
  if (Array.isArray(valor)) return valor.map(normalizar);
  if (valor && typeof valor === "object") {
    const salida: Record<string, unknown> = {};
    for (const [clave, v] of Object.entries(valor)) {
      salida[clave] = normalizar(v);
    }
    return salida;
  }
  return valor;
}

export function aJSON(_doc: unknown, ret: Record<string, unknown>) {
  const { _id, ...resto } = ret;
  delete resto.__v;
  return { id: _id ? String(_id) : undefined, ...(normalizar(resto) as object) };
}

/** Opciones comunes: sin __v y con `id` en lugar de `_id` al serializar. */
export const opcionesEsquema: mongoose.SchemaOptions = {
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: aJSON,
  },
};

/** Ayuda para escribir dinero: dinero(3899) -> Decimal128("3899") */
export const dinero = (valor: number | string) =>
  mongoose.Types.Decimal128.fromString(String(valor));
