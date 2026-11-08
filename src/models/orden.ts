/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

const detalleOrdenSchema = new Schema(
  {
    instrumento: { type: Schema.Types.ObjectId, ref: "Instrumento", required: true },
    nombre_instrumento: { type: String, required: true },
    cantidad_solicitada: { type: Number, required: true, min: 1 },
    cantidad_recibida: { type: Number, default: 0, min: 0 },
    costo_unitario: { type: Schema.Types.Decimal128, required: true, min: 0 },
    subtotal: { type: Schema.Types.Decimal128, required: true, min: 0 },
  },
  { _id: false },
);

const ordenSchema = new Schema(
  {
    proveedor: { type: Schema.Types.ObjectId, ref: "Proveedor", required: true },
    administrador: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    fecha_orden: { type: Date, default: Date.now },
    estado_orden: {
      type: String,
      enum: ["Pendiente", "Recibida", "Cancelada"],
      default: "Pendiente",
    },
    detalles: { type: [detalleOrdenSchema], required: true },
    total: { type: Schema.Types.Decimal128, required: true, min: 0 },
  },
  { ...opcionesEsquema, collection: "ordenes" },
);

ordenSchema.index({ proveedor: 1, fecha_orden: -1 });
ordenSchema.index({ estado_orden: 1 });
ordenSchema.index({ "detalles.instrumento": 1 });

ordenSchema.pre("validate", function (this: any) {
  if (!Array.isArray(this.detalles) || this.detalles.length === 0) return;
  const total = this.detalles.reduce((suma: number, d: any) => {
    const cantidad = Number(d.cantidad_solicitada ?? 0);
    const costo = Number(d.costo_unitario?.toString?.() ?? 0);
    const subtotal = cantidad * costo;
    d.subtotal = mongoose.Types.Decimal128.fromString(subtotal.toFixed(2));
    return suma + subtotal;
  }, 0);
  this.total = mongoose.Types.Decimal128.fromString(total.toFixed(2));
});

export const Orden =
  (mongoose.models.Orden as mongoose.Model<any>) ||
  mongoose.model("Orden", ordenSchema);
