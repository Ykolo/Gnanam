"use client";

import { useEffect, useState } from "react";

/**
 * Horloge locale rafraîchie chaque seconde. Renvoie `null` avant le montage
 * pour éviter tout écart entre le rendu serveur et l'hydratation.
 */
export function useLiveClock(): string | null {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}
