import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/login.css";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@cst.test");
  const [password, setPassword] = useState("Admin123");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await login(email, password);
      if (res.user.role === "admin") navigate("/admin", { replace: true });
      else navigate("/staff", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>CST</h1>
        <p className="subtitle">Admin & Office Employee Portal</p>

        <div className="demo">
          <b>Demo Accounts</b>
          <div>admin@cst.test / Admin123</div>
          <div>staff@cst.test / Staff123</div>
        </div>

        <form onSubmit={onSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
