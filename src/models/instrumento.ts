/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

const categoriaSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: String,
  },
  { _id: false },
);

const instrumentoSchema = new Schema(
  {
    nombre_instrumento: { type: String, required: true, trim: true },
    marca: { type: String, trim: true },
    modelo: { type: String, trim: true },
    tamano: { type: String, trim: true },
    color: { type: String, trim: true },
    // La categoría se embebe: se lee junto con el instrumento y casi nunca cambia.
    categoria: { type: categoriaSchema, required: true },
    precio_venta: { type: Schema.Types.Decimal128, required: true, min: 0 },
    stock_actual: { type: Number, default: 0, min: 0 },
    activo: { type: Boolean, default: true },
    imagen_url: String,
  },
  { ...opcionesEsquema, collection: "instrumentos" },
);

instrumentoSchema.index({ "categoria.nombre": 1 });
instrumentoSchema.index({ nombre_instrumento: 1, marca: 1 });
instrumentoSchema.index({
  nombre_instrumento: "text",
  marca: "text",
  modelo: "text",
});

export const Instrumento =
  (mongoose.models.Instrumento as mongoose.Model<any>) ||
  mongoose.model("Instrumento", instrumentoSchema);
