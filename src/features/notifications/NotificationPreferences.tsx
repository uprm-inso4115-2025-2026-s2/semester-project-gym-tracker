import { useEffect, useState } from "react";
import type { NotificationPreferences } from "../../types";

interface NotificationPreferencesProps {
  value: NotificationPreferences;
  onChange: (prefs: NotificationPreferences) => void;
}

export default function NotificationPreferencesPanel({
  value,
  onChange,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(value);

  useEffect(() => {
    setPreferences(value);
  }, [value]);

  function handleToggle() {
    const updated = {
      ...preferences,
      enabled: !preferences.enabled,
    };
    setPreferences(updated);
    onChange(updated);
  }

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const updated = {
      ...preferences,
      reminderTime: event.target.value,
    };
    setPreferences(updated);
    onChange(updated);
  }

  return (
    <>
      <h2
        style={{
          marginTop: 0,
          marginBottom: "1rem",
          color: "#17325c",
        }}
      >
        Notification Preferences
      </h2>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontWeight: 600,
            color: "#17325c",
          }}
        >
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={handleToggle}
          />
          Enable notifications
        </label>
      </div>

      <div>
        <label
          htmlFor="reminderTime"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "#17325c",
          }}
        >
          Preferred reminder time
        </label>

        <input
          id="reminderTime"
          type="time"
          value={preferences.reminderTime}
          onChange={handleTimeChange}
          disabled={!preferences.enabled}
          style={{
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            width: "100%",
            maxWidth: "220px",
          }}
        />
      </div>
    </>
  );
}