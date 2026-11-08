/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

const mensajeSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    correo: { type: String, required: true, lowercase: true, trim: true },
    telefono: String,
    asunto: { type: String, required: true, trim: true },
    mensaje: { type: String, required: true },
    leido: { type: Boolean, default: false },
    fecha_envio: { type: Date, default: Date.now },
  },
  { ...opcionesEsquema, collection: "mensajes" },
);

mensajeSchema.index({ leido: 1, fecha_envio: -1 });

export const Mensaje =
  (mongoose.models.Mensaje as mongoose.Model<any>) ||
  mongoose.model("Mensaje", mensajeSchema);
