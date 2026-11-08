/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/**
 * Los horarios se embeben porque siempre se consultan con la clase
 * y no tienen vida propia (en SQL eran la tabla horario_clase).
 */
const horarioSchema = new Schema(
  {
    dia_semana: { type: String, required: true, enum: DIAS },
    hora_inicio: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    hora_fin: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    salon: String,
  },
  { _id: false },
);

const claseSchema = new Schema(
  {
    nombre_clase: { type: String, required: true, trim: true },
    nivel: {
      type: String,
      required: true,
      enum: ["Principiante", "Intermedio", "Avanzado"],
    },
    costo_mensual: { type: Schema.Types.Decimal128, required: true, min: 0 },
    cupo_maximo: { type: Number, required: true, min: 1 },
    activa: { type: Boolean, default: true },
    // Referencias: el maestro y el instrumento existen por su cuenta.
    maestro: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    instrumento: {
      type: Schema.Types.ObjectId,
      ref: "Instrumento",
      required: true,
    },
    periodo: { type: Schema.Types.ObjectId, ref: "Periodo", required: true },
    horarios: { type: [horarioSchema], default: [] },
  },
  { ...opcionesEsquema, collection: "clases" },
);

claseSchema.index({ nombre_clase: 1, periodo: 1 }, { unique: true });
claseSchema.index({ maestro: 1, activa: 1 });
claseSchema.index({ instrumento: 1 });

claseSchema.pre("validate", function (this: any) {
  const { horarios = [] } = this as { horarios?: { hora_inicio: string; hora_fin: string }[] };
  for (const h of horarios) {
    if (h.hora_fin <= h.hora_inicio) {
      this.invalidate("horarios", `Horario inválido: ${h.hora_inicio} - ${h.hora_fin}`);
    }
  }
});

export const Clase =
  (mongoose.models.Clase as mongoose.Model<any>) ||
  mongoose.model("Clase", claseSchema);
