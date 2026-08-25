import { vi } from "vitest";
import type { Context, SessionUser } from "@/server/trpc";
import type { RoleId } from "@/lib/gnanam/types";

/** Utilisateur de session minimal pour les tests de routeurs — non un fichier de test. */
export function fakeUser(role: RoleId, overrides: Record<string, unknown> = {}): SessionUser {
  return {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    role,
    customerId: null,
    ...overrides,
  } as unknown as SessionUser;
}

export function fakeContext(user: SessionUser | null, prisma: Record<string, unknown>): Context {
  return { prisma: prisma as unknown as Context["prisma"], session: null, user } as Context;
}

/** Mock de `ctx.prisma.$transaction` qui exécute le callback avec le `tx` fourni. */
export function withTransaction(tx: Record<string, unknown>) {
  return vi.fn((cb: (tx: Record<string, unknown>) => unknown) => cb(tx));
}
