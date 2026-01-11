// Mock Agents/Teams API (replace with FastAPI later)
const KEY = "cst_agents_teams_v1";

const DEFAULT = {
  teams: [
    {
      id: "t_road_1",
      name: "Road Maintenance Team",
      zones: ["ZONE-DT-01", "ZONE-N-03"],
      skills: ["pothole", "asphalt_damage"],
      shift: "Day",
      active: true,
      created_at: "2026-01-02",
    },
    {
      id: "t_water_1",
      name: "Water Emergency Team",
      zones: ["ZONE-W-02"],
      skills: ["water_leak"],
      shift: "24/7",
      active: true,
      created_at: "2026-01-04",
    },
  ],
  agents: [
    {
      id: "a_1",
      full_name: "Ahmad N.",
      email: "ahmad.agent@cst.test",
      phone: "0599000001",
      team_id: "t_road_1",
      zones: ["ZONE-DT-01"],
      skills: ["pothole"],
      shift: "Day",
      workload_open: 2,
      active: true,
      created_at: "2026-01-10",
    },
    {
      id: "a_2",
      full_name: "Sara M.",
      email: "sara.agent@cst.test",
      phone: "0599000002",
      team_id: "t_water_1",
      zones: ["ZONE-W-02"],
      skills: ["water_leak"],
      shift: "24/7",
      workload_open: 1,
      active: true,
      created_at: "2026-01-10",
    },
  ],
};

function read() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.teams || !parsed?.agents) return DEFAULT;
    return parsed;
  } catch {
    return DEFAULT;
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// Teams
export async function listTeams() {
  await new Promise((r) => setTimeout(r, 150));
  return read().teams;
}

export async function createTeam(payload) {
  await new Promise((r) => setTimeout(r, 200));
  const data = read();

  const name = payload.name.trim();
  if (!name) throw new Error("Team name is required");

  const team = {
    id: uid("t"),
    name,
    zones: payload.zones || [],
    skills: payload.skills || [],
    shift: payload.shift || "Day",
    active: true,
    created_at: new Date().toISOString().slice(0, 10),
  };

  data.teams.unshift(team);
  write(data);
  return team;
}

export async function updateTeam(teamId, payload) {
  await new Promise((r) => setTimeout(r, 200));
  const data = read();
  const idx = data.teams.findIndex((t) => t.id === teamId);
  if (idx === -1) throw new Error("Team not found");

  const next = { ...data.teams[idx] };
  if (payload.name != null) next.name = payload.name.trim();
  if (payload.zones != null) next.zones = payload.zones;
  if (payload.skills != null) next.skills = payload.skills;
  if (payload.shift != null) next.shift = payload.shift;

  data.teams[idx] = next;
  write(data);
  return next;
}

export async function toggleTeamActive(teamId) {
  await new Promise((r) => setTimeout(r, 150));
  const data = read();
  const idx = data.teams.findIndex((t) => t.id === teamId);
  if (idx === -1) throw new Error("Team not found");

  const team = data.teams[idx];
  const updated = { ...team, active: !team.active };
  data.teams[idx] = updated;

  // optional: disable agents if team disabled
  if (!updated.active) {
    data.agents = data.agents.map((a) =>
      a.team_id === teamId ? { ...a, active: false } : a
    );
  }

  write(data);
  return updated;
}

export async function deleteTeam(teamId) {
  await new Promise((r) => setTimeout(r, 150));
  const data = read();

  // prevent deleting team that still has agents
  const hasAgents = data.agents.some((a) => a.team_id === teamId);
  if (hasAgents) {
    const err = new Error("Cannot delete team: it still has agents assigned.");
    err.code = "TEAM_HAS_AGENTS";
    throw err;
  }

  data.teams = data.teams.filter((t) => t.id !== teamId);
  write(data);
  return true;
}

// Agents
export async function listAgents() {
  await new Promise((r) => setTimeout(r, 150));
  return read().agents;
}

export async function createAgent(payload) {
  await new Promise((r) => setTimeout(r, 220));
  const data = read();

  const full_name = payload.full_name.trim();
  const email = String(payload.email || "").trim().toLowerCase();
  if (!full_name) throw new Error("Full name is required");
  if (!email) throw new Error("Email is required");

  if (data.agents.some((a) => a.email === email)) {
    const err = new Error("Email already exists");
    err.code = "DUPLICATE_EMAIL";
    throw err;
  }

  const agent = {
    id: uid("a"),
    full_name,
    email,
    phone: payload.phone || "",
    team_id: payload.team_id || null,
    zones: payload.zones || [],
    skills: payload.skills || [],
    shift: payload.shift || "Day",
    workload_open: Number(payload.workload_open || 0),
    active: true,
    created_at: new Date().toISOString().slice(0, 10),
  };

  data.agents.unshift(agent);
  write(data);
  return agent;
}

export async function updateAgent(agentId, payload) {
  await new Promise((r) => setTimeout(r, 220));
  const data = read();
  const idx = data.agents.findIndex((a) => a.id === agentId);
  if (idx === -1) throw new Error("Agent not found");

  const next = { ...data.agents[idx] };

  if (payload.full_name != null) next.full_name = payload.full_name.trim();
  if (payload.email != null) {
    const email = String(payload.email).trim().toLowerCase();
    if (data.agents.some((a) => a.email === email && a.id !== agentId)) {
      const err = new Error("Email already exists");
      err.code = "DUPLICATE_EMAIL";
      throw err;
    }
    next.email = email;
  }
  if (payload.phone != null) next.phone = payload.phone;
  if (payload.team_id != null) next.team_id = payload.team_id;
  if (payload.zones != null) next.zones = payload.zones;
  if (payload.skills != null) next.skills = payload.skills;
  if (payload.shift != null) next.shift = payload.shift;
  if (payload.workload_open != null) next.workload_open = Number(payload.workload_open);

  data.agents[idx] = next;
  write(data);
  return next;
}

export async function toggleAgentActive(agentId) {
  await new Promise((r) => setTimeout(r, 150));
  const data = read();
  const idx = data.agents.findIndex((a) => a.id === agentId);
  if (idx === -1) throw new Error("Agent not found");

  data.agents[idx] = { ...data.agents[idx], active: !data.agents[idx].active };
  write(data);
  return data.agents[idx];
}

export async function deleteAgent(agentId) {
  await new Promise((r) => setTimeout(r, 150));
  const data = read();
  data.agents = data.agents.filter((a) => a.id !== agentId);
  write(data);
  return true;
}
