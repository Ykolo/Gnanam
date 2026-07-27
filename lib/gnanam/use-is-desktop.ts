"use client";

import { useEffect, useState } from "react";

const BREAKPOINT = 860;

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= BREAKPOINT);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isDesktop ?? true;
}
