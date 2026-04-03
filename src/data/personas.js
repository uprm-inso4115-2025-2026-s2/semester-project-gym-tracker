// Persona definitions
// Used for feature validation and stakeholder perspective alignment

export const personas = [
  {
    id: "beginner_lifter",
    name: "Beginner Lifter",
    description:
      "New to the gym. Focused on somthing simple, guidance, and building consistency.",
    experienceLevel: "beginner",

    goals: [
      "Track workouts easily",
      "Understand what exercises to perform",
      "Build a routine",
      "Avoid feeling overwhelmed"
    ],

    frustrations: [
      "Too many advanced metrics",
      "Complex configuration screens",
      "Too much manual data entry"
    ],

    featureExpectations: [
      "Simple workout logging",
      "Predefined workout templates",
      "Minimal setup required",
      "Clear progress indicators"
    ]
  },

  {
    id: "intermediate_lifter",
    name: "Intermediate Lifter",
    description:
      "Has gym experience and wants structured tracking to improve performance.",
    experienceLevel: "intermediate",

    goals: [
      "Track progressive overload",
      "Analyze workout volume",
      "Improve strength over time"
    ],

    frustrations: [
      "Lack of performance metrics",
      "No historical comparison",
      "Limited customization"
    ],

    featureExpectations: [
      "Editable workout templates",
      "Historical performance charts",
      "Set by set tracking",
      "Customizable exercises"
    ]
  },

  {
    id: "advanced_lifter",
    name: "Advanced Lifter",
    description:
      "Experienced athlete focused on optimization, analytics, and precision tracking.",
    experienceLevel: "advanced",

    goals: [
      "Track detailed performance metrics",
      "Analyze trends and plateaus",
      "Optimize training programs"
    ],

    frustrations: [
      "Limited data export",
      "No advanced analytics",
      "Insufficient performance insights"
    ],

    featureExpectations: [
      "Advanced statistics",
      "Progress analytics dashboard",
      "Data export functionality",
      "Fine tuned control over workouts"
    ]
  }
];


/**
 * Utility function: Validate if a feature aligns with a persona:
 * 
 * @param {string} personaId
 * @param {string} featureName
 * @returns {boolean}
 */
export function isFeatureAlignedWithPersona(personaId, featureName) {
  const persona = personas.find(p => p.id === personaId);

  if (!persona) return false;

  return persona.featureExpectations.some(expectation =>
    expectation.toLowerCase().includes(featureName.toLowerCase())
  );
}
export function getPersonaById(personaId) {
  return personas.find((persona) => persona.id === personaId) || null;
}