"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Déconnexion : Better Auth invalide la session et supprime le cookie, puis
 * `refresh()` refait tourner la page serveur, qui renvoie l'écran de connexion.
 */
export function useLogout() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return {
    pending,
    logout: async () => {
      setPending(true);
      await authClient.signOut();
      router.refresh();
    },
  };
}
