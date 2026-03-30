import { personas, getPersonaById } from "./personas";

export const features = [
  {
    id: "simple_workout_logging",
    name: "Simple Workout Logging",
    description: "Allows users to quickly log a workout with minimal friction.",
    supportedPersonas: ["beginner_lifter", "intermediate_lifter"],
  },
  {
    id: "workout_templates",
    name: "Workout Templates",
    description: "Provides reusable workout structures for faster logging.",
    supportedPersonas: ["beginner_lifter", "intermediate_lifter"],
  },
  {
    id: "progress_indicators",
    name: "Progress Indicators",
    description:
      "Displays simple visual progress such as completion bars or summaries.",
    supportedPersonas: ["beginner_lifter"],
  },
  {
    id: "motivational_feedback",
    name: "Motivational Feedback",
    description:
      "Shows encouraging messages based on progress and consistency.",
    supportedPersonas: ["beginner_lifter", "intermediate_lifter"],
  },
  {
    id: "historical_performance_charts",
    name: "Historical Performance Charts",
    description: "Visualizes workout progress over time.",
    supportedPersonas: ["intermediate_lifter", "advanced_lifter"],
  },
  {
    id: "set_by_set_tracking",
    name: "Set-by-Set Tracking",
    description: "Tracks detailed exercise performance at the set level.",
    supportedPersonas: ["intermediate_lifter", "advanced_lifter"],
  },
  {
    id: "goal_tracking",
    name: "Goal Tracking",
    description: "Allows users to define and monitor workout goals.",
    supportedPersonas: ["intermediate_lifter", "advanced_lifter"],
  },
  {
    id: "advanced_statistics",
    name: "Advanced Statistics",
    description: "Provides detailed analytics and training insights.",
    supportedPersonas: ["advanced_lifter"],
  },
  {
    id: "custom_exercises",
    name: "Custom Exercises",
    description: "Allows users to create or edit their own exercises.",
    supportedPersonas: ["advanced_lifter"],
  },
];

export function getFeatureById(featureId) {
  return features.find((feature) => feature.id === featureId) || null;
}

export function getFeaturesForPersona(personaId) {
  return features.filter((feature) =>
    feature.supportedPersonas.includes(personaId)
  );
}

export function getPersonasForFeature(featureId) {
  const feature = getFeatureById(featureId);
  if (!feature) return [];

  return feature.supportedPersonas
    .map((personaId) => getPersonaById(personaId))
    .filter(Boolean);
}

export function isFeatureRelevantToPersona(featureId, personaId) {
  const feature = getFeatureById(featureId);
  if (!feature) return false;

  return feature.supportedPersonas.includes(personaId);
}

export function validateFeatureAgainstPersonaExpectations(featureId, personaId) {
  const persona = getPersonaById(personaId);
  if (!persona) return false;

  return persona.featureExpectations.includes(featureId);
}

export function getFeatureValidationSummary(featureId) {
  const feature = getFeatureById(featureId);

  if (!feature) {
    return {
      featureId,
      exists: false,
      supportedPersonas: [],
    };
  }

  return {
    featureId: feature.id,
    exists: true,
    supportedPersonas: getPersonasForFeature(featureId).map(
      (persona) => persona.name
    ),
  };
}

export function getPersonaValidationSummary(personaId) {
  const persona = getPersonaById(personaId);

  if (!persona) {
    return {
      personaId,
      exists: false,
      supportedFeatures: [],
    };
  }

  return {
    personaId: persona.id,
    exists: true,
    supportedFeatures: getFeaturesForPersona(personaId).map(
      (feature) => feature.name
    ),
  };
}

export function getUnmappedPersonaExpectations() {
  const featureIds = new Set(features.map((feature) => feature.id));

  return personas.map((persona) => ({
    personaId: persona.id,
    personaName: persona.name,
    unmappedExpectations: persona.featureExpectations.filter(
      (featureId) => !featureIds.has(featureId)
    ),
  }));
}