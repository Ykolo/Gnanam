/**
 * Jeu de données de démonstration.
 *
 * Reprend le catalogue et les commandes du prototype (lib/gnanam/data.ts) et y
 * ajoute environ trois mois d'historique livré, sans lequel les rapports admin
 * n'auraient rien à agréger. Les numéros de commande sont calés pour que la
 * journée en cours démarre à CMD-1040, comme dans la maquette.
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRODUCTS, STOCK_SEED, INITIAL_ORDERS, INITIAL_MOVES } from "@/lib/gnanam/data";
import type { Category as CategoryLabel, Zone as ZoneLabel } from "@/lib/gnanam/types";
import { Category, LineStatus, OrderStatus, StockMoveKind, Zone } from "@/lib/generated/prisma/enums";

const CATEGORY: Record<CategoryLabel, Category> = {
  "Fruits & Légumes": Category.FruitsLegumes,
  "Épicerie": Category.Epicerie,
  "Surgelés": Category.Surgeles,
  Boissons: Category.Boissons,
};

const ZONE: Record<ZoneLabel, Zone> = {
  Frais: Zone.Frais,
  Sec: Zone.Sec,
  "Surgelé": Zone.Surgele,
};

const CUSTOMERS = [
  {
    key: "baobab",
    name: "Restaurant Le Baobab",
    siret: "84219756300021",
    address: "12 rue des Pyramides, 75001 Paris",
    contactEmail: "commandes@lebaobab.fr",
  },
  {
    key: "kailash",
    name: "Épicerie Mont Kailash",
    siret: "51037842900018",
    address: "48 rue du Faubourg St-Denis, 75010 Paris",
    contactEmail: "contact@montkailash.fr",
  },
  {
    key: "exoplus",
    name: "Supermarché Exo Plus",
    siret: "79284510600035",
    address: "7 av. de la République, 93300 Aubervilliers",
    contactEmail: "achats@exoplus.fr",
  },
  {
    key: "lankaises",
    name: "Traiteur Saveurs Lankaises",
    siret: "88451209700014",
    address: "23 rue Cail, 75010 Paris",
    contactEmail: "saveurs.lankaises@gmail.com",
  },
];

const DEMO_PASSWORD = "gnanam2026";

const USERS = [
  { email: "client@gnanam.test", name: "Épicerie Mont Kailash", role: "client", customerKey: "kailash" },
  { email: "entrepot@gnanam.test", name: "Préparateur — Rungis", role: "entrepot", customerKey: null },
  { email: "securite@gnanam.test", name: "Agent sécurité — sortie A", role: "securite", customerKey: null },
  { email: "admin@gnanam.test", name: "Direction GNANAM EXO", role: "admin", customerKey: null },
];

const WINDOWS = ["6h – 9h", "8h – 11h", "9h – 12h", "6h – 8h", "14h – 17h"];

/** Générateur pseudo-aléatoire déterministe : deux seeds donnent la même base. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260818);
const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

/** Nombre de jours d'historique généré avant aujourd'hui. */
const HISTORY_DAYS = 90;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function at(day: Date, hour: number, minute: number): Date {
  const c = new Date(day);
  c.setHours(hour, minute, 0, 0);
  return c;
}

async function main() {
  console.log("Nettoyage…");
  await prisma.stockMove.deleteMany();
  await prisma.securityClearance.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();

  console.log("Clients B2B…");
  const customerIds: Record<string, string> = {};
  for (const c of CUSTOMERS) {
    const created = await prisma.customer.create({
      data: { name: c.name, siret: c.siret, address: c.address, contactEmail: c.contactEmail },
    });
    customerIds[c.key] = created.id;
  }

  console.log("Comptes…");
  // Les comptes passent par Better Auth plutôt que par un INSERT direct : lui
  // seul connaît le format exact du hachage et des colonnes de `account`
  // (l'`issuer`, par exemple, a changé en 1.7). Le rôle est ensuite posé en
  // base, puisqu'il est volontairement non modifiable à l'inscription.
  const userIds: Record<string, string> = {};
  for (const u of USERS) {
    const { user } = await auth.api.signUpEmail({
      body: { email: u.email, password: DEMO_PASSWORD, name: u.name },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: u.role,
        emailVerified: true,
        customerId: u.customerKey ? customerIds[u.customerKey] : null,
      },
    });
    userIds[u.role] = user.id;
  }

  console.log("Catalogue…");
  const productIds: Record<string, string> = {};
  for (const p of PRODUCTS) {
    const created = await prisma.product.create({
      data: {
        sku: p.id,
        name: p.name,
        unit: p.unit,
        priceCents: Math.round(p.price * 100),
        category: CATEGORY[p.cat],
        zone: ZONE[p.zone],
        minStock: STOCK_SEED[p.id]?.min ?? 0,
        quantity: STOCK_SEED[p.id]?.qty ?? 0,
        imageUrl: `/produits/${p.id}.webp`,
      },
    });
    productIds[p.id] = created.id;
  }

  // Historique : commandes livrées des 90 derniers jours, hors dimanches.
  const today = startOfDay(new Date());
  const history: {
    customerKey: string;
    createdAt: Date;
    readyAt: Date;
    deliveredAt: Date;
    windowLabel: string;
    lines: { sku: string; qty: number; picked: number; status: LineStatus }[];
    conform: boolean;
  }[] = [];

  for (let d = HISTORY_DAYS; d >= 1; d--) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);
    if (day.getDay() === 0) continue;
    const count = day.getDay() === 6 ? between(3, 6) : between(9, 16);

    for (let i = 0; i < count; i++) {
      const hour = between(6, 16);
      const createdAt = at(day, hour, between(0, 59));
      const readyAt = new Date(createdAt.getTime() + between(14, 38) * 60_000);
      const deliveredAt = new Date(readyAt.getTime() + between(35, 150) * 60_000);

      const skus = new Set<string>();
      const lineCount = between(3, 8);
      while (skus.size < lineCount) skus.add(pick(PRODUCTS).id);

      const lines = [...skus].map((sku) => {
        const qty = between(1, 5);
        const roll = rand();
        if (roll > 0.965) return { sku, qty, picked: 0, status: LineStatus.missing };
        if (roll > 0.9) return { sku, qty, picked: Math.max(1, qty - 1), status: LineStatus.partial };
        return { sku, qty, picked: qty, status: LineStatus.done };
      });

      history.push({
        customerKey: pick(CUSTOMERS).key,
        createdAt,
        readyAt,
        deliveredAt,
        windowLabel: pick(WINDOWS),
        lines,
        conform: rand() > 0.06,
      });
    }
  }

  // Cale la séquence pour que les commandes du jour démarrent à CMD-1040.
  const firstSeq = Math.max(1, 1040 - history.length);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "order_seq_seq" RESTART WITH ${firstSeq}`);

  console.log(`Historique : ${history.length} commandes livrées sur ${HISTORY_DAYS} jours…`);
  for (const h of history) {
    const order = await prisma.order.create({
      data: {
        customerId: customerIds[h.customerKey],
        status: OrderStatus.delivered,
        windowLabel: h.windowLabel,
        address: CUSTOMERS.find((c) => c.key === h.customerKey)!.address,
        createdAt: h.createdAt,
        readyAt: h.readyAt,
        deliveredAt: h.deliveredAt,
        pickedById: userIds.entrepot,
        signedBy: "Signature client",
        lines: {
          create: h.lines.map((l, position) => ({
            productId: productIds[l.sku],
            qty: l.qty,
            picked: l.picked,
            status: l.status,
            unitPriceCents: Math.round(PRODUCTS.find((p) => p.id === l.sku)!.price * 100),
            position,
          })),
        },
        clearance: {
          create: {
            agentId: userIds.securite,
            at: new Date(h.readyAt.getTime() + between(3, 20) * 60_000),
            conform: h.conform,
            note: h.conform ? null : "Écart constaté au contrôle sortie",
          },
        },
      },
    });
    void order;
  }

  console.log("Commandes du jour…");
  const CUSTOMER_BY_NAME = Object.fromEntries(CUSTOMERS.map((c) => [c.name, c]));
  // INITIAL_ORDERS est trié pour l'affichage ; on repart de l'ordre des numéros.
  const todayOrders = [...INITIAL_ORDERS].sort((a, b) => a.id.localeCompare(b.id));

  for (const o of todayOrders) {
    const c = CUSTOMER_BY_NAME[o.client];
    const createdAt = at(today, between(5, 7), between(0, 59));
    const ready = o.status === "ready" || o.status === "delivered";

    await prisma.order.create({
      data: {
        customerId: customerIds[c.key],
        status: OrderStatus[o.status],
        windowLabel: o.window,
        address: o.address,
        createdAt,
        readyAt: ready ? new Date(createdAt.getTime() + 24 * 60_000) : null,
        deliveredAt: o.status === "delivered" ? new Date(createdAt.getTime() + 95 * 60_000) : null,
        pickedById: ready ? userIds.entrepot : null,
        signedBy: o.status === "delivered" ? "Signature client" : null,
        lines: {
          create: o.lines.map((l, position) => ({
            productId: productIds[l.pid],
            qty: l.qty,
            picked: l.picked,
            status: LineStatus[l.status],
            unitPriceCents: Math.round(PRODUCTS.find((p) => p.id === l.pid)!.price * 100),
            position,
          })),
        },
        ...(o.status === "delivered"
          ? {
              clearance: {
                create: {
                  agentId: userIds.securite,
                  at: new Date(createdAt.getTime() + 40 * 60_000),
                  conform: true,
                },
              },
            }
          : {}),
      },
    });
  }

  console.log("Journal de stock…");
  for (const m of [...INITIAL_MOVES].reverse()) {
    const [h, min] = m.time.split(":").map(Number);
    await prisma.stockMove.create({
      data: {
        productId: productIds[m.pid],
        delta: m.delta,
        kind: StockMoveKind[m.kind],
        label: m.label,
        userId: m.kind === "reception" ? userIds.entrepot : userIds.entrepot,
        createdAt: at(today, h, min),
      },
    });
  }

  const counts = {
    clients: await prisma.customer.count(),
    comptes: await prisma.user.count(),
    produits: await prisma.product.count(),
    commandes: await prisma.order.count(),
    lignes: await prisma.orderLine.count(),
    mouvements: await prisma.stockMove.count(),
  };
  console.log("Terminé :", counts);
  console.log(`Comptes de démo — mot de passe « ${DEMO_PASSWORD} » :`);
  for (const u of USERS) console.log(`  ${u.role.padEnd(9)} ${u.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
