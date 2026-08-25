import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { entrepotProcedure, router } from "@/server/trpc";
import { LineStatus, OrderStatus, StockMoveKind } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Quantité déjà sortie physiquement du dépôt pour une ligne : tant que la ligne
 * est « pending » la marchandise est encore en rayon, elle est seulement réservée.
 */
function consumedOf(status: LineStatus, picked: number): number {
  return status === LineStatus.pending ? 0 : picked;
}

/**
 * Applique un changement de ligne et répercute en une seule transaction la
 * variation de stock qui en découle (le journal garde le delta nominal demandé,
 * seul le stock physique du produit est borné à 0).
 */
async function applyLineChange(
  tx: Prisma.TransactionClient,
  userId: string,
  orderId: string,
  lineId: string,
  compute: (line: { status: LineStatus; qty: number; picked: number }) => { status: LineStatus; picked: number }
) {
  const line = await tx.orderLine.findUniqueOrThrow({
    where: { id: lineId },
    include: { order: { include: { customer: true } }, product: true },
  });
  if (line.orderId !== orderId) throw new TRPCError({ code: "BAD_REQUEST", message: "Ligne inconnue pour cette commande." });

  const before = consumedOf(line.status, line.picked);
  const next = compute(line);
  const after = consumedOf(next.status, next.picked);
  const out = after - before;

  await tx.orderLine.update({ where: { id: line.id }, data: { status: next.status, picked: next.picked } });

  if (out !== 0) {
    const rawDelta = -out;
    await tx.product.update({
      where: { id: line.productId },
      data: { quantity: Math.max(0, line.product.quantity + rawDelta) },
    });
    await tx.stockMove.create({
      data: {
        productId: line.productId,
        delta: rawDelta,
        kind: rawDelta > 0 ? StockMoveKind.annulation : StockMoveKind.sortie,
        label: `${line.order.customer.name} · CMD-${line.order.seq}`,
        orderId: line.orderId,
        userId,
      },
    });
  }
}

export const preparationRouter = router({
  start: entrepotProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUniqueOrThrow({ where: { id: input.orderId } });
      if (order.status === OrderStatus.todo) {
        await ctx.prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.picking } });
      }
      return { ok: true };
    }),

  setLineStatus: entrepotProcedure
    .input(
      z.object({
        orderId: z.string(),
        lineId: z.string(),
        action: z.enum(["toggle", "partial", "missing", "reset"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction((tx) =>
        applyLineChange(tx, ctx.user.id, input.orderId, input.lineId, (line) => {
          switch (input.action) {
            case "toggle":
              return line.status === LineStatus.done
                ? { status: LineStatus.pending, picked: line.qty }
                : { status: LineStatus.done, picked: line.qty };
            case "partial":
              return { status: LineStatus.partial, picked: Math.max(1, line.qty - 1) };
            case "missing":
              return { status: LineStatus.missing, picked: 0 };
            case "reset":
              return { status: LineStatus.pending, picked: line.qty };
          }
        })
      );
      return { ok: true };
    }),

  adjustPicked: entrepotProcedure
    .input(
      z.object({
        orderId: z.string(),
        lineId: z.string(),
        delta: z.union([z.literal(1), z.literal(-1)]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction((tx) =>
        applyLineChange(tx, ctx.user.id, input.orderId, input.lineId, (line) =>
          input.delta > 0
            ? { status: line.status, picked: Math.min(line.qty - 1, line.picked + 1) }
            : { status: line.status, picked: Math.max(0, line.picked - 1) }
        )
      );
      return { ok: true };
    }),

  finish: entrepotProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUniqueOrThrow({
        where: { id: input.orderId },
        include: { lines: true },
      });
      const allResolved = order.lines.length > 0 && order.lines.every((l) => l.status !== LineStatus.pending);
      if (!allResolved) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Toutes les lignes doivent être traitées avant de finaliser." });
      }
      await ctx.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.ready, readyAt: new Date() },
      });
      return { ok: true };
    }),
});
