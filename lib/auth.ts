import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

/**
 * URL publique de l'application.
 *
 * `BETTER_AUTH_URL` couvre le développement local et la production, où le
 * domaine est stable. Les déploiements de preview, eux, reçoivent une URL
 * différente à chaque build : elle ne peut pas être écrite dans une variable
 * fixée à l'avance, on la lit donc dans l'environnement injecté par Vercel.
 */
export function resolveBaseURL(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  // Alias stable de la branche, préférable à l'URL du déploiement : il survit
  // aux rebuilds, donc les sessions ouvertes sur une preview ne sautent pas.
  if (env.VERCEL_BRANCH_URL) return `https://${env.VERCEL_BRANCH_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return undefined;
}

/** Origines acceptées pour les requêtes d'authentification (protection CSRF). */
export function resolveTrustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const candidates = [
    env.BETTER_AUTH_URL,
    env.VERCEL_BRANCH_URL && `https://${env.VERCEL_BRANCH_URL}`,
    env.VERCEL_URL && `https://${env.VERCEL_URL}`,
    env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ];
  return [...new Set(candidates.filter((v): v is string => Boolean(v)))];
}

/**
 * Better Auth limite la connexion à trois tentatives par fenêtre courte dès que
 * l'application tourne en production. C'est la bonne valeur face à un humain,
 * et elle reste donc active partout — sauf pour le serveur jetable des tests
 * end-to-end, qui enchaîne les connexions de quatre profils en quelques
 * secondes et se ferait bloquer au quatrième.
 *
 * Le drapeau n'est posé que par `playwright.config.ts`. Il ne doit jamais être
 * défini sur un environnement Vercel : ce serait rouvrir la porte au bourrage
 * de mots de passe.
 */
export function isRateLimitDisabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.AUTH_RATE_LIMIT_DISABLED === "1";
}

/**
 * Authentification e-mail + mot de passe, sans vérification d'adresse : les comptes
 * créés à l'inscription sont immédiatement actifs. Le rôle porté par `user.role`
 * décide des modules accessibles ; il n'est jamais modifiable depuis le client.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: resolveBaseURL(),
  trustedOrigins: resolveTrustedOrigins(),
  rateLimit: { enabled: !isRateLimitDisabled() },
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
