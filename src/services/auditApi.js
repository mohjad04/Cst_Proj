// Mock Audit Log API (append-only)
const KEY = "cst_audit_v1";

const DEFAULT = [
  {
    id: "evt_001",
    ts: "2026-01-06T10:25:10Z",
    type: "auth.login",
    actor: { role: "admin", email: "admin@cst.test" },
    entity: { kind: "user", id: "u_admin" },
    message: "Admin logged in",
    meta: { ip: "127.0.0.1" },
  },
  {
    id: "evt_002",
    ts: "2026-01-06T10:27:33Z",
    type: "taxonomy.category.create",
    actor: { role: "admin", email: "admin@cst.test" },
    entity: { kind: "category", id: "cat_road" },
    message: "Created category 'Roads'",
    meta: { code: "roads" },
  },
  {
    id: "evt_003",
    ts: "2026-01-06T10:31:02Z",
    type: "sla.policy.create",
    actor: { role: "admin", email: "admin@cst.test" },
    entity: { kind: "sla", id: "sla_road_p1" },
    message: "Created SLA policy for roads/pothole P1",
    meta: { zone: "ZONE-DT-01", target_hours: 48, breach_hours: 60 },
  },
];

function uid() {
  return `evt_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
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

// Public: list (newest first)
export async function listAuditEvents() {
  await new Promise((r) => setTimeout(r, 160));
  const rows = read();
  // ensure newest first
  return [...rows].sort((a, b) => new Date(b.ts) - new Date(a.ts));
}

// Public: append event (immutable)
export async function appendAuditEvent(event) {
  await new Promise((r) => setTimeout(r, 60));
  const rows = read();

  const item = {
    id: uid(),
    ts: new Date().toISOString(),
    type: String(event.type || "system.event"),
    actor: event.actor || { role: "system", email: "system@cst" },
    entity: event.entity || { kind: "system", id: "-" },
    message: String(event.message || ""),
    meta: event.meta || {},
  };

  rows.push(item);
  write(rows);
  return item;
}

// Helper: export CSV
export function auditToCSV(rows) {
  const safe = (v) => `"${String(v ?? "").replaceAll(`"`, `""`)}"`;

  const header = [
    "id",
    "timestamp",
    "type",
    "actor_role",
    "actor_email",
    "entity_kind",
    "entity_id",
    "message",
    "meta_json",
  ];

  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push(
      [
        safe(r.id),
        safe(r.ts),
        safe(r.type),
        safe(r.actor?.role),
        safe(r.actor?.email),
        safe(r.entity?.kind),
        safe(r.entity?.id),
        safe(r.message),
        safe(JSON.stringify(r.meta || {})),
      ].join(",")
    );
  }

  return lines.join("\n");
}

// Helper: download in browser
export function downloadTextFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
