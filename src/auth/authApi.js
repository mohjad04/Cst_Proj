// // Mock login (بدون backend حاليا)
// export async function login(email, password) {
//   await new Promise((r) => setTimeout(r, 350));

//   const normalized = String(email).trim().toLowerCase();

//   if (normalized === "admin@cst.test" && password === "Admin123") {
//     return {
//       token: "mock-token-admin",
//       user: { id: "u_admin_1", name: "CST Admin", email: normalized, role: "admin" },
//     };
//   }

//   if (normalized === "staff@cst.test" && password === "Staff123") {
//     return {
//       token: "mock-token-staff",
//       user: { id: "u_staff_1", name: "Office Employee", email: normalized, role: "staff" },
//     };
//   }

//   throw new Error("Invalid credentials");
// }

// export async function logout() {
//   await new Promise((r) => setTimeout(r, 150));
//   return true;
// }

// authApi.js

const BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      data?.detail ||
      data?.message ||
      (Array.isArray(data) ? data[0]?.msg : null) ||
      "Request failed";
    throw new Error(msg);
  }

  return data;
}

// ✅ Web login: ADMIN ONLY
export async function login(email, password) {
  const data = await apiPost("/auth/admin/login", { email, password });

  // backend returns: { user: ..., token: "dev-token" } :contentReference[oaicite:3]{index=3}
  const role = data?.user?.role;

  // 🔒 enforce admin-only login in the web
  if (role !== "admin") {
    throw new Error("Admins only. Please use an admin account.");
  }

  return { token: data.token, user: data.user };
}

export async function logout() {
  // no backend logout yet (JWT later). We just clear session in AuthContext.
  return true;
}
