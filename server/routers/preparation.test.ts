import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { preparationRouter } from "./preparation";
import { fakeContext, fakeUser, withTransaction } from "./test-utils";
import { LineStatus, OrderStatus } from "@/lib/generated/prisma/enums";

function makeLine(overrides: Record<string, unknown> = {}) {
  return {
    id: "line-1",
    orderId: "order-1",
    productId: "prod-1",
    qty: 3,
    picked: 3,
    status: LineStatus.pending,
    unitPriceCents: 1000,
    position: 0,
    order: { id: "order-1", seq: 42, customer: { name: "Test Client" } },
    product: { id: "prod-1", quantity: 10 },
    ...overrides,
  };
}

function caller(tx: Record<string, unknown>, prismaOverrides: Record<string, unknown> = {}) {
  const prisma = { $transaction: withTransaction(tx), ...prismaOverrides };
  return preparationRouter.createCaller(fakeContext(fakeUser("entrepot"), prisma));
}

describe("preparation.setLineStatus", () => {
  it("passe une ligne en attente à partielle et sort la différence du stock", async () => {
    const tx = {
      orderLine: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(makeLine()),
        update: vi.fn().mockResolvedValue({}),
      },
      product: { update: vi.fn().mockResolvedValue({}) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller(tx).setLineStatus({ orderId: "order-1", lineId: "line-1", action: "partial" });

    expect(tx.orderLine.update).toHaveBeenCalledWith({
      where: { id: "line-1" },
      data: { status: LineStatus.partial, picked: 2 },
    });
    // consumedOf(pending, 3) = 0 → consumedOf(partial, 2) = 2 : 2 colis sortent du dépôt.
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { quantity: 8 },
    });
    expect(tx.stockMove.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: "prod-1",
        delta: -2,
        kind: "sortie",
        label: "Test Client · CMD-42",
        orderId: "order-1",
        userId: "user-1",
      }),
    });
  });

  it("remet une ligne validée en attente et réintègre le stock", async () => {
    const tx = {
      orderLine: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(makeLine({ status: LineStatus.done, picked: 3 })),
        update: vi.fn().mockResolvedValue({}),
      },
      product: { update: vi.fn().mockResolvedValue({}) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller(tx).setLineStatus({ orderId: "order-1", lineId: "line-1", action: "toggle" });

    expect(tx.orderLine.update).toHaveBeenCalledWith({
      where: { id: "line-1" },
      data: { status: LineStatus.pending, picked: 3 },
    });
    // consumedOf(done, 3) = 3 → consumedOf(pending, 3) = 0 : 3 colis reviennent en stock.
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "prod-1" }, data: { quantity: 13 } });
    expect(tx.stockMove.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ delta: 3, kind: "annulation" }),
    });
  });

  it("borne le stock à 0 plutôt que de passer en négatif", async () => {
    const tx = {
      orderLine: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(makeLine({ product: { id: "prod-1", quantity: 1 } })),
        update: vi.fn().mockResolvedValue({}),
      },
      product: { update: vi.fn().mockResolvedValue({}) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller(tx).setLineStatus({ orderId: "order-1", lineId: "line-1", action: "toggle" });

    // consumedOf(pending, 3) = 0 → consumedOf(done, 3) = 3 : sortie de 3, mais physique à 1 → borné à 0.
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "prod-1" }, data: { quantity: 0 } });
  });

  it("ne touche ni le produit ni le journal quand rien n'est consommé", async () => {
    const tx = {
      orderLine: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(makeLine()),
        update: vi.fn().mockResolvedValue({}),
      },
      product: { update: vi.fn().mockResolvedValue({}) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller(tx).setLineStatus({ orderId: "order-1", lineId: "line-1", action: "reset" });

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.stockMove.create).not.toHaveBeenCalled();
  });

  it("rejette une ligne qui n'appartient pas à la commande indiquée", async () => {
    const tx = {
      orderLine: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(makeLine({ orderId: "other-order" })),
        update: vi.fn(),
      },
      product: { update: vi.fn() },
      stockMove: { create: vi.fn() },
    };

    await expect(
      caller(tx).setLineStatus({ orderId: "order-1", lineId: "line-1", action: "reset" })
    ).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("preparation.adjustPicked", () => {
  it("incrémente la quantité préparée sans dépasser qty - 1", async () => {
    const tx = {
      orderLine: {
        findUniqueOrThrow: vi
          .fn()
          .mockResolvedValue(makeLine({ qty: 5, picked: 2, status: LineStatus.partial })),
        update: vi.fn().mockResolvedValue({}),
      },
      product: { update: vi.fn().mockResolvedValue({}) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller(tx).adjustPicked({ orderId: "order-1", lineId: "line-1", delta: 1 });

    expect(tx.orderLine.update).toHaveBeenCalledWith({
      where: { id: "line-1" },
      data: { status: LineStatus.partial, picked: 3 },
    });
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "prod-1" }, data: { quantity: 9 } });
  });

  it("ne descend jamais sous 0", async () => {
    const tx = {
      orderLine: {
        findUniqueOrThrow: vi
          .fn()
          .mockResolvedValue(makeLine({ qty: 5, picked: 0, status: LineStatus.partial })),
        update: vi.fn().mockResolvedValue({}),
      },
      product: { update: vi.fn().mockResolvedValue({}) },
      stockMove: { create: vi.fn().mockResolvedValue({}) },
    };

    await caller(tx).adjustPicked({ orderId: "order-1", lineId: "line-1", delta: -1 });

    expect(tx.orderLine.update).toHaveBeenCalledWith({
      where: { id: "line-1" },
      data: { status: LineStatus.partial, picked: 0 },
    });
  });
});

describe("preparation.start", () => {
  it("démarre une commande à préparer", async () => {
    const order = { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "order-1", status: OrderStatus.todo }), update: vi.fn().mockResolvedValue({}) };
    await preparationRouter
      .createCaller(fakeContext(fakeUser("entrepot"), { order }))
      .start({ orderId: "order-1" });
    expect(order.update).toHaveBeenCalledWith({ where: { id: "order-1" }, data: { status: OrderStatus.picking } });
  });

  it("ne relance pas une commande déjà en cours", async () => {
    const order = { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "order-1", status: OrderStatus.picking }), update: vi.fn() };
    await preparationRouter
      .createCaller(fakeContext(fakeUser("entrepot"), { order }))
      .start({ orderId: "order-1" });
    expect(order.update).not.toHaveBeenCalled();
  });
});

describe("preparation.finish", () => {
  it("passe la commande prête quand toutes les lignes sont traitées", async () => {
    const order = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "order-1",
        lines: [{ status: LineStatus.done }, { status: LineStatus.missing }],
      }),
      update: vi.fn().mockResolvedValue({}),
    };
    await preparationRouter
      .createCaller(fakeContext(fakeUser("entrepot"), { order }))
      .finish({ orderId: "order-1" });

    expect(order.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { status: OrderStatus.ready, readyAt: expect.any(Date) },
    });
  });

  it("refuse de finaliser tant qu'une ligne est en attente", async () => {
    const order = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "order-1",
        lines: [{ status: LineStatus.done }, { status: LineStatus.pending }],
      }),
      update: vi.fn(),
    };
    await expect(
      preparationRouter.createCaller(fakeContext(fakeUser("entrepot"), { order })).finish({ orderId: "order-1" })
    ).rejects.toBeInstanceOf(TRPCError);
    expect(order.update).not.toHaveBeenCalled();
  });
});
