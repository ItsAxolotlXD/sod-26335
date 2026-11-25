import { describe, expect, it } from "vitest";
import { findViveFeatureById, getViveFeatureId, getViveFeatures } from "./viveFeatures";
import { DEFAULT_SETTINGS } from "../hooks/useSettings";

describe("StartLayoutConcept Vive feature", () => {
  it("is registered with an 8-digit ID", () => {
    const id = getViveFeatureId("startLayoutConcept");
    expect(id).toMatch(/^\d{8}$/);
    expect(findViveFeatureById(id ?? "")?.name).toBe("StartLayoutConcept");
  });

  it("has an ID that no other Vive feature uses", () => {
    const ids = getViveFeatures().map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is off by default so the classic Start menu stays until enabled", () => {
    expect(DEFAULT_SETTINGS.startLayoutConcept).toBe(false);
  });
});
