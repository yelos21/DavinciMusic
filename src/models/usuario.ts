/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import { opcionesEsquema } from "./opciones";

const perfilSchema = new Schema(
  {
    // cliente
    fecha_alta: Date,
    telefono_emergencia: String,
    // maestro
    especialidad: String,
    // maestro y administrador
    fecha_contratacion: Date,
    // administrador
    turno: String,
  },
  { _id: false },
);

const usuarioSchema = new Schema(
  {
    nombre_usuario: { type: String, trim: true },
    nombre: { type: String, required: true, trim: true },
    apellido_paterno: { type: String, trim: true },
    apellido_materno: { type: String, trim: true },
    fecha_nacimiento: Date,
    curp: { type: String, uppercase: true, trim: true },
    ine: { type: String, trim: true },
    correo: { type: String, required: true, lowercase: true, trim: true },
    telefono: String,
    direccion: String,
    rol: {
      type: String,
      required: true,
      enum: ["cliente", "maestro", "administrador"],
    },
    perfil: { type: perfilSchema, default: () => ({}) },
    activo: { type: Boolean, default: true },
    fecha_registro: { type: Date, default: Date.now },
    // Enlace con better-auth (que sigue viviendo en Postgres)
    auth_user_id: String,
  },
  { ...opcionesEsquema, collection: "usuarios" },
);

usuarioSchema.index({ correo: 1 }, { unique: true });
usuarioSchema.index({ nombre_usuario: 1 }, { unique: true, sparse: true });
usuarioSchema.index({ curp: 1 }, { unique: true, sparse: true });
usuarioSchema.index({ ine: 1 }, { unique: true, sparse: true });
usuarioSchema.index({ rol: 1, activo: 1 });

// Regla de negocio que el esquema relacional no podía expresar por sí solo:
// un maestro debe tener especialidad.
usuarioSchema.pre("validate", function (this: any) {
  if (this.rol === "maestro" && !this.perfil?.especialidad) {
    this.invalidate("perfil.especialidad", "Un maestro necesita especialidad");
  }
  if (this.rol === "cliente" && !this.perfil?.fecha_alta) {
    this.perfil.fecha_alta = new Date();
  }
});

export const Usuario =
  (mongoose.models.Usuario as mongoose.Model<any>) ||
  mongoose.model("Usuario", usuarioSchema);
