"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { RoleId } from "./types";

/** Identité du poste connecté, dérivée de la session Better Auth côté serveur. */
export interface AppSession {
  userId: string;
  name: string;
  email: string;
  role: RoleId;
  /** Renseigné pour les comptes client, null pour les postes internes. */
  customerId: string | null;
}

const SessionContext = createContext<AppSession | null>(null);

export function SessionProvider({ value, children }: { value: AppSession; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): AppSession {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession doit être utilisé dans un SessionProvider");
  return session;
}
