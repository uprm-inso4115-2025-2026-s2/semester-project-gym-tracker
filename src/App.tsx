import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { LoginPage, SignupPage, ProfilePage, AuthProvider, ProtectedRoute, useAuth, signOut } from "./features/auth";

function HomePage() {
  const { user } = useAuth();
  
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Gym Tracker</h1>
      <p style={{ marginBottom: "2rem" }}>Logged in as: {user?.email}</p>
      
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/profile">Go to Profile</Link>
      </div>

      <button 
        onClick={() => signOut()}
        style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#ef4444", color: "white", border: "none", borderRadius: "4px" }}
      >
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;