// src/services/agentsApi.js
const BASE_URL = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // خلي الخطأ واضح بدل ERR_FAILED
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  // DELETE غالبًا يرجع 204
  if (res.status === 204) return null;
  return await res.json();
}

/* ---------- Teams ---------- */
export function listTeams() {
  return request("/admin/teams");
}

export function createTeam(payload) {
  return request("/admin/teams", { method: "POST", body: payload });
}

export function updateTeam(teamId, payload) {
  return request(`/admin/teams/${teamId}`, { method: "PATCH", body: payload });
}

export function toggleTeamActive(teamId) {
  return request(`/admin/teams/${teamId}/toggle`, { method: "POST" });
}

export function deleteTeam(teamId) {
  return request(`/admin/teams/${teamId}`, { method: "DELETE" });
}

/* ---------- Agents ---------- */
export function listAgents() {
  return request("/admin/agents");
}

export function createAgent(payload) {
  return request("/admin/agents", { method: "POST", body: payload });
}

export function updateAgent(agentId, payload) {
  return request(`/admin/agents/${agentId}`, { method: "PATCH", body: payload });
}

export function toggleAgentActive(agentId) {
  return request(`/admin/agents/${agentId}/toggle`, { method: "POST" });
}

export function deleteAgent(agentId) {
  return request(`/admin/agents/${agentId}`, { method: "DELETE" });
}
