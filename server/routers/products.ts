import { protectedProcedure, router } from "@/server/trpc";

export const productsRouter = router({
  /** Catalogue visible à la commande : les références désactivées en sont exclues. */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.product.findMany({
      where: { active: true },
      orderBy: { sku: "asc" },
      select: {
        id: true,
        sku: true,
        name: true,
        unit: true,
        priceCents: true,
        category: true,
        zone: true,
        minStock: true,
        quantity: true,
        imageUrl: true,
      },
    });
  }),
});
