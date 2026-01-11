import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Unauthorized</h2>
      <p>You don’t have access to this page.</p>
      <Link to="/login">Go to Login</Link>
    </div>
  );
}
