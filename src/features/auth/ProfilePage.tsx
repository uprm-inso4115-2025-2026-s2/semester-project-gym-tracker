import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FaDumbbell, FaTrophy, FaFire, FaPencilAlt } from "react-icons/fa";
import "./ProfilePage.css";
import { useAuth } from "../auth/AuthContext";

interface StatCardProps {
  value: string;
  label: string;
  icon: ReactNode;
}

function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <h3 className="stat-value">{value}</h3>
      <p className="stat-label">{label}</p>
    </article>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("Jane Doe");
  const [goal, setGoal] = useState("Build Leg Muscle and Strength");

  function handleSave() {
    setEditing(false);
    console.log("Saved:", username, goal);
  }

  const profileData = {
    email: user?.email ?? "jane.doe@gmail.com",
    memberSince: user?.created_at
      ? new Date(user.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        })
      : "March 2022",
    avatar:
      "https://cdn-icons-png.flaticon.com/512/847/847969.png",
  };

  const statsData = [
    {
      value: "124",
      label: "Workouts Completed",
      icon: <FaDumbbell />,
    },
    {
      value: "23",
      label: "Achievements",
      icon: <FaTrophy />,
    },
    {
      value: "12 days",
      label: "Current Streak",
      icon: <FaFire />,
    },
  ];

  const recentActivityData = [
    {
      title: "Lower Body Strength",
      time: "Today, 9:30 AM",
      duration: "45 mins",
    },
    {
      title: "HIIT Cardio",
      time: "Yesterday, 6:00 PM",
      duration: "30 mins",
    },
    {
      title: "Leg Day",
      time: "2 days ago",
      duration: "60 mins",
    },
  ];

  return (
    <main className="profile-page">
      <header className="app-header">
        <div className="header-container">
          <Link to="/" className="home-button">
           Home
          </Link>

        <div className="logo">
          <h1>GYM TRACKER</h1>
          <FaDumbbell className="logo-icon" />
        </div>
       </div>
     </header>

      <section className="profile-card">
        <div className="profile-banner" />

        <div className="avatar-wrapper">
          <img
            src={profileData.avatar}
            alt="Profile avatar"
            className="profile-avatar"
          />
          <button type="button" className="avatar-edit-button">
            <FaPencilAlt />
          </button>
        </div>

        <div className="stats-row">
          {statsData.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              icon={stat.icon}
            />
          ))}
        </div>

        <section className="info-section">
          <div className="info-header">
            <h2 className="section-title">Personal Information</h2>
            <button
              type="button"
              className="edit-profile-button"
              onClick={editing ? handleSave : () => setEditing(true)}
            >
              {editing ? "Save" : "Edit Profile"}
            </button>
          </div>

          <div className="info-grid">
            <div className="info-field">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly={!editing}
              />
            </div>

            <div className="info-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="text"
                value={profileData.email}
                readOnly
              />
            </div>

            <div className="info-field">
              <label htmlFor="memberSince">Member Since</label>
              <input
                id="memberSince"
                type="text"
                value={profileData.memberSince}
                readOnly
              />
            </div>

            <div className="info-field">
              <label htmlFor="goal">Fitness Goal</label>
              <input
                id="goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                readOnly={!editing}
              />
            </div>
          </div>
        </section>
      </section>

      <section className="activity-section">
        <h2 className="section-title">Recent Activity</h2>

        <div className="activity-list">
          {recentActivityData.map((activity) => (
            <article key={activity.title} className="activity-card">
              <div className="activity-left">
                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-time">{activity.time}</p>
              </div>

              <p className="activity-duration">{activity.duration}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}