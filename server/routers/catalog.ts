import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "@/server/trpc";
import { Category, Zone } from "@/lib/generated/prisma/enums";

/**
 * Administration du catalogue.
 *
 * Une référence n'est jamais supprimée, seulement désactivée : les lignes de
 * commande déjà passées la référencent, et l'historique des rapports doit rester
 * lisible. `products.list` filtre sur `active`, cette liste-ci montre tout.
 */

const skuSchema = z
  .string()
  .trim()
  .min(1, "Référence obligatoire.")
  .max(32)
  .regex(/^[a-z0-9-]+$/i, "Lettres, chiffres et tirets uniquement.");

const productFields = {
  name: z.string().trim().min(2, "Nom trop court.").max(120),
  unit: z.string().trim().min(2, "Unité obligatoire.").max(60),
  priceCents: z.number().int().positive("Le prix doit être positif.").max(10_000_000),
  category: z.enum(Category),
  zone: z.enum(Zone),
  minStock: z.number().int().min(0).max(100_000),
};

export const catalogRouter = router({
  /** Catalogue complet, références désactivées comprises. */
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.product.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  }),

  create: adminProcedure
    .input(z.object({ sku: skuSchema, ...productFields }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.product.findUnique({ where: { sku: input.sku } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Cette référence existe déjà." });
      }
      return ctx.prisma.product.create({
        data: { ...input, imageUrl: `/produits/${input.sku}.webp` },
        select: { id: true, sku: true },
      });
    }),

  /** Le SKU n'est pas modifiable : il sert de nom de fichier au visuel produit. */
  update: adminProcedure
    .input(z.object({ id: z.string(), ...productFields }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.prisma.product.update({ where: { id }, data });
      return { ok: true };
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.product.update({ where: { id: input.id }, data: { active: input.active } });
      return { ok: true };
    }),
});
