import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { livraisonRouter } from "./livraison";
import { fakeContext, fakeUser } from "./test-utils";
import { OrderStatus } from "@/lib/generated/prisma/enums";

function caller(order: Record<string, unknown>) {
  return livraisonRouter.createCaller(fakeContext(fakeUser("entrepot"), { order }));
}

describe("livraison.confirmDelivery", () => {
  it("livre une commande prête et fige une signature", async () => {
    const update = vi.fn().mockResolvedValue({});
    const order = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "order-1", status: OrderStatus.ready }),
      update,
    };

    await caller(order).confirmDelivery({ orderId: "order-1" });

    expect(update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { status: OrderStatus.delivered, deliveredAt: expect.any(Date), signedBy: "Signature client" },
    });
  });

  it("refuse de livrer une commande qui n'est pas prête", async () => {
    const update = vi.fn();
    const order = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "order-1", status: OrderStatus.picking }),
      update,
    };

    await expect(caller(order).confirmDelivery({ orderId: "order-1" })).rejects.toBeInstanceOf(TRPCError);
    expect(update).not.toHaveBeenCalled();
  });
});
