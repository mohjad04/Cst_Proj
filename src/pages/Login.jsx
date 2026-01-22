import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/login.css";
import cstLogo from "../layouts/ic_cst_logo.png";


export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("shaden@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await login(email, password);

      if (res?.user?.role !== "admin") {
        setError("Admins only. Please use an admin account.");
        return;
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">

        {/* LEFT: Logo only */}
        <div className="login-brand">
          <img className="login-left-logo" src={cstLogo} alt="CST logo" />
        </div>

        {/* RIGHT: Form */}
        <div className="login-panel">
          <div className="login-card">
            <div className="card-head">
              <div className="card-title">Sign in</div>
              <div className="card-subtitle">Use your admin credentials</div>
            </div>

            <div className="demo">
              <div className="demo-title">Demo</div>
              <div className="demo-row">
                <span>shaden@gmail.com</span>
                <span className="sep">•</span>
                <span>123456</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="login-form">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                autoComplete="username"
                required
              />

              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />

              {error && <div className="error">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <div className="hint">
                Having issues? Contact your system administrator.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
