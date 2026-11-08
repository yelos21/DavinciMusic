import "dotenv/config";
import mongoose from "mongoose";
import { conectarMongo } from "../src/lib/mongo";
import { Clase, Inscripcion, Usuario, Venta } from "../src/models";

async function main() {
  await conectarMongo();

  const clase = await Clase.findOne({ nombre_clase: "Guitarra para principiantes" })
    .populate("maestro", "nombre apellido_paterno perfil.especialidad")
    .populate("instrumento", "nombre_instrumento precio_venta")
    .lean();

  const inscripcion = await Inscripcion.findOne()
    .populate("cliente", "nombre apellido_paterno correo")
    .lean();

  const venta = await Venta.findOne().lean();

  console.log("== Clase con horarios embebidos ==");
  console.log(JSON.stringify(clase, null, 2));
  console.log("== Inscripción con pagos embebidos ==");
  console.log(JSON.stringify(inscripcion, null, 2));
  console.log("== Venta con detalle y total calculado ==");
  console.log(JSON.stringify(venta, null, 2));
  console.log("== Roles en una sola colección ==");
  console.log(JSON.stringify(await Usuario.distinct("rol"), null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
