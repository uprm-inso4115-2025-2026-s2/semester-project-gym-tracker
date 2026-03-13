import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage, SignupPage } from "./features/auth";

function HomePage() {
  return (
    <main>
      <h1>Gym Tracker</h1>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;