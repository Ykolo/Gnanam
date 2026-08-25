import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { entrepotProcedure, router } from "@/server/trpc";
import { OrderStatus } from "@/lib/generated/prisma/enums";

export const livraisonRouter = router({
  /** Confirme la remise du caddie : la signature elle-même reste un geste local, non rejouable côté serveur. */
  confirmDelivery: entrepotProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUniqueOrThrow({ where: { id: input.orderId } });
      if (order.status !== OrderStatus.ready) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cette commande n'est pas prête à être livrée." });
      }
      await ctx.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.delivered, deliveredAt: new Date(), signedBy: "Signature client" },
      });
      return { ok: true };
    }),
});
