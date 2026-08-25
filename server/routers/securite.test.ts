import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { securiteRouter } from "./securite";
import { fakeContext, fakeUser } from "./test-utils";

function caller(create: ReturnType<typeof vi.fn>) {
  return securiteRouter.createCaller(
    fakeContext(fakeUser("securite", { id: "agent-1" }), { securityClearance: { create } })
  );
}

describe("securite.release", () => {
  it("crée le visa avec l'agent de la session, conforme par défaut", async () => {
    const create = vi.fn().mockResolvedValue({});
    await caller(create).release({ orderId: "order-1" });

    expect(create).toHaveBeenCalledWith({
      data: { orderId: "order-1", agentId: "agent-1", conform: true, note: null },
    });
  });

  it("transmet une note d'écart quand elle est fournie", async () => {
    const create = vi.fn().mockResolvedValue({});
    await caller(create).release({ orderId: "order-1", note: "Carton manquant" });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ note: "Carton manquant" }) })
    );
  });

  it("enregistre un visa non conforme accompagné de son motif", async () => {
    const create = vi.fn().mockResolvedValue({});
    await caller(create).release({ orderId: "order-1", conform: false, note: "1 carton manquant au caddie 2" });

    expect(create).toHaveBeenCalledWith({
      data: { orderId: "order-1", agentId: "agent-1", conform: false, note: "1 carton manquant au caddie 2" },
    });
  });

  it("refuse un écart sans motif", async () => {
    const create = vi.fn().mockResolvedValue({});
    await expect(caller(create).release({ orderId: "order-1", conform: false })).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it("refuse un écart dont le motif est trop court", async () => {
    const create = vi.fn().mockResolvedValue({});
    await expect(
      caller(create).release({ orderId: "order-1", conform: false, note: "ko" })
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it("refuse un second contrôle sur la même commande", async () => {
    const create = vi.fn().mockRejectedValue(new Error("Unique constraint failed"));
    await expect(caller(create).release({ orderId: "order-1" })).rejects.toBeInstanceOf(TRPCError);
  });
});
