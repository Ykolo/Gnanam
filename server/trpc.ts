import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { RoleId } from "@/lib/gnanam/types";

/**
 * Contexte d'une requête tRPC : la session Better Auth relue depuis le cookie,
 * et le client Prisma. Le rôle vient toujours d'ici, jamais du corps de la requête.
 */
export async function createContext(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  return { prisma, session, user: session?.user ?? null };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
export type SessionUser = NonNullable<Context["user"]>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expirée." });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * L'admin traverse tous les postes : c'est le profil de démonstration et de
 * supervision, il doit pouvoir rejouer n'importe quelle étape du parcours.
 */
function requireRole(...roles: RoleId[]) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expirée." });
    const role = ctx.user.role as RoleId;
    if (role !== "admin" && !roles.includes(role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Ce profil n'a pas accès à cette action." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const protectedProcedure = publicProcedure.use(requireUser);
export const clientProcedure = protectedProcedure.use(requireRole("client"));
export const entrepotProcedure = protectedProcedure.use(requireRole("entrepot"));
export const securiteProcedure = protectedProcedure.use(requireRole("securite"));
export const adminProcedure = protectedProcedure.use(requireRole("admin"));
/** Postes qui partagent la file des commandes du jour : entrepôt (prépa, livraison) et sécurité. */
export const opsProcedure = protectedProcedure.use(requireRole("entrepot", "securite"));
