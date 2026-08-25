import { describe, expect, it, vi } from "vitest";
import { stockRouter } from "./stock";
import { fakeContext, fakeUser, withTransaction } from "./test-utils";
import { StockMoveKind } from "@/lib/generated/prisma/enums";

function caller(prisma: Record<string, unknown>) {
  return stockRouter.createCaller(fakeContext(fakeUser("entrepot"), prisma));
}

describe("stock.list", () => {
  it("calcule réservé, disponible et niveau par référence", async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: "p1", sku: "p1", minStock: 10, quantity: 5 },
          { id: "p2", sku: "p2", minStock: 5, quantity: 20 },
        ]),
      },
      orderLine: {
        groupBy: vi.fn().mockResolvedValue([{ productId: "p1", _sum: { qty: 3 } }]),
      },
    };

    const rows = await caller(prisma).list();

    expect(rows).toEqual([
      { id: "p1", sku: "p1", minStock: 10, quantity: 5, reserved: 3, available: 2, level: "critique" },
      { id: "p2", sku: "p2", minStock: 5, quantity: 20, reserved: 0, available: 20, level: "ok" },
    ]);
  });
});

describe("stock.moves", () => {
  it("récupère les 40 derniers mouvements, du plus récent au plus ancien", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await caller({ stockMove: { findMany } }).moves();

    expect(findMany).toHaveBeenCalledWith({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { sku: true, name: true } } },
    });
  });
});

describe("stock.receive", () => {
  it("incrémente le stock et journalise une réception", async () => {
    const tx = {
      product: { update: vi.fn().mockResolvedValue({ id: "p1" }) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller({ $transaction: withTransaction(tx) }).receive({ productId: "p1", qty: 5 });

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { quantity: { increment: 5 } },
    });
    expect(tx.stockMove.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ productId: "p1", delta: 5, kind: StockMoveKind.reception }),
    });
  });
});

describe("stock.adjust", () => {
  it("augmente le stock d'un colis", async () => {
    const tx = {
      product: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "p1", quantity: 5 }), update: vi.fn().mockResolvedValue({}) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller({ $transaction: withTransaction(tx) }).adjust({ productId: "p1", delta: 1 });

    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { quantity: 6 } });
    expect(tx.stockMove.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ delta: 1, kind: StockMoveKind.ajustement, label: "Correction inventaire (+)" }),
    });
  });

  it("retire un colis sans dépasser 0", async () => {
    const tx = {
      product: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "p1", quantity: 5 }), update: vi.fn().mockResolvedValue({}) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller({ $transaction: withTransaction(tx) }).adjust({ productId: "p1", delta: -1 });

    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { quantity: 4 } });
  });

  it("n'écrit rien quand le stock est déjà à 0", async () => {
    const tx = {
      product: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "p1", quantity: 0 }), update: vi.fn() },
      stockMove: { create: vi.fn() },
    };

    await caller({ $transaction: withTransaction(tx) }).adjust({ productId: "p1", delta: -1 });

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.stockMove.create).not.toHaveBeenCalled();
  });
});
