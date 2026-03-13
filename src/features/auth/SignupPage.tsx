import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./LoginPage.css";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          create an account!
        </h1>

        <input
          type="text"
          placeholder="Username"
          className="login-input"
        />

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

        <div className="password-field">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            className="login-input"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button className="login-button">Sign Up</button>

        <p className="signup-text">
          Already have an account?{" "}
          <Link to="/login" className="signup-link">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}