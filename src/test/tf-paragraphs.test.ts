import { describe, it, expect } from "vitest";
import { verifyTfRef } from "@/lib/tf-paragraphs";
describe("verifyTfRef", () => {
  it("keeps verified högerregel paragraph", () => expect(verifyTfRef("3 kap. 18 §")).toBe("3 kap. 18 §"));
  it("keeps roundabout entry paragraph", () => expect(verifyTfRef("3 kap. 22 § första stycket")).toBe("3 kap. 22 §"));
  it("falls back to chapter for unverified paragraph", () => expect(verifyTfRef("3 kap. 99 §")).toBe("3 kap."));
});
