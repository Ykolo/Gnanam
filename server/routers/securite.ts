import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { securiteProcedure, router } from "@/server/trpc";

export const securiteRouter = router({
  /** Visa du poste sécurité : une seule autorisation par commande (contrainte unique en base). */
  release: securiteProcedure
    .input(z.object({ orderId: z.string(), note: z.string().trim().max(300).optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.securityClearance.create({
          data: { orderId: input.orderId, agentId: ctx.user.id, conform: true, note: input.note ?? null },
        });
      } catch {
        throw new TRPCError({ code: "CONFLICT", message: "Cette commande a déjà été contrôlée." });
      }
      return { ok: true };
    }),
});
