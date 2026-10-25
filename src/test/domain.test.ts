import { describe, expect, it } from "vitest";
import { daysUntil, levelFromXp, nextStreak, scheduleCard } from "@/lib/domain";

describe("levels", () => {
  it("250 XP per level", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(249).level).toBe(1);
    expect(levelFromXp(250).level).toBe(2);
  });
});

describe("streak", () => {
  const today = new Date("2026-10-25T12:00:00Z");
  it("continues from yesterday", () => expect(nextStreak("2026-10-24", 4, today)).toBe(5));
  it("unchanged same day", () => expect(nextStreak("2026-10-25", 4, today)).toBe(4));
  it("resets after a gap", () => expect(nextStreak("2026-10-20", 4, today)).toBe(1));
});

describe("countdown", () => {
  it("counts days to exam", () =>
    expect(daysUntil("2026-11-01", new Date("2026-10-25T20:00:00Z"))).toBe(7));
});

describe("spaced repetition", () => {
  const now = new Date("2026-10-25T12:00:00Z");
  it("hard shows again soon", () =>
    expect(scheduleCard({ interval_days: 5, ease: 2.5 }, "svårt", now).interval_days).toBe(0));
  it("easy first review waits 3 days", () =>
    expect(scheduleCard({ interval_days: 0, ease: 2.5 }, "lätt", now).interval_days).toBe(3));
  it("medium first review waits 1 day", () =>
    expect(scheduleCard({ interval_days: 0, ease: 2.5 }, "medel", now).interval_days).toBe(1));
});

import { passProbability } from "@/lib/domain";
describe("pass probability (52 of 65)", () => {
  it("perfect accuracy always passes", () => expect(passProbability(1)).toBe(1));
  it("50% accuracy almost never passes", () => expect(passProbability(0.5)).toBeLessThan(0.001));
  it("90% accuracy usually passes", () => expect(passProbability(0.9)).toBeGreaterThan(0.9));
});
