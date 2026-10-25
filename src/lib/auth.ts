import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import {Resend} from "resend";
import { enviarCorreo, escaparHTML } from "./correo";

const resend = new Resend(process.env.RESEND_API_KEY);
const exigirVerificacion = process.env.REQUIERE_EMAIL_VERIFICATION == "true";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

   trustedOrigins: [
    "http://localhost:3000",
    "https://davinci-music.vercel.app",
    "https://davinci-music-*.vercel.app", // direcciones de cada deploy
  ], 

  emailAndPassword: {
    sendOnSingUp: exigirVerificacion,
    autoSingInAfterVerification: true,
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      void enviarCorreo({
        para: user.email,
        asunto: "Restablecer contraseña",
        texto: `Hola ${user.name}, restablece tu contraseña aquí: ${url}`,
        html: `
      <p>Hola ${escaparHTML(user.name)},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. El enlace es válido por 1 hora.</p>
      <p><a href="${url}">Restablecer contraseña</a></p>
      <p>Si no fuiste tú, ignora este correo.</p>
    `,      });
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.usuario.create({
            data: {
              authUserId: user.id,
              nombre: user.name,
              correo: user.email,
              cliente: { create: {} },
            },
          });
        },
      },
    },
  },

  plugins: [nextCookies()],
});