import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { clientProcedure, opsProcedure, router } from "@/server/trpc";
import { startOfParisDay } from "@/lib/gnanam/timezone";
import { DEFAULT_DELIVERY_WINDOW, DELIVERY_WINDOWS } from "@/lib/gnanam/data";


export const orderWithLines = {
  lines: {
    orderBy: { position: "asc" as const },
    include: { product: true },
  },
  clearance: true,
  customer: { select: { id: true, name: true } },
} as const;

/**
 * Début de la journée en cours, à l'heure de Paris : la file opérationnelle ne
 * porte que sur les commandes du jour. Le fuseau est explicite car les fonctions
 * serverless tournent en UTC (voir lib/gnanam/timezone.ts).
 */
export function startOfToday(): Date {
  return startOfParisDay();
}

export const ordersRouter = router({
  /** File du jour, commune à la préparation, la sécurité et la livraison. */
  today: opsProcedure.query(async ({ ctx }) => {
    return ctx.prisma.order.findMany({
      where: { createdAt: { gte: startOfToday() } },
      orderBy: { seq: "asc" },
      include: orderWithLines,
    });
  }),

  /** Historique de l'établissement connecté, du plus récent au plus ancien. */
  mine: clientProcedure.query(async ({ ctx }) => {
    if (!ctx.user.customerId) return [];
    return ctx.prisma.order.findMany({
      where: { customerId: ctx.user.customerId },
      orderBy: { seq: "desc" },
      take: 50,
      include: orderWithLines,
    });
  }),

  create: clientProcedure
    .input(
      z.object({
        items: z
          .array(z.object({ productId: z.string(), qty: z.number().int().positive() }))
          .min(1, "Le panier est vide."),
        windowLabel: z.enum(DELIVERY_WINDOWS).default(DEFAULT_DELIVERY_WINDOW),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.customerId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ce compte n'est rattaché à aucun établissement." });
      }

      const customer = await ctx.prisma.customer.findUniqueOrThrow({ where: { id: ctx.user.customerId } });
      const products = await ctx.prisma.product.findMany({
        where: { id: { in: input.items.map((i) => i.productId) }, active: true },
        select: { id: true, priceCents: true },
      });
      const priceOf = new Map(products.map((p) => [p.id, p.priceCents]));

      for (const item of input.items) {
        if (!priceOf.has(item.productId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Un article du panier n'est plus disponible." });
        }
      }

      return ctx.prisma.order.create({
        data: {
          customerId: customer.id,
          windowLabel: input.windowLabel,
          address: customer.address,
          lines: {
            create: input.items.map((item, position) => ({
              productId: item.productId,
              qty: item.qty,
              picked: item.qty,
              unitPriceCents: priceOf.get(item.productId)!,
              position,
            })),
          },
        },
        select: { id: true, seq: true },
      });
    }),
});
