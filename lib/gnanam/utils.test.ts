import { describe, expect, it } from "vitest";
import { Zone } from "@/lib/generated/prisma/enums";
import {
  eur,
  eurCents,
  initialsOf,
  kgMatch,
  normalize,
  packMatch,
  plural,
  unitPriceLabel,
  zonesOf,
} from "./utils";

describe("eur", () => {
  it("formate avec la virgule française et deux décimales", () => {
    expect(eur(24)).toBe("24,00 €");
    expect(eur(4.5)).toBe("4,50 €");
    expect(eur(0)).toBe("0,00 €");
  });
});

describe("eurCents", () => {
  it("convertit des centimes entiers en euros formatés", () => {
    expect(eurCents(2400)).toBe("24,00 €");
    expect(eurCents(155)).toBe("1,55 €");
  });
});

describe("plural", () => {
  it("n'accorde pas au singulier", () => {
    expect(plural(1, "caddie")).toBe("1 caddie");
    expect(plural(0, "caddie")).toBe("0 caddie");
  });

  it("accorde au pluriel au-delà de 1", () => {
    expect(plural(2, "caddie")).toBe("2 caddies");
    expect(plural(12, "ligne")).toBe("12 lignes");
  });
});

describe("normalize", () => {
  it("met en minuscule et retire les accents", () => {
    expect(normalize("Épicerie")).toBe("epicerie");
    expect(normalize("Surgelé")).toBe("surgele");
    expect(normalize("BANANE PLANTAIN")).toBe("banane plantain");
  });
});

describe("kgMatch", () => {
  it("extrait un poids en kg", () => {
    expect(kgMatch("Colis 6 kg")).toBe(6);
    expect(kgMatch("Sac 20 kg")).toBe(20);
  });

  it("gère les décimales avec virgule", () => {
    expect(kgMatch("Colis 2,5 kg")).toBe(2.5);
  });

  it("renvoie null en l'absence de kg", () => {
    expect(kgMatch("Pack ×12")).toBeNull();
  });
});

describe("packMatch", () => {
  it("extrait un nombre d'unités par pack", () => {
    expect(packMatch("Carton ×24")).toBe(24);
    expect(packMatch("Pack ×12")).toBe(12);
  });

  it("renvoie null en l'absence de ×N", () => {
    expect(packMatch("Sac 20 kg")).toBeNull();
  });
});

describe("unitPriceLabel", () => {
  it("calcule le prix au kilo quand l'unité porte un poids", () => {
    expect(unitPriceLabel("Colis 6 kg", 24)).toBe("4,00 € / kg");
  });

  it("calcule le prix à l'unité quand l'unité porte un multiple", () => {
    expect(unitPriceLabel("Pack ×12", 15.6)).toBe("1,30 € / unité");
  });

  it("retombe sur « le colis » sans poids ni multiple", () => {
    expect(unitPriceLabel("Bouteille 1L", 10)).toBe("le colis");
  });
});

describe("initialsOf", () => {
  it("prend l'initiale des deux premiers mots", () => {
    expect(initialsOf("Épicerie Mont Kailash")).toBe("ÉM");
    expect(initialsOf("Direction GNANAM EXO")).toBe("DG");
  });

  it("gère un seul mot", () => {
    expect(initialsOf("Admin")).toBe("A");
  });
});

describe("zonesOf", () => {
  const lines = [
    { product: { zone: Zone.Frais } },
    { product: { zone: Zone.Sec } },
    { product: { zone: Zone.Frais } },
    { product: { zone: Zone.Surgele } },
  ];

  it("regroupe par zone dans l'ordre Sec puis Frais puis Surgelé", () => {
    const groups = zonesOf(lines, true);
    expect(groups.map((g) => g.zone)).toEqual([Zone.Sec, Zone.Frais, Zone.Surgele]);
    expect(groups.find((g) => g.zone === Zone.Frais)?.idxs).toEqual([0, 2]);
    expect(groups.find((g) => g.zone === Zone.Sec)?.idxs).toEqual([1]);
    expect(groups.find((g) => g.zone === Zone.Surgele)?.idxs).toEqual([3]);
  });

  it("omet les zones sans ligne", () => {
    const groups = zonesOf([{ product: { zone: Zone.Frais } }], true);
    expect(groups).toHaveLength(1);
    expect(groups[0].zone).toBe(Zone.Frais);
  });

  it("renvoie un seul caddie non groupé quand groupByZone est faux", () => {
    const groups = zonesOf(lines, false);
    expect(groups).toEqual([{ zone: "Tous produits", idxs: [0, 1, 2, 3] }]);
  });
});
