import { describe, expect, it } from "vitest";
import {
  formatParisDate,
  formatParisTime,
  parisOffsetMs,
  parisParts,
  parisWallClockToUtc,
  parisWeekday,
  startOfParisDay,
  startOfParisMonth,
  startOfParisWeek,
} from "./timezone";

const HOUR = 3_600_000;

describe("parisParts", () => {
  it("lit l'heure d'été (UTC+2)", () => {
    // 19 août 2026, 03:44 UTC → 05:44 à Paris.
    expect(parisParts(new Date("2026-08-19T03:44:00Z"))).toEqual({
      year: 2026,
      month: 8,
      day: 19,
      hour: 5,
      minute: 44,
      second: 0,
    });
  });

  it("lit l'heure d'hiver (UTC+1)", () => {
    expect(parisParts(new Date("2026-01-15T03:44:00Z"))).toMatchObject({ hour: 4, day: 15 });
  });

  it("rend minuit comme 0 et non comme 24", () => {
    expect(parisParts(new Date("2026-08-18T22:00:00Z")).hour).toBe(0);
  });
});

describe("parisOffsetMs", () => {
  it("vaut +2 h en été et +1 h en hiver", () => {
    expect(parisOffsetMs(new Date("2026-08-19T12:00:00Z"))).toBe(2 * HOUR);
    expect(parisOffsetMs(new Date("2026-01-19T12:00:00Z"))).toBe(1 * HOUR);
  });
});

describe("startOfParisDay", () => {
  it("renvoie 22:00 UTC la veille en été", () => {
    const start = startOfParisDay(new Date("2026-08-19T14:00:00Z"));
    expect(start.toISOString()).toBe("2026-08-18T22:00:00.000Z");
  });

  it("renvoie 23:00 UTC la veille en hiver", () => {
    const start = startOfParisDay(new Date("2026-01-19T14:00:00Z"));
    expect(start.toISOString()).toBe("2026-01-18T23:00:00.000Z");
  });

  it("range un instant d'après minuit UTC dans le bon jour parisien", () => {
    // 00:30 UTC le 20 août = 02:30 à Paris le 20 : la journée parisienne est bien celle du 20.
    const start = startOfParisDay(new Date("2026-08-20T00:30:00Z"));
    expect(start.toISOString()).toBe("2026-08-19T22:00:00.000Z");
  });

  it("range 23:30 UTC dans la journée parisienne du lendemain", () => {
    // 23:30 UTC le 19 août = 01:30 à Paris le 20 : c'est le piège que corrige le fuseau.
    const start = startOfParisDay(new Date("2026-08-19T23:30:00Z"));
    expect(start.toISOString()).toBe("2026-08-19T22:00:00.000Z");
  });
});

describe("changements d'heure", () => {
  it("gère le passage à l'heure d'été (dernier dimanche de mars)", () => {
    // 29 mars 2026 : 02:00 devient 03:00. La journée démarre encore en UTC+1.
    const start = startOfParisDay(new Date("2026-03-29T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-03-28T23:00:00.000Z");
  });

  it("gère le passage à l'heure d'hiver (dernier dimanche d'octobre)", () => {
    // 25 octobre 2026 : 03:00 revient à 02:00. La journée démarre en UTC+2.
    const start = startOfParisDay(new Date("2026-10-25T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-10-24T22:00:00.000Z");
  });
});

describe("parisWeekday", () => {
  it("numérote dimanche 0 et lundi 1", () => {
    expect(parisWeekday(new Date("2026-08-23T12:00:00Z"))).toBe(0); // dimanche
    expect(parisWeekday(new Date("2026-08-24T12:00:00Z"))).toBe(1); // lundi
  });

  it("bascule de jour selon l'heure parisienne, pas UTC", () => {
    // 23:30 UTC dimanche = 01:30 lundi à Paris.
    expect(parisWeekday(new Date("2026-08-23T23:30:00Z"))).toBe(1);
  });
});

describe("startOfParisWeek", () => {
  it("remonte au lundi depuis un mercredi", () => {
    const start = startOfParisWeek(new Date("2026-08-26T12:00:00Z")); // mercredi
    expect(start.toISOString()).toBe("2026-08-23T22:00:00.000Z"); // lundi 24 à 00:00 Paris
  });

  it("rattache le dimanche à la semaine écoulée", () => {
    const start = startOfParisWeek(new Date("2026-08-23T12:00:00Z")); // dimanche
    expect(start.toISOString()).toBe("2026-08-16T22:00:00.000Z"); // lundi 17 à 00:00 Paris
  });

  it("reste sur place un lundi", () => {
    const start = startOfParisWeek(new Date("2026-08-24T09:00:00Z"));
    expect(start.toISOString()).toBe("2026-08-23T22:00:00.000Z");
  });
});

describe("startOfParisMonth", () => {
  it("renvoie le 1er du mois à minuit heure de Paris", () => {
    const start = startOfParisMonth(new Date("2026-08-19T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-07-31T22:00:00.000Z");
  });
});

describe("parisWallClockToUtc", () => {
  it("convertit une heure murale d'été", () => {
    expect(parisWallClockToUtc(2026, 8, 19, 6, 30).toISOString()).toBe("2026-08-19T04:30:00.000Z");
  });

  it("convertit une heure murale d'hiver", () => {
    expect(parisWallClockToUtc(2026, 1, 19, 6, 30).toISOString()).toBe("2026-01-19T05:30:00.000Z");
  });

  it("accepte un jour hors bornes et le reporte sur le mois précédent", () => {
    // Utilisé par startOfParisWeek quand le lundi tombe le mois d'avant.
    expect(parisWallClockToUtc(2026, 8, 0).toISOString()).toBe("2026-07-30T22:00:00.000Z");
  });
});

describe("formatage", () => {
  it("affiche l'heure de Paris quel que soit le fuseau du processus", () => {
    expect(formatParisTime(new Date("2026-08-19T03:44:00Z"))).toBe("05:44");
    expect(formatParisTime(new Date("2026-01-19T03:44:00Z"))).toBe("04:44");
  });

  it("affiche la date de Paris", () => {
    // 23:30 UTC le 19 = déjà le 20 à Paris.
    expect(formatParisDate(new Date("2026-08-19T23:30:00Z"), { day: "2-digit", month: "2-digit" })).toBe("20/08");
  });
});
