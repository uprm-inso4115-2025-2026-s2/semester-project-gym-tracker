import React from "react";
import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
const logo = "/Colored-Logo.svg";
import "./LoginPage.css";
import { requestPasswordReset } from "./api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <img src={logo} alt="Gym Tracker Logo" className="login-logo" />

        <h1 className="login-title">
          Forgot
          <br />
          your password?
        </h1>

        {sent ? (
          <p className="success-message">
            ✓ Check your inbox! We sent a reset link to <strong>{email}</strong>.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            {errorMsg && <p className="login-error">{errorMsg}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="signup-text">
          Remember it?{" "}
          <Link to="/login" className="signup-link">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
