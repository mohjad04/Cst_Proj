// Mock Users API (استبدله لاحقًا بربط FastAPI)
const STORAGE_KEY = "cst_users_v1";

const DEFAULT_USERS = [
  {
    id: "u_admin_1",
    full_name: "CST Admin",
    email: "admin@cst.test",
    role: "admin",
    active: true,
    created_at: "2026-01-01",
    last_login_at: "2026-01-11",
  },
  {
    id: "u_staff_1",
    full_name: "Office Employee",
    email: "staff@cst.test",
    role: "staff",
    active: true,
    created_at: "2026-01-02",
    last_login_at: "2026-01-11",
  },
];

function read() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_USERS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function write(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function uid() {
  return "u_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export async function listUsers() {
  await new Promise((r) => setTimeout(r, 180));
  return read();
}

export async function createUser(payload) {
  await new Promise((r) => setTimeout(r, 220));
  const users = read();

  const email = String(payload.email).trim().toLowerCase();
  if (users.some((u) => u.email === email)) {
    const err = new Error("Email already exists");
    err.code = "DUPLICATE_EMAIL";
    throw err;
  }

  const now = new Date();
  const user = {
    id: uid(),
    full_name: payload.full_name.trim(),
    email,
    role: payload.role, // admin | staff
    active: true,
    created_at: now.toISOString().slice(0, 10),
    last_login_at: null,
  };

  users.unshift(user);
  write(users);
  return user;
}

export async function updateUser(userId, payload) {
  await new Promise((r) => setTimeout(r, 220));
  const users = read();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");

  const next = { ...users[idx] };

  if (payload.full_name != null) next.full_name = payload.full_name.trim();
  if (payload.role != null) next.role = payload.role;
  if (payload.email != null) {
    const email = String(payload.email).trim().toLowerCase();
    if (users.some((u) => u.email === email && u.id !== userId)) {
      const err = new Error("Email already exists");
      err.code = "DUPLICATE_EMAIL";
      throw err;
    }
    next.email = email;
  }
  if (payload.active != null) next.active = Boolean(payload.active);

  users[idx] = next;
  write(users);
  return next;
}

export async function toggleUserActive(userId) {
  await new Promise((r) => setTimeout(r, 180));
  const users = read();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  users[idx] = { ...users[idx], active: !users[idx].active };
  write(users);
  return users[idx];
}

export async function deleteUser(userId) {
  await new Promise((r) => setTimeout(r, 180));
  const users = read();
  const next = users.filter((u) => u.id !== userId);
  write(next);
  return true;
}
