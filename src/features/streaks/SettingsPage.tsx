import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { NotificationPreferencesPanel } from "../notifications";
import type { NotificationPreferences } from "../../types";

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
  const saved = localStorage.getItem("notificationPreferences");
  if (saved) {
    setNotificationPreferences(JSON.parse(saved));
  }
}, []);

function handleNotificationPreferencesChange(updated: NotificationPreferences) {
  setNotificationPreferences(updated);
  localStorage.setItem("notificationPreferences", JSON.stringify(updated));
}

  return (
    <main
      style={{
        background: "#e0f7f7",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        padding: "1rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <section
        style={{
          maxWidth: 450,
          width: "100%",
          background: "white",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
        }}
      >
        {/* Back Button */}
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            marginBottom: "1rem",
            color: "#0f4c4c",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "0.95rem",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>

        <header
          style={{
            background: "#7DE1E1",
            borderRadius: "10px",
            padding: "1rem",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          ⚡ Settings
        </header>

        {/* User Info */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            borderRadius: "8px",
            background: "#f0fdfd",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem", color: "#0f4c4c" }}>Email</h3>
          <p>{user?.email ?? "Unknown"}</p>

          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#0f4c4c" }}>Username</h3>
          <p>{user?.user_metadata?.username ?? "Unknown"}</p>
        </div>

        {/* Weight Units */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            borderRadius: "8px",
            background: "#f0fdf0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem", color: "#0a4c0a" }}>Weight Units</h3>
          <label style={{ marginRight: "1rem" }}>
            <input
              type="radio"
              checked={weightUnit === "kg"}
              onChange={() => setWeightUnit("kg")}
            />{" "}
            kg
          </label>
          <label>
            <input
              type="radio"
              checked={weightUnit === "lb"}
              onChange={() => setWeightUnit("lb")}
            />{" "}
            lb
          </label>
        </div>

        {/* Week Start */}
        <div
          style={{
            padding: "1rem",
            borderRadius: "8px",
            background: "#fff7f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem", color: "#4c2a0a" }}>Start of Week</h3>
          <label style={{ marginRight: "1rem" }}>
            <input
              type="radio"
              checked={weekStart === "mon"}
              onChange={() => setWeekStart("mon")}
            />{" "}
            Monday
          </label>
          <label>
            <input
              type="radio"
              checked={weekStart === "sun"}
              onChange={() => setWeekStart("sun")}
            />{" "}
            Sunday
          </label>
        </div>

        {/* Notification Preferences */}
         <div
            style={{
            marginTop: "1.5rem",  
            marginBottom: "1.5rem", 
            padding: "1rem",
            borderRadius: "8px",
            background: "#ecc9da5c",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
         >
          <NotificationPreferencesPanel
            value={notificationPreferences}
            onChange={handleNotificationPreferencesChange}
          />
        </div>

      </section>
    </main>
  );
}