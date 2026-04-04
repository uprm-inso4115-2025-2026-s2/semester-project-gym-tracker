import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./GymWorkoutPage.css";

/* ── Types ───────────────────────────────────── */
interface Exercise {
  id: string;
  name: string;
  durationSeconds: number;
  icon: React.ReactNode;
}

interface WorkoutPlan {
  id: string;
  name: string;
  exercises: Exercise[];
}

/* ── SVG Icons ───────────────────────────────── */
const SquatIcon = () => (
  <svg viewBox="0 0 64 64" fill="currentColor" className="ex-icon">
    <circle cx="32" cy="8" r="5"/>
    <path d="M32 14v16l-10 14h6l8-10 8 10h6L40 30V14z"/>
    <path d="M20 44h8v8h-8zM36 44h8v8h-8z" opacity="0.7"/>
  </svg>
);

const LegCurlIcon = () => (
  <svg viewBox="0 0 64 64" fill="currentColor" className="ex-icon">
    <circle cx="16" cy="12" r="5"/>
    <path d="M16 18l4 12h28v6H18l-6-18z"/>
    <path d="M44 36l4 14h-8l-2-14z"/>
    <rect x="8" y="42" width="10" height="6" rx="3" opacity="0.7"/>
  </svg>
);

const BenchPressIcon = () => (
  <svg viewBox="0 0 64 64" fill="currentColor" className="ex-icon">
    <circle cx="32" cy="8" r="5"/>
    <rect x="10" y="28" width="44" height="6" rx="3"/>
    <rect x="4" y="22" width="8" height="18" rx="3"/>
    <rect x="52" y="22" width="8" height="18" rx="3"/>
    <path d="M24 16h16v12H24z" rx="2"/>
    <rect x="20" y="44" width="24" height="6" rx="3" opacity="0.6"/>
  </svg>
);

const DeadliftIcon = () => (
  <svg viewBox="0 0 64 64" fill="currentColor" className="ex-icon">
    <circle cx="32" cy="8" r="5"/>
    <path d="M32 14v20M22 34l10-4 10 4"/>
    <rect x="4" y="32" width="12" height="8" rx="4"/>
    <rect x="48" y="32" width="12" height="8" rx="4"/>
    <rect x="14" y="34" width="36" height="4" rx="2"/>
    <path d="M26 34l-4 16h4l6-12 6 12h4l-4-16z"/>
  </svg>
);

const PullUpIcon = () => (
  <svg viewBox="0 0 64 64" fill="currentColor" className="ex-icon">
    <rect x="4" y="8" width="56" height="6" rx="3"/>
    <circle cx="32" cy="22" r="5"/>
    <path d="M24 26l-4 20h6l6-14 6 14h6l-4-20z"/>
    <path d="M28 14v10M36 14v10" strokeWidth="2" stroke="currentColor" fill="none"/>
  </svg>
);

const ShoulderPressIcon = () => (
  <svg viewBox="0 0 64 64" fill="currentColor" className="ex-icon">
    <circle cx="32" cy="10" r="5"/>
    <path d="M32 16v14M20 22h24"/>
    <rect x="4" y="18" width="10" height="8" rx="4"/>
    <rect x="50" y="18" width="10" height="8" rx="4"/>
    <path d="M26 30l-4 22h6l4-14 4 14h6l-4-22z"/>
  </svg>
);

/* ── Data ────────────────────────────────────── */
const workoutPlans: WorkoutPlan[] = [
  {
    id: "full-body-beginner",
    name: "Full Body (Beginner)",
    exercises: [
      { id: "squat",      name: "Squats",      durationSeconds: 30, icon: <SquatIcon /> },
      { id: "legcurl",    name: "Leg Curls",   durationSeconds: 30, icon: <LegCurlIcon /> },
      { id: "benchpress", name: "Bench Press", durationSeconds: 30, icon: <BenchPressIcon /> },
    ],
  },
  {
    id: "lower-body",
    name: "Lower Body",
    exercises: [
      { id: "squat",    name: "Squats",    durationSeconds: 45, icon: <SquatIcon /> },
      { id: "legcurl",  name: "Leg Curls", durationSeconds: 45, icon: <LegCurlIcon /> },
      { id: "deadlift", name: "Deadlift",  durationSeconds: 40, icon: <DeadliftIcon /> },
    ],
  },
  {
    id: "upper-body",
    name: "Upper Body",
    exercises: [
      { id: "benchpress",    name: "Bench Press",    durationSeconds: 30, icon: <BenchPressIcon /> },
      { id: "pullup",        name: "Pull Ups",       durationSeconds: 30, icon: <PullUpIcon /> },
      { id: "shoulderpress", name: "Shoulder Press", durationSeconds: 30, icon: <ShoulderPressIcon /> },
    ],
  },
];

const REST_SECONDS = 15;

/* ── Shared Navbar ───────────────────────────── */
interface NavbarProps {
  title?: string;
  onBack: () => void;
}
const Navbar: React.FC<NavbarProps> = ({ title, onBack }) => {
  const navigate = useNavigate();
  return (
    <header className="gw-navbar">
      <div className="gw-navbar__inner">
        <button className="gw-back-btn" onClick={onBack}>
          <span className="gw-back-btn__arrow">◀</span> Back
        </button>
        {title && <span className="gw-navbar__title">{title}</span>}
        <nav className="gw-navbar__links">
          <span onClick={() => navigate("/")}>Main Menu</span>
          <span onClick={() => navigate("/history")}>History</span>
          <span onClick={() => navigate("/profile")}>Profile</span>
        </nav>
      </div>
    </header>
  );
};

/* ── Screen 1: Workout List ──────────────────── */
interface WorkoutListProps {
  onSelect: (plan: WorkoutPlan) => void;
  onBack: () => void;
}
const WorkoutListScreen: React.FC<WorkoutListProps> = ({ onSelect, onBack }) => (
  <div className="gw-page">
    <Navbar onBack={onBack} title="Gym Workout" />
    <main className="gw-content">
      <div className="gw-list">
        {workoutPlans.map((plan, i) => (
          <button
            key={plan.id}
            className="gw-plan-card"
            style={{ animationDelay: `${i * 90}ms` }}
            onClick={() => onSelect(plan)}
          >
            <span className="gw-plan-card__name">{plan.name}</span>
            <span className="gw-plan-card__icon">
              {plan.exercises[0].icon}
            </span>
          </button>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

/* ── Screen 2: Exercise List ─────────────────── */
interface ExerciseListProps {
  plan: WorkoutPlan;
  onStart: (index: number) => void;
  onBack: () => void;
}
const ExerciseListScreen: React.FC<ExerciseListProps> = ({ plan, onStart, onBack }) => (
  <div className="gw-page">
    <Navbar onBack={onBack} title={plan.name} />
    <main className="gw-content">
      <div className="gw-list">
        {plan.exercises.map((ex, i) => (
          <button
            key={ex.id}
            className="gw-ex-card"
            style={{ animationDelay: `${i * 80}ms` }}
            onClick={() => onStart(i)}
          >
            <span className="gw-ex-card__icon">{ex.icon}</span>
            <span className="gw-ex-card__info">
              <span className="gw-ex-card__name">{ex.name}</span>
              <span className="gw-ex-card__duration">{ex.durationSeconds} seconds</span>
            </span>
          </button>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

/* ── Screen 3: Active Exercise ───────────────── */
interface ActiveExerciseProps {
  plan: WorkoutPlan;
  exerciseIndex: number;
  onNext: (nextIndex: number) => void;
  onBack: () => void;
  onFinish: () => void;
}
const ActiveExerciseScreen: React.FC<ActiveExerciseProps> = ({
  plan, exerciseIndex, onNext, onBack, onFinish,
}) => {
  const exercise = plan.exercises[exerciseIndex];
  const isLast = exerciseIndex === plan.exercises.length - 1;

  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [timeLeft, setTimeLeft] = useState(exercise.durationSeconds);
  const [running, setRunning] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when exercise changes
  useEffect(() => {
    setPhase("work");
    setTimeLeft(exercise.durationSeconds);
    setRunning(true);
  }, [exerciseIndex, exercise.durationSeconds]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (phase === "work") {
            if (isLast) {
              setRunning(false);
              return 0;
            }
            setPhase("rest");
            setTimeLeft(REST_SECONDS);
          } else {
            onNext(exerciseIndex + 1);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [running, phase, isLast, exerciseIndex, onNext]);

  const totalTime = phase === "work" ? exercise.durationSeconds : REST_SECONDS;
  const progress = timeLeft / totalTime;
  const radius = 110;
  const circ = 2 * Math.PI * radius;
  const dash = circ * progress;

  const nextLabel = isLast
    ? phase === "work" ? `Rest (${REST_SECONDS}s)` : "Finish"
    : phase === "work"
    ? `Rest (${REST_SECONDS}s)`
    : plan.exercises[exerciseIndex + 1]?.name;

  const handleNext = () => {
    clearInterval(timerRef.current!);
    if (phase === "work") {
      if (isLast) { onFinish(); return; }
      setPhase("rest");
      setTimeLeft(REST_SECONDS);
      setRunning(true);
    } else {
      onNext(exerciseIndex + 1);
    }
  };

  return (
    <div className="gw-page">
      <Navbar onBack={onBack} title={plan.name} />
      <main className="gw-active">
        <div className="gw-timer-wrap">
          {/* Ring */}
          <svg className="gw-ring" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r={radius} className="gw-ring__track" />
            <circle
              cx="130" cy="130" r={radius}
              className={`gw-ring__fill ${phase === "rest" ? "gw-ring__fill--rest" : ""}`}
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={0}
              transform="rotate(-90 130 130)"
            />
          </svg>

          {/* Icon inside ring */}
          <div className="gw-timer__icon">
            {exercise.icon}
          </div>
        </div>

        {/* Phase label */}
        {phase === "rest" && <p className="gw-phase-label">Rest</p>}

        {/* Exercise name */}
        <h2 className="gw-active__name">
          {phase === "rest" ? `Next: ${plan.exercises[exerciseIndex + 1]?.name ?? "Done"}` : exercise.name}
        </h2>

        {/* Countdown */}
        <div className="gw-countdown">{timeLeft}</div>

        {/* Next button */}
        <button className="gw-next-btn" onClick={handleNext}>
          {isLast && phase === "work" ? "Skip to Rest" : `Next: ${nextLabel}`}
        </button>

        {/* Pause/resume */}
        <button className="gw-pause-btn" onClick={() => setRunning((r) => !r)}>
          {running ? "⏸ Pause" : "▶ Resume"}
        </button>
      </main>
      <Footer />
    </div>
  );
};

/* ── Screen 4: Finished ──────────────────────── */
const FinishedScreen: React.FC<{ planName: string; onBack: () => void }> = ({ planName, onBack }) => {
  const navigate = useNavigate();
  return (
    <div className="gw-page">
      <Navbar onBack={onBack} title={planName} />
      <main className="gw-finished">
        <div className="gw-finished__trophy">🏆</div>
        <h2 className="gw-finished__title">Workout Complete!</h2>
        <p className="gw-finished__sub">Great job finishing <strong>{planName}</strong>.</p>
        <div className="gw-finished__actions">
          <button className="gw-next-btn" onClick={() => navigate("/history")}>View Progress</button>
          <button className="gw-pause-btn" onClick={() => navigate("/")}>Main Menu</button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

/* ── Footer ──────────────────────────────────── */
const Footer = () => (
  <footer className="gw-footer">
    <div className="gw-footer__links">
      <span>Info</span>
      <span>Credits</span>
    </div>
    <div className="gw-footer__logo">
      <span>LOGO</span>
      <span className="gw-footer__year">2026</span>
    </div>
  </footer>
);

/* ── Root Page ───────────────────────────────── */
type Screen =
  | { name: "list" }
  | { name: "exercises"; plan: WorkoutPlan }
  | { name: "active"; plan: WorkoutPlan; exerciseIndex: number }
  | { name: "finished"; plan: WorkoutPlan };

const GymWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>({ name: "list" });

  const goBack = () => {
    if (screen.name === "list") navigate("/");
    else if (screen.name === "exercises") setScreen({ name: "list" });
    else if (screen.name === "active") setScreen({ name: "exercises", plan: screen.plan });
    else if (screen.name === "finished") setScreen({ name: "list" });
  };

  if (screen.name === "list")
    return <WorkoutListScreen onSelect={(plan) => setScreen({ name: "exercises", plan })} onBack={goBack} />;

  if (screen.name === "exercises")
    return <ExerciseListScreen plan={screen.plan} onStart={(i) => setScreen({ name: "active", plan: screen.plan, exerciseIndex: i })} onBack={goBack} />;

  if (screen.name === "active")
    return (
      <ActiveExerciseScreen
        plan={screen.plan}
        exerciseIndex={screen.exerciseIndex}
        onNext={(i) => setScreen({ name: "active", plan: screen.plan, exerciseIndex: i })}
        onBack={goBack}
        onFinish={() => setScreen({ name: "finished", plan: screen.plan })}
      />
    );

  if (screen.name === "finished")
    return <FinishedScreen planName={screen.plan.name} onBack={goBack} />;

  return null;
};

export default GymWorkoutPage;
