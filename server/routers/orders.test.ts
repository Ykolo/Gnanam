import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { ordersRouter } from "./orders";
import { fakeContext, fakeUser } from "./test-utils";

describe("orders.create", () => {
  it("fige le prix et l'adresse du client au moment de la commande", async () => {
    const customer = { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "cust-1", address: "1 rue Test" }) };
    const product = { findMany: vi.fn().mockResolvedValue([{ id: "p1", priceCents: 1000 }]) };
    const order = { create: vi.fn().mockResolvedValue({ id: "order-x", seq: 99 }) };
    const ctx = fakeContext(fakeUser("client", { customerId: "cust-1" }), { customer, product, order });

    const result = await ordersRouter.createCaller(ctx).create({ items: [{ productId: "p1", qty: 2 }] });

    expect(order.create).toHaveBeenCalledWith({
      data: {
        customerId: "cust-1",
        windowLabel: "8h – 11h",
        address: "1 rue Test",
        lines: {
          create: [{ productId: "p1", qty: 2, picked: 2, unitPriceCents: 1000, position: 0 }],
        },
      },
      select: { id: true, seq: true },
    });
    expect(result).toEqual({ id: "order-x", seq: 99 });
  });

  it("enregistre le créneau de livraison choisi", async () => {
    const customer = { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "cust-1", address: "1 rue Test" }) };
    const product = { findMany: vi.fn().mockResolvedValue([{ id: "p1", priceCents: 1000 }]) };
    const order = { create: vi.fn().mockResolvedValue({ id: "order-x", seq: 99 }) };
    const ctx = fakeContext(fakeUser("client", { customerId: "cust-1" }), { customer, product, order });

    await ordersRouter.createCaller(ctx).create({
      items: [{ productId: "p1", qty: 1 }],
      windowLabel: "14h – 17h",
    });

    expect(order.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ windowLabel: "14h – 17h" }) })
    );
  });

  it("refuse un créneau hors de la liste proposée", async () => {
    const ctx = fakeContext(fakeUser("client", { customerId: "cust-1" }), {});
    await expect(
      ordersRouter
        .createCaller(ctx)
        // @ts-expect-error — on vérifie précisément que le serveur rejette une valeur libre.
        .create({ items: [{ productId: "p1", qty: 1 }], windowLabel: "3h – 4h du matin" })
    ).rejects.toThrow();
  });

  it("refuse un panier sans établissement rattaché", async () => {
    const ctx = fakeContext(fakeUser("client", { customerId: null }), {});
    await expect(
      ordersRouter.createCaller(ctx).create({ items: [{ productId: "p1", qty: 1 }] })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuse un produit qui n'est plus au catalogue", async () => {
    const customer = { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "cust-1", address: "1 rue Test" }) };
    const product = { findMany: vi.fn().mockResolvedValue([]) };
    const ctx = fakeContext(fakeUser("client", { customerId: "cust-1" }), { customer, product });

    await expect(
      ordersRouter.createCaller(ctx).create({ items: [{ productId: "p-disparu", qty: 1 }] })
    ).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("orders.today", () => {
  it("liste les commandes créées depuis le début de la journée, triées par numéro", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const ctx = fakeContext(fakeUser("entrepot"), { order: { findMany } });

    await ordersRouter.createCaller(ctx).today();

    expect(findMany).toHaveBeenCalledOnce();
    const call = findMany.mock.calls[0][0];
    expect(call.orderBy).toEqual({ seq: "asc" });
    expect(call.where.createdAt.gte).toBeInstanceOf(Date);
  });
});
