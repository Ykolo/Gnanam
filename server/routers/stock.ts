import { z } from "zod";
import { entrepotProcedure, router } from "@/server/trpc";
import { LineStatus, OrderStatus, StockMoveKind } from "@/lib/generated/prisma/enums";
import { levelOf } from "@/lib/gnanam/stock";

export const stockRouter = router({
  /** Vue complète du stock dépôt : physique, réservé par les commandes ouvertes, disponible. */
  list: entrepotProcedure.query(async ({ ctx }) => {
    const [products, reserved] = await Promise.all([
      ctx.prisma.product.findMany({ where: { active: true }, orderBy: { sku: "asc" } }),
      ctx.prisma.orderLine.groupBy({
        by: ["productId"],
        where: { status: LineStatus.pending, order: { status: { not: OrderStatus.delivered } } },
        _sum: { qty: true },
      }),
    ]);
    const reservedOf = new Map(reserved.map((r) => [r.productId, r._sum.qty ?? 0]));

    return products.map((p) => {
      const res = reservedOf.get(p.id) ?? 0;
      const available = p.quantity - res;
      return { ...p, reserved: res, available, level: levelOf(available, p.minStock) };
    });
  }),

  /** Journal des derniers mouvements, tous produits confondus. */
  moves: entrepotProcedure.query(async ({ ctx }) => {
    return ctx.prisma.stockMove.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { sku: true, name: true } } },
    });
  }),

  receive: entrepotProcedure
    .input(z.object({ productId: z.string(), qty: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const product = await tx.product.update({
          where: { id: input.productId },
          data: { quantity: { increment: input.qty } },
        });
        await tx.stockMove.create({
          data: {
            productId: product.id,
            delta: input.qty,
            kind: StockMoveKind.reception,
            label: "Réception dépôt · saisie manuelle",
            userId: ctx.user.id,
          },
        });
      });
      return { ok: true };
    }),

  adjust: entrepotProcedure
    .input(z.object({ productId: z.string(), delta: z.union([z.literal(1), z.literal(-1)]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUniqueOrThrow({ where: { id: input.productId } });
        if (input.delta < 0 && product.quantity === 0) return;
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: Math.max(0, product.quantity + input.delta) },
        });
        await tx.stockMove.create({
          data: {
            productId: product.id,
            delta: input.delta,
            kind: StockMoveKind.ajustement,
            label: input.delta > 0 ? "Correction inventaire (+)" : "Correction inventaire (−)",
            userId: ctx.user.id,
          },
        });
      });
      return { ok: true };
    }),
});
