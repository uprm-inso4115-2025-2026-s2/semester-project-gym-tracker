import React from "react";
import React from "react";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
const logo = "/Colored-Logo.svg";
import "./LoginPage.css";
import { updatePassword } from "./api";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <img src={logo} alt="Gym Tracker Logo" className="login-logo" />

        <h1 className="login-title">
          Set a new
          <br />
          password
        </h1>

        {done ? (
          <p className="success-message">
            ✓ Password updated! Redirecting you to login…
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
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
                placeholder="Confirm new password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {errorMsg && <p className="login-error">{errorMsg}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <p className="signup-text">
          <Link to="/login" className="signup-link">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
