// Mock SLA API (replace with FastAPI later)
const KEY = "cst_sla_policies_v1";

const DEFAULT = [
  {
    id: "sla_road_p1",
    name: "Roads P1 - Downtown",
    zone: "ZONE-DT-01",
    category_code: "roads",
    subcategory_code: "pothole",
    priority: "P1",
    target_hours: 48,
    breach_threshold_hours: 60,
    escalation_steps: [
      { after_hours: 48, action: "notify_dispatcher" },
      { after_hours: 60, action: "notify_manager" },
    ],
    active: true,
    created_at: "2026-01-05",
  },
  {
    id: "sla_water_p1",
    name: "Water Leak P1 - West",
    zone: "ZONE-W-02",
    category_code: "water",
    subcategory_code: "water_leak",
    priority: "P1",
    target_hours: 12,
    breach_threshold_hours: 18,
    escalation_steps: [
      { after_hours: 12, action: "notify_dispatcher" },
      { after_hours: 18, action: "notify_manager" },
    ],
    active: true,
    created_at: "2026-01-06",
  },
];

function uid() {
  return `sla_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function read() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function write(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

function normalizeKey(zone, category_code, subcategory_code, priority) {
  return `${zone}::${category_code || ""}::${subcategory_code || ""}::${priority}`.toLowerCase();
}

export async function listSlaPolicies() {
  await new Promise((r) => setTimeout(r, 160));
  return read();
}

export async function createSlaPolicy(payload) {
  await new Promise((r) => setTimeout(r, 220));
  const rows = read();

  const policy = {
    id: uid(),
    name: String(payload.name || "").trim(),
    zone: String(payload.zone || "").trim(),
    category_code: String(payload.category_code || "").trim(),
    subcategory_code: String(payload.subcategory_code || "").trim(),
    priority: String(payload.priority || "P3").trim(),
    target_hours: Number(payload.target_hours || 0),
    breach_threshold_hours: Number(payload.breach_threshold_hours || 0),
    escalation_steps: Array.isArray(payload.escalation_steps) ? payload.escalation_steps : [],
    active: true,
    created_at: new Date().toISOString().slice(0, 10),
  };

  if (!policy.name) throw new Error("Policy name is required");
  if (!policy.zone) throw new Error("Zone is required");
  if (!policy.priority) throw new Error("Priority is required");
  if (!policy.category_code) throw new Error("Category is required");
  if (!policy.subcategory_code) throw new Error("Subcategory is required");
  if (policy.target_hours <= 0) throw new Error("Target hours must be > 0");
  if (policy.breach_threshold_hours <= 0) throw new Error("Breach hours must be > 0");
  if (policy.breach_threshold_hours < policy.target_hours) {
    throw new Error("Breach threshold must be >= target hours");
  }

  // unique match key (zone+cat+sub+priority)
  const key = normalizeKey(policy.zone, policy.category_code, policy.subcategory_code, policy.priority);
  if (rows.some((p) => normalizeKey(p.zone, p.category_code, p.subcategory_code, p.priority) === key)) {
    const err = new Error("A policy already exists for (zone + category + subcategory + priority)");
    err.code = "DUPLICATE_POLICY";
    throw err;
  }

  // validate escalation steps
  const steps = policy.escalation_steps
    .map((s) => ({ after_hours: Number(s.after_hours || 0), action: String(s.action || "").trim() }))
    .filter((s) => s.after_hours > 0 && s.action);

  policy.escalation_steps = steps.sort((a, b) => a.after_hours - b.after_hours);

  rows.unshift(policy);
  write(rows);
  return policy;
}

export async function updateSlaPolicy(policyId, payload) {
  await new Promise((r) => setTimeout(r, 220));
  const rows = read();
  const idx = rows.findIndex((p) => p.id === policyId);
  if (idx === -1) throw new Error("Policy not found");

  const next = { ...rows[idx] };

  if (payload.name != null) next.name = String(payload.name).trim();
  if (payload.zone != null) next.zone = String(payload.zone).trim();
  if (payload.category_code != null) next.category_code = String(payload.category_code).trim();
  if (payload.subcategory_code != null) next.subcategory_code = String(payload.subcategory_code).trim();
  if (payload.priority != null) next.priority = String(payload.priority).trim();
  if (payload.target_hours != null) next.target_hours = Number(payload.target_hours);
  if (payload.breach_threshold_hours != null) next.breach_threshold_hours = Number(payload.breach_threshold_hours);
  if (payload.escalation_steps != null) next.escalation_steps = payload.escalation_steps;

  if (!next.name) throw new Error("Policy name is required");
  if (!next.zone) throw new Error("Zone is required");
  if (!next.priority) throw new Error("Priority is required");
  if (!next.category_code) throw new Error("Category is required");
  if (!next.subcategory_code) throw new Error("Subcategory is required");
  if (next.target_hours <= 0) throw new Error("Target hours must be > 0");
  if (next.breach_threshold_hours <= 0) throw new Error("Breach hours must be > 0");
  if (next.breach_threshold_hours < next.target_hours) {
    throw new Error("Breach threshold must be >= target hours");
  }

  const key = normalizeKey(next.zone, next.category_code, next.subcategory_code, next.priority);
  if (
    rows.some(
      (p) =>
        p.id !== policyId &&
        normalizeKey(p.zone, p.category_code, p.subcategory_code, p.priority) === key
    )
  ) {
    const err = new Error("A policy already exists for (zone + category + subcategory + priority)");
    err.code = "DUPLICATE_POLICY";
    throw err;
  }

  const steps = Array.isArray(next.escalation_steps)
    ? next.escalation_steps
        .map((s) => ({ after_hours: Number(s.after_hours || 0), action: String(s.action || "").trim() }))
        .filter((s) => s.after_hours > 0 && s.action)
        .sort((a, b) => a.after_hours - b.after_hours)
    : [];

  next.escalation_steps = steps;

  rows[idx] = next;
  write(rows);
  return next;
}

export async function toggleSlaActive(policyId) {
  await new Promise((r) => setTimeout(r, 160));
  const rows = read();
  const idx = rows.findIndex((p) => p.id === policyId);
  if (idx === -1) throw new Error("Policy not found");

  rows[idx] = { ...rows[idx], active: !rows[idx].active };
  write(rows);
  return rows[idx];
}

export async function deleteSlaPolicy(policyId) {
  await new Promise((r) => setTimeout(r, 160));
  const rows = read();
  write(rows.filter((p) => p.id !== policyId));
  return true;
}
