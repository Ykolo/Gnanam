import { GnanamStoreProvider } from "@/lib/gnanam/store";
import { GnanamApp } from "@/components/gnanam/gnanam-app";

export default function Home() {
  return (
    <div className="h-full w-full bg-[var(--gnanam-cream)] text-[var(--gnanam-ink)]">
      <GnanamStoreProvider>
        <GnanamApp />
      </GnanamStoreProvider>
    </div>
  );
}
