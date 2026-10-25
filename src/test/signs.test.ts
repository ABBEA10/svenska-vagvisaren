import { describe, expect, it } from "vitest";
import { planSignQuestions, SIGN_CODES } from "../lib/signs";

describe("vägmärkesövningens variation", () => {
  it("ger fem olika frågevinklar och fem olika märken i en snabbövning", () => {
    const plan = planSignQuestions(5);
    expect(plan).toHaveLength(5);
    expect(new Set(plan.map((q) => q.angle)).size).toBe(5);
    expect(new Set(plan.map((q) => q.signCode)).size).toBe(5);
    for (const q of plan) expect(SIGN_CODES).toContain(q.signCode);
  });

  it("upprepar inte märken inom ett kategoriprov med tio frågor", () => {
    const plan = planSignQuestions(10);
    expect(plan).toHaveLength(10);
    expect(new Set(plan.map((q) => q.signCode)).size).toBe(10);
  });
});