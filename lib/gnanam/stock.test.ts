import { describe, expect, it } from "vitest";
import { levelOf } from "./stock";

describe("levelOf", () => {
  it("est en rupture quand le disponible est nul ou négatif", () => {
    expect(levelOf(0, 10)).toBe("rupture");
    expect(levelOf(-3, 10)).toBe("rupture");
  });

  it("est sous le seuil quand le disponible est positif mais inférieur au minimum", () => {
    expect(levelOf(5, 10)).toBe("critique");
    expect(levelOf(9, 10)).toBe("critique");
  });

  it("est disponible quand le disponible atteint ou dépasse le minimum", () => {
    expect(levelOf(10, 10)).toBe("ok");
    expect(levelOf(50, 10)).toBe("ok");
  });

  it("est disponible quand il n'y a pas de seuil défini", () => {
    expect(levelOf(1, 0)).toBe("ok");
  });
});
