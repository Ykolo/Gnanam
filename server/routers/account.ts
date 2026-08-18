import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/server/trpc";

export const accountRouter = router({
  /**
   * Deuxième temps de l'inscription : Better Auth a créé le compte et posé le
   * cookie de session, on rattache ici l'établissement B2B. Séparer les deux
   * évite de réimplémenter la création de session côté serveur.
   */
  completeRegistration: protectedProcedure
    .input(
      z.object({
        siret: z.string().trim().min(9, "SIRET incomplet").max(20),
        address: z.string().trim().min(5, "Adresse trop courte").max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.customerId) {
        throw new TRPCError({ code: "CONFLICT", message: "Ce compte est déjà rattaché à un établissement." });
      }

      const existing = await ctx.prisma.customer.findUnique({ where: { siret: input.siret } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Un compte existe déjà pour ce SIRET." });
      }

      const customer = await ctx.prisma.customer.create({
        data: {
          name: ctx.user.name,
          siret: input.siret,
          address: input.address,
          contactEmail: ctx.user.email,
        },
      });

      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { customerId: customer.id, role: "client" },
      });

      return { customerId: customer.id };
    }),
});
