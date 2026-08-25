import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ROLES } from "@/lib/gnanam/data";
import type { RoleId } from "@/lib/gnanam/types";
import { GnanamStoreProvider } from "@/lib/gnanam/store";
import { SessionProvider, type AppSession } from "@/lib/gnanam/session";
import { TrpcProvider } from "@/lib/trpc/client";
import { GnanamApp } from "@/components/gnanam/gnanam-app";
import { AuthScreen } from "@/components/gnanam/auth-screen";

/** Le rôle est lu sur la session serveur : le client ne peut pas se l'attribuer. */
function readRole(value: unknown): RoleId {
  return value === "entrepot" || value === "securite" || value === "admin" ? value : "client";
}

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="h-full w-full bg-[var(--gnanam-cream)] text-[var(--gnanam-ink)]">
      <TrpcProvider>
        {session ? <AuthedApp session={session} /> : <AuthScreen />}
      </TrpcProvider>
    </div>
  );
}

function AuthedApp({ session }: { session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>> }) {
  const role = readRole(session.user.role);
  const appSession: AppSession = {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
    customerId: session.user.customerId ?? null,
  };

  return (
    <SessionProvider value={appSession}>
      <GnanamStoreProvider initialModule={ROLES[role].modules[0]}>
        <GnanamApp />
      </GnanamStoreProvider>
    </SessionProvider>
  );
}
