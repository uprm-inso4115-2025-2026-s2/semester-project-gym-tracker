import type { NotificationPreferences } from "../../types";

interface NotificationPermissionCheck {
  preferences: NotificationPreferences;
  notificationType: string;
  currentTime?: string;
}

export function shouldAllowNotification({
  preferences,
  notificationType,
  currentTime,
}: NotificationPermissionCheck): boolean {
  if (!preferences.enabled) {
    return false;
  }

  if (
    notificationType === "REMINDER" &&
    currentTime &&
    currentTime !== preferences.reminderTime
  ) {
    return false;
  }

  return true;
}