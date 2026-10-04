import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      console.log(`Enlace de recuperacion para ${user.email}: ${url}`);
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