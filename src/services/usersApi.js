// src/services/usersApi.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.detail || data?.message || msg;
    } catch { }
    throw new Error(msg);
  }

  // DELETE may return empty
  if (res.status === 204) return null;
  return res.json();
}

export function listUsers() {
  return api("/admin/users");
}

export function createUser(payload) {
  return api("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId, payload) {
  return api(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(userId) {
  return api(`/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export async function verifyUser(userId) {
  return api(`/admin/users/${userId}/verify`, {
    method: "POST",
  });
}


