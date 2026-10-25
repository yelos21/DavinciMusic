import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
    ? new Resend (process.env.RESEND_API_KEY)
    :null

const REMITENTE = process.env.EMAIL_FROM ?? "Davinci Music <onboarding@resend.dev>";    

export function escaparHTML(texto: string): string {
    return texto
.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


export async function enviarCorreo({
    para, 
    asunto,
    html,
    texto
}: {
    para: string,
    asunto: string,
    html: string,
    texto: string,
}) {
    if(!resend){
        console.log(`[correo simulado] Para: ${para}\nAsunto: ${asunto}\n${texto}`);
        return;
}

  const { error } = await resend.emails.send({
    from: REMITENTE,
    to: para,
    subject: asunto,
    html,
    text: texto,
  });

  if (error) {
    console.error("No se pudo enviar el correo:", error);
  }

}
