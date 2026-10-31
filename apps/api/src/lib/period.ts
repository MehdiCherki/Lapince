import type { PeriodType } from "@prisma/client";

// Période en cours d'un budget : [start, end[ (début inclus, fin exclue).
// Les dépenses sont saisies au jour et enregistrées à minuit UTC : les bornes sont donc des dates à minuit UTC.
// Le jour courant, lui, est celui de Paris : le 1er novembre à 0 h 30 est déjà en novembre.
// « custom » n'a aucune date enregistrée : pas de borne (null), le dépassement porte sur toutes les dépenses.
export function periodBounds(
  period: PeriodType,
  now: Date = new Date(),
): { start: Date; end: Date } | null {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number) as [number, number, number];

  if (period === "monthly") {
    return {
      start: new Date(Date.UTC(year, month - 1, 1)),
      end: new Date(Date.UTC(year, month, 1)),
    };
  }
  if (period === "weekly") {
    const today = new Date(Date.UTC(year, month - 1, day));
    const daysSinceMonday = (today.getUTCDay() + 6) % 7; // getUTCDay : 0 = dimanche
    const start = new Date(Date.UTC(year, month - 1, day - daysSinceMonday));
    return { start, end: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000) };
  }
  return null;
}
