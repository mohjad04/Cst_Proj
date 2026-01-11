// Mock login (بدون backend حاليا)
export async function login(email, password) {
  await new Promise((r) => setTimeout(r, 350));

  const normalized = String(email).trim().toLowerCase();

  if (normalized === "admin@cst.test" && password === "Admin123") {
    return {
      token: "mock-token-admin",
      user: { id: "u_admin_1", name: "CST Admin", email: normalized, role: "admin" },
    };
  }

  if (normalized === "staff@cst.test" && password === "Staff123") {
    return {
      token: "mock-token-staff",
      user: { id: "u_staff_1", name: "Office Employee", email: normalized, role: "staff" },
    };
  }

  throw new Error("Invalid credentials");
}

export async function logout() {
  await new Promise((r) => setTimeout(r, 150));
  return true;
}
