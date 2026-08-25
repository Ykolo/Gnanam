/**
 * Toutes les dates métier sont raisonnées à l'heure de Paris.
 *
 * Sans ça, les fonctions serverless (qui tournent en UTC) feraient basculer la
 * journée à 2 h du matin heure française en été : le rapport « journalier » et
 * la file des commandes du jour changeraient de contenu en pleine nuit, alors
 * que l'entrepôt commence à 6 h. Le fuseau est figé plutôt que déduit de la
 * machine, pour que le serveur et le navigateur affichent la même chose.
 */

export const TZ = "Europe/Paris";

const PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Champs calendaires d'un instant, lus à Paris. */
export function parisParts(d: Date): ZonedParts {
  const found: Record<string, string> = {};
  for (const part of PARTS.formatToParts(d)) {
    if (part.type !== "literal") found[part.type] = part.value;
  }
  return {
    year: Number(found.year),
    month: Number(found.month),
    day: Number(found.day),
    // Certaines implémentations rendent minuit comme « 24 » en hour12: false.
    hour: Number(found.hour) % 24,
    minute: Number(found.minute),
    second: Number(found.second),
  };
}

/** Décalage de Paris par rapport à UTC à cet instant, en millisecondes (+1 h ou +2 h). */
export function parisOffsetMs(d: Date): number {
  const p = parisParts(d);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(d.getTime() / 1000) * 1000;
}

/**
 * Instant correspondant à une heure murale parisienne.
 *
 * Le décalage dépend de l'instant qu'on cherche justement à calculer : on part
 * d'une estimation, puis on la corrige avec le décalage réellement en vigueur
 * au résultat. Ce second passage est ce qui rend les nuits de changement
 * d'heure correctes.
 */
export function parisWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstGuess = new Date(naive - parisOffsetMs(new Date(naive)));
  const corrected = new Date(naive - parisOffsetMs(firstGuess));
  return corrected;
}

/** Minuit à Paris, le jour où tombe `d`. */
export function startOfParisDay(d: Date = new Date()): Date {
  const { year, month, day } = parisParts(d);
  return parisWallClockToUtc(year, month, day);
}

/** Jour de la semaine à Paris : 0 = dimanche, 1 = lundi… */
export function parisWeekday(d: Date): number {
  const { year, month, day } = parisParts(d);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Lundi minuit à Paris, la semaine où tombe `d`. */
export function startOfParisWeek(d: Date = new Date()): Date {
  const { year, month, day } = parisParts(d);
  const weekday = parisWeekday(d);
  // Dimanche appartient à la semaine qui a commencé le lundi précédent.
  const backToMonday = weekday === 0 ? 6 : weekday - 1;
  return parisWallClockToUtc(year, month, day - backToMonday);
}

/** Premier jour du mois, minuit à Paris. */
export function startOfParisMonth(d: Date = new Date()): Date {
  const { year, month } = parisParts(d);
  return parisWallClockToUtc(year, month, 1);
}

/**
 * Formatages figés sur Paris. Utilisés aussi côté client : un composant rendu
 * sur le serveur puis hydraté dans le navigateur produirait sinon deux textes
 * différents si les deux fuseaux divergent.
 */
export function formatParisTime(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

export function formatParisDate(d: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return d.toLocaleDateString("fr-FR", { timeZone: TZ, ...options });
}
