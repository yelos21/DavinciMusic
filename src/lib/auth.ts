import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import {Resend} from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Davinci Music <no-reply@tudomino.com>",
        to: user.email,
        subject: "Restablecer contraseña",
        html: `<p>Haz clic para restablecer tu contraseña:</p><a href="${url}">Restablecer contraseña</a>`,
      });
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