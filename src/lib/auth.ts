import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { enviarCorreo, escaparHTML } from "./correo";

const exigirVerificacion = process.env.REQUIRE_EMAIL_VERIFICATION === "true";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

   trustedOrigins: [
    "http://localhost:3000",
    "https://davinci-music.vercel.app",
    "https://davinci-music-*.vercel.app", // direcciones de cada deploy
  ], 

  emailVerification: {
    sendOnSignUp: exigirVerificacion,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await enviarCorreo({
        para: user.email,
        asunto: "Verifica tu correo",
        texto: `Hola ${user.name}, verifica tu correo aquí: ${url}`,
        html: `
      <p>Hola ${escaparHTML(user.name)},</p>
      <p>Confirma tu correo para activar tu cuenta en Davinci Music. El enlace es válido por 1 hora.</p>
      <p><a href="${url}">Verificar correo</a></p>
      <p>Si no creaste esta cuenta, ignora este correo.</p>
    `,
      });
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: exigirVerificacion,
    sendResetPassword: async ({ user, url }) => {
      await enviarCorreo({
        para: user.email,
        asunto: "Restablecer contraseña",
        texto: `Hola ${user.name}, restablece tu contraseña aquí: ${url}`,
        html: `
      <p>Hola ${escaparHTML(user.name)},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. El enlace es válido por 1 hora.</p>
      <p><a href="${url}">Restablecer contraseña</a></p>
      <p>Si no fuiste tú, ignora este correo.</p>
    `,
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
