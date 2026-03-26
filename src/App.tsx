import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, AuthProvider, ProtectedRoute, useAuth, signOut } from "./features/auth";
import WeeklyProgress from "./features/streaks/WeeklyProgress";
import NotFoundPage from "./features/ui/NotFoundPage";
import "./App.css";

function HomePage() {
  const { user } = useAuth();

  return (
    <main className="home-main">
      <h1 className="home-title">Gym Tracker</h1>
      <p className="home-subtitle">Logged in as: {user?.email}</p>

      <div className="home-weekly">
        <WeeklyProgress completedDays={5} />
      </div>

      <button className="btn-logout" onClick={() => signOut()}>
        Logout
      </button>
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;