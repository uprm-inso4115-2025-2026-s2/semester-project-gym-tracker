//For the future we can add, delete, or modify any of these.
//These are motivational messages to be used for notifications on certain triggers

export const motivationalMessages = {
  workoutComplete: [
    "Great job finishing your workout!",
    "Consistency is key, keep going!",
    "Another step toward your goals!",
    "You showed up. That's what matters.",
    "Progress is built one workout at a time."
  ],

  streakMaintained: [
    "Your streak is alive, don't break it!",
    "Consistency is your superpower.",
    "You're building momentum. Keep it going!",
    "Habits are forming, stay strong!",
    "Another day, another win."
  ],

  weeklyGoalAchieved: [
    "Weekly goal completed — amazing work!",
    "You hit your target this week!",
    "Goals set. Goals crushed.",
    "This is what discipline looks like.",
    "Your effort is paying off."
  ],

  personalRecord: [
    "New personal record!",
    "You just leveled up!",
    "Stronger than yesterday.",
    "That's a new milestone — impressive!",
    "You're redefining your limits.",
    "That's a new PR!"
  ],

  comeback: [
    "Welcome back! Let's get moving.",
    "Progress resumes today.",
    "Every comeback starts with one step.",
    "You're back — that's what counts.",
    "Consistency restarts now."
  ],

  encouragement: [
    "Small steps lead to big results.",
    "Stay consistent, stay strong.",
    "Your future self will thank you.",
    "Discipline beats motivation.",
    "Show up for yourself today."
  ]
};

// function to get random message
export const getRandomMessage = (type) => {
  const messages = motivationalMessages[type];

  if (!messages || messages.length === 0) {
    return "Keep going!";
  }

  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};



/*
example of how to use in react:


import { getRandomMessage } from "./messages";

const message = getRandomMessage("workoutComplete");

return <p>{message}</p>;


*/