/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

const periodoSchema = new Schema(
  {
    nombre_periodo: { type: String, required: true, unique: true, trim: true },
    fecha_inicio: { type: Date, required: true },
    fecha_fin: { type: Date, required: true },
    estado: {
      type: String,
      required: true,
      enum: ["Activo", "Cerrado", "Proximo"],
      default: "Proximo",
    },
  },
  { ...opcionesEsquema, collection: "periodos" },
);

periodoSchema.pre("validate", function (this: { fecha_inicio?: Date; fecha_fin?: Date }) {
  if (this.fecha_inicio && this.fecha_fin && this.fecha_fin <= this.fecha_inicio) {
    throw new Error("La fecha de fin debe ser posterior a la de inicio");
  }
});

export const Periodo =
  (mongoose.models.Periodo as mongoose.Model<any>) ||
  mongoose.model("Periodo", periodoSchema);
