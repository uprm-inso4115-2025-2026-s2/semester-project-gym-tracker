import { describe, it, expect } from "vitest";
import {
  features,
  getFeatureById,
  getFeaturesForPersona,
  getPersonasForFeature,
  isFeatureRelevantToPersona,
  validateFeatureAgainstPersonaExpectations,
  getFeatureValidationSummary,
  getPersonaValidationSummary,
  getUnmappedPersonaExpectations,
} from "./featurePersonaMap";

describe("featurePersonaMap", () => {
  it("contains at least 3 mapped features", () => {
    expect(features.length).toBeGreaterThanOrEqual(3);
  });

  it("returns a feature by id", () => {
    const feature = getFeatureById("simple_workout_logging");
    expect(feature).not.toBeNull();
    expect(feature.name).toBe("Simple Workout Logging");
  });

  it("returns null for unknown feature", () => {
    expect(getFeatureById("unknown_feature")).toBeNull();
  });

  it("returns the correct features for a persona", () => {
    const beginnerFeatures = getFeaturesForPersona("beginner_lifter");
    const ids = beginnerFeatures.map((feature) => feature.id);

    expect(ids).toContain("simple_workout_logging");
    expect(ids).toContain("workout_templates");
    expect(ids).toContain("motivational_feedback");
  });

  it("returns the correct personas for a feature", () => {
    const personaList = getPersonasForFeature("advanced_statistics");
    const ids = personaList.map((persona) => persona.id);

    expect(ids).toContain("advanced_lifter");
    expect(ids).not.toContain("beginner_lifter");
  });

  it("correctly validates feature relevance to persona", () => {
    expect(
      isFeatureRelevantToPersona("simple_workout_logging", "beginner_lifter")
    ).toBe(true);

    expect(
      isFeatureRelevantToPersona("advanced_statistics", "beginner_lifter")
    ).toBe(false);
  });

  it("validates feature against persona expectations", () => {
    expect(
      validateFeatureAgainstPersonaExpectations(
        "workout_templates",
        "beginner_lifter"
      )
    ).toBe(true);

    expect(
      validateFeatureAgainstPersonaExpectations(
        "advanced_statistics",
        "beginner_lifter"
      )
    ).toBe(false);
  });

  it("returns a useful feature validation summary", () => {
    const summary = getFeatureValidationSummary("goal_tracking");

    expect(summary.exists).toBe(true);
    expect(summary.supportedPersonas).toContain("Intermediate Lifter");
    expect(summary.supportedPersonas).toContain("Advanced Lifter");
  });

  it("returns a useful persona validation summary", () => {
    const summary = getPersonaValidationSummary("advanced_lifter");

    expect(summary.exists).toBe(true);
    expect(summary.supportedFeatures).toContain("Advanced Statistics");
    expect(summary.supportedFeatures).toContain("Custom Exercises");
  });

  it("returns unmapped expectations list", () => {
    const result = getUnmappedPersonaExpectations();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    for (const personaResult of result) {
      expect(personaResult).toHaveProperty("personaId");
      expect(personaResult).toHaveProperty("personaName");
      expect(personaResult).toHaveProperty("unmappedExpectations");
    }
  });
});