import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainMenu.css";

/* ── Icons ───────────────────────────────────── */
const GymIcon = () => (
  <svg viewBox="0 0 48 48" fill="currentColor" className="card__icon">
    <rect x="4" y="20" width="6" height="8" rx="2" />
    <rect x="38" y="20" width="6" height="8" rx="2" />
    <rect x="10" y="16" width="5" height="16" rx="2" />
    <rect x="33" y="16" width="5" height="16" rx="2" />
    <rect x="15" y="22" width="18" height="4" rx="2" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 48 48" fill="currentColor" className="card__icon">
    <path d="M24 6L4 22h6v20h10V30h8v12h10V22h6L24 6z" />
  </svg>
);

const CardioIcon = () => (
  <svg viewBox="0 0 48 48" className="card__icon">
    <path d="M4 24h6l4-8 6 16 6-20 4 12h14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalisthenicIcon = () => (
  <svg viewBox="0 0 48 48" className="card__icon">
    <circle cx="24" cy="8" r="4" fill="currentColor"/>
    <line x1="4" y1="26" x2="44" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 12v8M24 20l-8 6M24 20l8 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M16 26l-4 12M32 26l4 12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const ProgressIcon = () => (
  <svg viewBox="0 0 48 48" fill="currentColor" className="card__icon">
    <rect x="6" y="32" width="8" height="12" rx="2" opacity="0.7"/>
    <rect x="18" y="24" width="8" height="20" rx="2" opacity="0.85"/>
    <rect x="30" y="16" width="8" height="28" rx="2"/>
    <path d="M6 34l12-10 12-6 12-8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 00-7-7zm0 20a2 2 0 002-2h-4a2 2 0 002 2z"/>
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6zm7.2-2.4l1.6-1.2-1.5-2.6-1.9.8a6 6 0 00-1.4-.8l-.3-2H10.3l-.3 2a6 6 0 00-1.4.8l-1.9-.8L5.2 11.4l1.6 1.2a6 6 0 000 1.8l-1.6 1.2 1.5 2.6 1.9-.8c.4.3.9.6 1.4.8l.3 2h3.4l.3-2c.5-.2 1-.5 1.4-.8l1.9.8 1.5-2.6-1.6-1.2c.1-.3.1-.6.1-.9s0-.6-.1-.9z"/>
  </svg>
);

/* ── Menu Items ───────────────────────────────── */
const menuItems = [
  { id: "gym",          label: "Gym Workout",    color: "orange", icon: <GymIcon />,        route: "/workout/gym",          description: "Free weights, machines & more" },
  { id: "home",         label: "Home Workout",   color: "cyan",   icon: <HomeIcon />,        route: "/workout/home",         description: "No equipment needed" },
  { id: "cardio",       label: "Cardio",         color: "red",    icon: <CardioIcon />,      route: "/workout/cardio",       description: "Running, cycling & HIIT" },
  { id: "calisthenics", label: "Calisthenics",   color: "yellow", icon: <CalisthenicIcon />, route: "/workout/calisthenics", description: "Bodyweight strength training" },
  { id: "progress",     label: "Daily Progress", color: "green",  icon: <ProgressIcon />,    route: "/history",              description: "Track your gains over time" },
];

/* ── Component ────────────────────────────────── */
const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="site">

      {/* ── NAVBAR ── */}
      <header className="navbar">
        <div className="navbar__inner">
          <div className="navbar__brand">
            <span className="navbar__logo">LOGO</span>
          </div>
          <nav className="navbar__links">
            <span className="navbar__link navbar__link--active">Main Menu</span>
            <span className="navbar__link" onClick={() => navigate("/history")}>History</span>
            <span className="navbar__link" onClick={() => navigate("/profile")}>Profile</span>
          </nav>
          <div className="navbar__actions">
            <button className="icon-btn" aria-label="Notifications"><BellIcon /></button>
            <button className="icon-btn" aria-label="Settings" onClick={() => navigate("/settings")}><GearIcon /></button>
            <div className="navbar__avatar"><span>M</span></div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__inner">
          <p className="hero__greeting">Welcome back, <strong>Manny</strong> 👋</p>
          <h1 className="hero__title">What Would You Like<br/>to Work On Today?</h1>
          <p className="hero__sub">Choose a category below to start your session.</p>
        </div>
        <div className="hero__glow" />
      </section>

      {/* ── MENU GRID ── */}
      <main className="menu-section">
        <div className="menu-grid">
          {menuItems.map((item, i) => (
            <button
              key={item.id}
              className={`menu-card menu-card--${item.color}${item.id === "progress" ? " menu-card--wide" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => navigate(item.route)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="menu-card__icon-wrap">{item.icon}</div>
              <div className="menu-card__body">
                <span className="menu-card__label">{item.label}</span>
                <span className={`menu-card__desc${hovered === item.id ? " menu-card__desc--visible" : ""}`}>
                  {item.description}
                </span>
              </div>
              <span className="menu-card__arrow">→</span>
            </button>
          ))}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <span>© 2026 LOGO</span>
        <div className="footer__links">
          <span>Info</span>
          <span>Credits</span>
        </div>
      </footer>

    </div>
  );
};

export default MainMenu;
