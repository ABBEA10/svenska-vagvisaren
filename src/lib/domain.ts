export const CATEGORIES = [
  "Vägmärken",
  "Väjningsregler",
  "Trafiksäkerhet",
  "Miljö",
  "Fordonskunskap",
  "Motorväg",
  "Landsväg",
  "Stadskörning",
  "Mörkerkörning",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ["lätt", "medel", "svår"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DRIVING_SKILLS = [
  "Säkerhetskontroll",
  "Stadskörning",
  "Rondeller",
  "Parkering",
  "Landsväg",
  "Motorväg",
  "Mörkerkörning",
  "Halka",
  "Backning",
] as const;

/** XP rewards */
export const XP = {
  correctAnswer: 10,
  wrongAnswer: 2,
  flashcardReview: 5,
  drivingSession: 25,
} as const;

export const XP_PER_LEVEL = 250;

export function levelFromXp(xp: number) {
  const level = Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
  const into = Math.max(0, xp) % XP_PER_LEVEL;
  return { level, into, progress: into / XP_PER_LEVEL };
}

export function levelTitle(level: number) {
  if (level >= 12) return "Provredo";
  if (level >= 8) return "Trafikvan";
  if (level >= 5) return "Säker förare";
  if (level >= 3) return "Övningsförare";
  return "Nybörjare";
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** New streak given last active day (YYYY-MM-DD) and today. */
export function nextStreak(lastActive: string | null, current: number, today: Date) {
  const t = isoDay(today);
  if (lastActive === t) return current;
  const y = new Date(today);
  y.setUTCDate(y.getUTCDate() - 1);
  if (lastActive === isoDay(y)) return current + 1;
  return 1;
}

export function daysUntil(date: string | null, today: Date) {
  if (!date) return null;
  const target = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target - now) / 86_400_000);
}

export type Rating = "svårt" | "medel" | "lätt";

/** Simplified SM-2 spaced repetition. */
export function scheduleCard(
  card: { interval_days: number; ease: number },
  rating: Rating,
  now: Date,
) {
  let ease = card.ease;
  let interval: number;
  if (rating === "svårt") {
    ease = Math.max(1.3, ease - 0.2);
    interval = 0; // see again today
  } else if (rating === "medel") {
    interval = card.interval_days < 1 ? 1 : Math.round(card.interval_days * ease);
  } else {
    ease = ease + 0.15;
    interval = card.interval_days < 1 ? 3 : Math.round(card.interval_days * ease * 1.3);
  }
  const due = new Date(now);
  if (interval === 0) due.setMinutes(due.getMinutes() + 10);
  else due.setDate(due.getDate() + interval);
  return { interval_days: interval, ease, due_at: due.toISOString() };
}
