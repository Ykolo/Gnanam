import { router } from "@/server/trpc";
import { accountRouter } from "./account";
import { productsRouter } from "./products";

export const appRouter = router({
  account: accountRouter,
  products: productsRouter,
});

export type AppRouter = typeof appRouter;
