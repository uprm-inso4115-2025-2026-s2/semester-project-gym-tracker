type NotificationType =
  | "REMINDER"
  | "INACTIVITY"
  | "COMPLETION"
  | "MISSED_WORKOUT";

export function TriggerNotification(type: NotificationType): string {
  /* Triggers a notification based on its type. For now it returns a string message, but 
  will later be replaced with actual notification templates*/
  switch (type) {
    case "REMINDER":
      return "You have a workout scheduled. Better start your day right!"; //Placeholder value

    case "INACTIVITY":
      return "You haven't worked out in a while. What about scheduling a workout?"; //Placeholder value

    case "COMPLETION":
      return "Great job! You completed your workout."; //Placeholder value

    case "MISSED_WORKOUT":
      return "You missed your scheduled workout. Don't give up now!"; //Placeholder value

    default:
      return "You have a new notification.";
  }
}