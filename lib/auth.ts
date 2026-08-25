import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

/**
 * Authentification e-mail + mot de passe, sans vérification d'adresse : les comptes
 * créés à l'inscription sont immédiatement actifs. Le rôle porté par `user.role`
 * décide des modules accessibles ; il n'est jamais modifiable depuis le client.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "client", input: false },
      customerId: { type: "string", required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: { enabled: true, maxAge: 60 },
  },
});

export type Session = typeof auth.$Infer.Session;
