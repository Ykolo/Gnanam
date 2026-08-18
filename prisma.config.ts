// Chargé par la CLI Prisma (bunx prisma …). Next lit .env.local tout seul,
// mais la CLI non : on charge les deux, .env.local ayant la priorité car c'est
// le fichier écrit par `vercel env pull`.
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local", override: true, quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Les migrations passent par la connexion directe : le pooler Neon ne
    // supporte pas les verrous de session dont Prisma a besoin pour migrer.
    // L'application, elle, utilise la connexion poolée (voir lib/db.ts).
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
