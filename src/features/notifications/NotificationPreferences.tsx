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
    const updated = { ...preferences, enabled: !preferences.enabled };
    setPreferences(updated);
    onChange(updated);
  }

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const updated = { ...preferences, reminderTime: event.target.value };
    setPreferences(updated);
    onChange(updated);
  }

  return (
    <>
      <h2 className="settings-section-title" style={{ marginTop: 0 }}>
        Notifications
      </h2>

      <label className="settings-radio-label" style={{ marginBottom: "var(--space-2)", display: "flex", gap: "0.6rem" }}>
        <input
          type="checkbox"
          checked={preferences.enabled}
          onChange={handleToggle}
          style={{ accentColor: "var(--primary)", width: 16, height: 16, cursor: "pointer" }}
        />
        Enable reminders
      </label>

      <label
        htmlFor="reminderTime"
        style={{
          display: "block",
          marginBottom: "0.4rem",
          fontSize: "var(--font-label-sm)",
          fontWeight: 600,
          color: "rgba(25,28,30,0.55)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Reminder time
      </label>
      <input
        id="reminderTime"
        type="time"
        value={preferences.reminderTime}
        onChange={handleTimeChange}
        disabled={!preferences.enabled}
        style={{
          padding: "0.5rem 0.75rem",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "var(--surface-container-low)",
          color: "var(--on-surface)",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-body-md)",
          width: "100%",
          maxWidth: "200px",
          opacity: preferences.enabled ? 1 : 0.45,
          outline: "none",
        }}
      />
    </>
  );
}
