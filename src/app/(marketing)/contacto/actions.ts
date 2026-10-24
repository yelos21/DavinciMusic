"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const ASUNTOS = ["Tienda", "Clase muestra", "Otro"];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function enviarMensaje(formData: FormData) {
    if(String(formData.get("sitio_web")?? "").trim() !== ""){
        redirect("/contacto?enviado=1");
    }


    const nombre= String(formData.get("nombre") ?? "").trim().slice(0,100);
    const correo= String(formData.get("correo") ?? "").trim().slice(0,150);
    const telefono= String(formData.get("telefono") ?? "").trim().slice(0,30);
    const asunto= String(formData.get("asunto") ?? "");
    const mensaje = String(formData.get("mensaje") ?? "").trim();

    if(nombre.length < 2  || 
        !CORREO.test(correo) ||
        !ASUNTOS.includes(asunto) ||
        mensaje.length < 10 ||
        mensaje.length > 1000 
    ){
        redirect("/contacto?error=1")
    }

    await prisma.mensajeContacto.create({
        data: {
            nombre,correo, telefono: telefono || null, asunto, mensaje 
        },
    });

    redirect("contacto?enviado=1");

}
