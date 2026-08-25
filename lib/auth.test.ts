import { describe, expect, it } from "vitest";
import { resolveBaseURL, resolveTrustedOrigins } from "./auth";

function env(values: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

describe("resolveBaseURL", () => {
  it("privilégie la variable explicite quand elle existe", () => {
    expect(
      resolveBaseURL(env({ BETTER_AUTH_URL: "https://gnanam.vercel.app", VERCEL_URL: "autre.vercel.app" }))
    ).toBe("https://gnanam.vercel.app");
  });

  it("retombe sur l'alias de branche en preview", () => {
    expect(
      resolveBaseURL(env({ VERCEL_BRANCH_URL: "gnanam-git-ma-branche.vercel.app", VERCEL_URL: "gnanam-abc123.vercel.app" }))
    ).toBe("https://gnanam-git-ma-branche.vercel.app");
  });

  it("retombe sur l'URL du déploiement à défaut d'alias de branche", () => {
    expect(resolveBaseURL(env({ VERCEL_URL: "gnanam-abc123.vercel.app" }))).toBe("https://gnanam-abc123.vercel.app");
  });

  it("renvoie undefined hors Vercel et sans variable — Better Auth déduit alors depuis la requête", () => {
    expect(resolveBaseURL(env({}))).toBeUndefined();
  });
});

describe("resolveTrustedOrigins", () => {
  it("rassemble toutes les origines connues", () => {
    const origins = resolveTrustedOrigins(
      env({
        BETTER_AUTH_URL: "https://gnanam.vercel.app",
        VERCEL_BRANCH_URL: "gnanam-git-ma-branche.vercel.app",
        VERCEL_URL: "gnanam-abc123.vercel.app",
      })
    );
    expect(origins).toEqual([
      "https://gnanam.vercel.app",
      "https://gnanam-git-ma-branche.vercel.app",
      "https://gnanam-abc123.vercel.app",
    ]);
  });

  it("déduplique quand deux variables donnent la même origine", () => {
    const origins = resolveTrustedOrigins(
      env({ BETTER_AUTH_URL: "https://gnanam.vercel.app", VERCEL_PROJECT_PRODUCTION_URL: "gnanam.vercel.app" })
    );
    expect(origins).toEqual(["https://gnanam.vercel.app"]);
  });

  it("renvoie une liste vide sans environnement", () => {
    expect(resolveTrustedOrigins(env({}))).toEqual([]);
  });
});
