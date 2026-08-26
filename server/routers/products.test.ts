import { describe, expect, it, vi } from "vitest";
import { productsRouter } from "./products";
import { fakeContext, fakeUser } from "./test-utils";

describe("products.list", () => {
  it("exclut les références désactivées et trie par SKU", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const ctx = fakeContext(fakeUser("client"), { product: { findMany } });

    await productsRouter.createCaller(ctx).list();

    const call = findMany.mock.calls[0][0];
    expect(call.where).toEqual({ active: true });
    expect(call.orderBy).toEqual({ sku: "asc" });
  });

  it("ne remonte pas le champ `active` au client, qui n'en a pas l'usage", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const ctx = fakeContext(fakeUser("client"), { product: { findMany } });

    await productsRouter.createCaller(ctx).list();

    const selected = findMany.mock.calls[0][0].select;
    expect(selected.priceCents).toBe(true);
    expect(selected.active).toBeUndefined();
  });

  it("est ouvert à tous les profils connectés, pas seulement au client", async () => {
    for (const role of ["client", "entrepot", "securite", "admin"] as const) {
      const findMany = vi.fn().mockResolvedValue([]);
      const ctx = fakeContext(fakeUser(role), { product: { findMany } });

      await expect(productsRouter.createCaller(ctx).list()).resolves.toEqual([]);
      expect(findMany).toHaveBeenCalledOnce();
    }
  });

  it("refuse un visiteur sans session", async () => {
    const findMany = vi.fn();
    const ctx = fakeContext(null, { product: { findMany } });

    await expect(productsRouter.createCaller(ctx).list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});
