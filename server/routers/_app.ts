import { router } from "@/server/trpc";
import { accountRouter } from "./account";
import { productsRouter } from "./products";
import { ordersRouter } from "./orders";
import { preparationRouter } from "./preparation";
import { livraisonRouter } from "./livraison";
import { securiteRouter } from "./securite";
import { stockRouter } from "./stock";
import { rapportsRouter } from "./rapports";

export const appRouter = router({
  account: accountRouter,
  products: productsRouter,
  orders: ordersRouter,
  preparation: preparationRouter,
  livraison: livraisonRouter,
  securite: securiteRouter,
  stock: stockRouter,
  rapports: rapportsRouter,
});

export type AppRouter = typeof appRouter;
