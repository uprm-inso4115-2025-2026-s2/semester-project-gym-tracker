import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./LoginPage.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-page">
      <section className="login-card">

        <img
          src={logo}
          alt="Gym Tracker Logo"
          className="login-logo"
        />

        <h1 className="login-title">
          Welcome,
          <br />
          lets start tracking!
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="login-input"
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="login-input"
          />

          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button className="login-button">Login</button>

        <p className="signup-text">
          Don't have an account?{" "}
          <Link to="/signup" className="signup-link">
            Sign up
          </Link>
        </p>

      </section>
    </main>
  );
}