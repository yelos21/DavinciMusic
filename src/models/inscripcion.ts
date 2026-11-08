/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

/**
 * Los pagos de mensualidad se embeben en la inscripción:
 * son pocos, dependen de ella y se consultan juntos (en SQL eran pago_clase).
 */
const pagoSchema = new Schema(
  {
    periodo_pagado: { type: Date, required: true },
    importe: { type: Schema.Types.Decimal128, required: true, min: 0 },
    fecha_vencimiento: { type: Date, required: true },
    fecha_pago: Date,
    metodo_pago: {
      type: String,
      enum: ["Efectivo", "Tarjeta", "Transferencia", "OXXO"],
    },
    estado_pago: {
      type: String,
      enum: ["Pendiente", "Pagado", "Vencido"],
      default: "Pendiente",
    },
  },
  { _id: true },
);

const inscripcionSchema = new Schema(
  {
    cliente: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    clase: { type: Schema.Types.ObjectId, ref: "Clase", required: true },
    fecha_inscripcion: { type: Date, default: Date.now },
    costo_mensual_acordado: {
      type: Schema.Types.Decimal128,
      required: true,
      min: 0,
    },
    estado_inscripcion: {
      type: String,
      enum: ["Activa", "Baja", "Concluida"],
      default: "Activa",
    },
    pagos: { type: [pagoSchema], default: [] },
  },
  { ...opcionesEsquema, collection: "inscripciones" },
);

// Un cliente no puede inscribirse dos veces a la misma clase.
inscripcionSchema.index({ cliente: 1, clase: 1 }, { unique: true });
inscripcionSchema.index({ clase: 1, estado_inscripcion: 1 });
inscripcionSchema.index({ "pagos.estado_pago": 1 });

export const Inscripcion =
  (mongoose.models.Inscripcion as mongoose.Model<any>) ||
  mongoose.model("Inscripcion", inscripcionSchema);
