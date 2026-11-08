/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

/**
 * Detalle de venta embebido + copia del nombre y precio del instrumento
 * (snapshot): si mañana cambia el precio, la venta histórica no se altera.
 */
const detalleVentaSchema = new Schema(
  {
    instrumento: { type: Schema.Types.ObjectId, ref: "Instrumento", required: true },
    nombre_instrumento: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precio_unitario: { type: Schema.Types.Decimal128, required: true, min: 0 },
    subtotal: { type: Schema.Types.Decimal128, required: true, min: 0 },
  },
  { _id: false },
);

const ventaSchema = new Schema(
  {
    cliente: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    administrador: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    fecha_venta: { type: Date, default: Date.now },
    metodo_pago: {
      type: String,
      required: true,
      enum: ["Efectivo", "Tarjeta", "Transferencia"],
    },
    estado_venta: {
      type: String,
      enum: ["Completada", "Cancelada", "Pendiente"],
      default: "Completada",
    },
    detalles: { type: [detalleVentaSchema], required: true },
    total: { type: Schema.Types.Decimal128, required: true, min: 0 },
  },
  { ...opcionesEsquema, collection: "ventas" },
);

ventaSchema.index({ cliente: 1, fecha_venta: -1 });
ventaSchema.index({ administrador: 1, fecha_venta: -1 });
ventaSchema.index({ fecha_venta: -1 });
ventaSchema.index({ "detalles.instrumento": 1 });

// El total se calcula solo, no se captura a mano.
ventaSchema.pre("validate", function (this: any) {
  if (!Array.isArray(this.detalles) || this.detalles.length === 0) return;
  const total = this.detalles.reduce((suma: number, d: any) => {
    const cantidad = Number(d.cantidad ?? 0);
    const precio = Number(d.precio_unitario?.toString?.() ?? 0);
    const subtotal = cantidad * precio;
    d.subtotal = mongoose.Types.Decimal128.fromString(subtotal.toFixed(2));
    return suma + subtotal;
  }, 0);
  this.total = mongoose.Types.Decimal128.fromString(total.toFixed(2));
});

export const Venta =
  (mongoose.models.Venta as mongoose.Model<any>) ||
  mongoose.model("Venta", ventaSchema);
