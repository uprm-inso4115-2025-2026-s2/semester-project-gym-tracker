import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { LoginPage, SignupPage, AuthProvider, ProtectedRoute, useAuth, signOut } from "./features/auth";
import WorkoutHistoryPage from "./features/workouts/WorkoutHistoryPage";
import WeeklyProgress from "./features/streaks/WeeklyProgress";
function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Gym Tracker</h1>
      <p style={{ marginBottom: "2rem" }}>Logged in as: {user?.email}</p>
      
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button
          onClick={() => navigate("/history")}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Workout History
        </button>


      <button 
        onClick={() => signOut()}
        style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#ef4444", color: "white", border: "none", borderRadius: "4px" }}
      >
        Logout
      </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <WeeklyProgress completedDays={5} />
      </div>

    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route 
             path="/" 
             element={
               <ProtectedRoute>
                 <HomePage />
               </ProtectedRoute>
             } 
          />
          <Route path="/history" element={<ProtectedRoute> <WorkoutHistoryPage /> </ProtectedRoute> } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;