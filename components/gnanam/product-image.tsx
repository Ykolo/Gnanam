"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/gnanam/types";
import { CAT_COLORS } from "@/lib/gnanam/data";
import { initialsOf } from "@/lib/gnanam/utils";

/**
 * Visuel produit servi depuis public/produits/<id>.webp, sur le fond de sa
 * catégorie — les photos ont été détourées sur cette même couleur, le raccord
 * est donc invisible. Repli sur les initiales si le fichier manque, ce qui
 * arrive pour toute référence ajoutée après coup depuis le module catalogue.
 *
 * L'alternative textuelle est vide : le nom du produit est toujours affiché
 * juste à côté, la répéter n'apporterait rien à un lecteur d'écran.
 */
export function ProductImage({
  product,
  sizes,
  className = "",
  fallbackClass = "text-[21px]",
}: {
  product: Product;
  sizes: string;
  className?: string;
  fallbackClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [tileBg, tileFg] = CAT_COLORS[product.cat];

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: tileBg }}>
      {failed ? (
        <div
          className={`flex h-full w-full items-center justify-center font-extrabold ${fallbackClass}`}
          style={{ color: tileFg }}
        >
          {initialsOf(product.name)}
        </div>
      ) : (
        <Image
          src={`/produits/${product.id}.webp`}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
