/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

const proveedorSchema = new Schema(
  {
    nombre_proveedor: { type: String, required: true, trim: true },
    rfc: { type: String, required: true, uppercase: true, trim: true },
    correo: { type: String, required: true, lowercase: true, trim: true },
    direccion: String,
    telefono: { type: String, required: true, trim: true },
    activo: { type: Boolean, default: true },
  },
  { ...opcionesEsquema, collection: "proveedores" },
);

proveedorSchema.index({ rfc: 1 }, { unique: true });
proveedorSchema.index({ activo: 1 });

export const Proveedor =
  (mongoose.models.Proveedor as mongoose.Model<any>) ||
  mongoose.model("Proveedor", proveedorSchema);
