import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { catalogRouter } from "./catalog";
import { fakeContext, fakeUser } from "./test-utils";
import { Category, Zone } from "@/lib/generated/prisma/enums";

function caller(prisma: Record<string, unknown>, role: "admin" | "entrepot" = "admin") {
  return catalogRouter.createCaller(fakeContext(fakeUser(role), prisma));
}

const validInput = {
  sku: "p19",
  name: "Ananas Victoria",
  unit: "Colis 5 kg",
  priceCents: 2650,
  category: Category.FruitsLegumes,
  zone: Zone.Frais,
  minStock: 8,
};

describe("catalog.list", () => {
  it("remonte aussi les références désactivées, actives d'abord", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await caller({ product: { findMany } }).list();

    expect(findMany).toHaveBeenCalledWith({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  });
});

describe("catalog.create", () => {
  it("crée la référence et déduit le chemin du visuel du SKU", async () => {
    const product = {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "prod-1", sku: "p19" }),
    };

    await caller({ product }).create(validInput);

    expect(product.create).toHaveBeenCalledWith({
      data: { ...validInput, imageUrl: "/produits/p19.webp" },
      select: { id: true, sku: true },
    });
  });

  it("refuse un SKU déjà utilisé", async () => {
    const product = {
      findUnique: vi.fn().mockResolvedValue({ id: "prod-existant" }),
      create: vi.fn(),
    };

    await expect(caller({ product }).create(validInput)).rejects.toBeInstanceOf(TRPCError);
    expect(product.create).not.toHaveBeenCalled();
  });

  it("refuse un prix nul ou négatif", async () => {
    const product = { findUnique: vi.fn(), create: vi.fn() };
    await expect(caller({ product }).create({ ...validInput, priceCents: 0 })).rejects.toThrow();
    await expect(caller({ product }).create({ ...validInput, priceCents: -100 })).rejects.toThrow();
  });

  it("refuse un SKU contenant des caractères inattendus", async () => {
    const product = { findUnique: vi.fn(), create: vi.fn() };
    await expect(caller({ product }).create({ ...validInput, sku: "p 19/bis" })).rejects.toThrow();
  });
});

describe("catalog.update", () => {
  it("met à jour les champs sans toucher au SKU", async () => {
    const update = vi.fn().mockResolvedValue({});
    // `update` n'accepte pas de SKU : on envoie exactement les champs modifiables.
    const fields = {
      name: validInput.name,
      unit: validInput.unit,
      priceCents: validInput.priceCents,
      category: validInput.category,
      zone: validInput.zone,
      minStock: validInput.minStock,
    };

    await caller({ product: { update } }).update({ id: "prod-1", ...fields });

    expect(update).toHaveBeenCalledWith({ where: { id: "prod-1" }, data: fields });
  });
});

describe("catalog.setActive", () => {
  it("désactive une référence plutôt que de la supprimer", async () => {
    const update = vi.fn().mockResolvedValue({});
    await caller({ product: { update } }).setActive({ id: "prod-1", active: false });

    expect(update).toHaveBeenCalledWith({ where: { id: "prod-1" }, data: { active: false } });
  });

  it("sait la réactiver", async () => {
    const update = vi.fn().mockResolvedValue({});
    await caller({ product: { update } }).setActive({ id: "prod-1", active: true });

    expect(update).toHaveBeenCalledWith({ where: { id: "prod-1" }, data: { active: true } });
  });
});

describe("contrôle d'accès", () => {
  it("interdit le catalogue aux profils non admin", async () => {
    const product = { findMany: vi.fn() };
    await expect(caller({ product }, "entrepot").list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(product.findMany).not.toHaveBeenCalled();
  });
});
