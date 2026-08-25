import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { securiteProcedure, router } from "@/server/trpc";

export const securiteRouter = router({
  /**
   * Visa du poste sécurité : une seule autorisation par commande (contrainte
   * unique en base). Un écart laisse sortir la marchandise mais reste tracé,
   * pour que les rapports puissent le compter — d'où la note obligatoire.
   */
  release: securiteProcedure
    .input(
      z
        .object({
          orderId: z.string(),
          conform: z.boolean().default(true),
          note: z.string().trim().max(300).optional(),
        })
        .refine((v) => v.conform || (v.note && v.note.length >= 3), {
          message: "Un écart doit être motivé.",
          path: ["note"],
        })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.securityClearance.create({
          data: {
            orderId: input.orderId,
            agentId: ctx.user.id,
            conform: input.conform,
            note: input.note ?? null,
          },
        });
      } catch {
        throw new TRPCError({ code: "CONFLICT", message: "Cette commande a déjà été contrôlée." });
      }
      return { ok: true };
    }),
});
