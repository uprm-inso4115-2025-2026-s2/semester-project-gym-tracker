import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { NotificationPreferencesPanel } from "../notifications";
import type { NotificationPreferences } from "../../types";
import { supabase } from "../../lib/supabaseClient";
import "./SettingsPage.css";

type WeightUnit = "kg" | "lb";
type WeekStart = "mon" | "sun";

export default function SettingsPage() {
  const { user } = useAuth();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [weekStart, setWeekStart] = useState<WeekStart>("mon");

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>({
      enabled: true,
      reminderTime: "18:00",
    });

  useEffect(() => {
    const meta = user?.user_metadata;

    const unit = meta?.weight_unit ?? localStorage.getItem("weightUnit");
    if (unit === "kg" || unit === "lb") setWeightUnit(unit);

    const start = meta?.week_start ?? localStorage.getItem("weekStart");
    if (start === "mon" || start === "sun") setWeekStart(start);

    const saved = localStorage.getItem("notificationPreferences");
    if (saved) setNotificationPreferences(JSON.parse(saved));
  }, [user]);

  async function handleWeightUnitChange(unit: WeightUnit) {
    setWeightUnit(unit);
    localStorage.setItem("weightUnit", unit);
    await supabase.auth.updateUser({ data: { weight_unit: unit } });
  }

  async function handleWeekStartChange(start: WeekStart) {
    setWeekStart(start);
    localStorage.setItem("weekStart", start);
    await supabase.auth.updateUser({ data: { week_start: start } });
  }

  function handleNotificationPreferencesChange(updated: NotificationPreferences) {
    setNotificationPreferences(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
  }

  return (
    <main className="settings-page">
      <div className="settings-inner">
        <div className="settings-title-card">
          <h1 className="settings-title">Settings</h1>
        </div>

        {/* User Info */}
        <div className="settings-card">
          <h2 className="settings-section-title">Account</h2>
          <p className="settings-value">{user?.email ?? "Unknown"}</p>
          {user?.user_metadata?.username && (
            <p className="settings-value" style={{ marginTop: "0.4rem" }}>
              {user.user_metadata.username}
            </p>
          )}
        </div>

        {/* Weight Units */}
        <div className="settings-card">
          <h2 className="settings-section-title">Weight Units</h2>
          <div className="settings-radio-group">
            <label className="settings-radio-label">
              <input
                type="radio"
                checked={weightUnit === "kg"}
                onChange={() => handleWeightUnitChange("kg")}
              />
              kg
            </label>
            <label className="settings-radio-label">
              <input
                type="radio"
                checked={weightUnit === "lb"}
                onChange={() => handleWeightUnitChange("lb")}
              />
              lb
            </label>
          </div>
        </div>

        {/* Week Start */}
        <div className="settings-card">
          <h2 className="settings-section-title">Start of Week</h2>
          <div className="settings-radio-group">
            <label className="settings-radio-label">
              <input
                type="radio"
                checked={weekStart === "mon"}
                onChange={() => handleWeekStartChange("mon")}
              />
              Monday
            </label>
            <label className="settings-radio-label">
              <input
                type="radio"
                checked={weekStart === "sun"}
                onChange={() => handleWeekStartChange("sun")}
              />
              Sunday
            </label>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-card">
          <NotificationPreferencesPanel
            value={notificationPreferences}
            onChange={handleNotificationPreferencesChange}
          />
        </div>
      </div>
    </main>
  );
}
