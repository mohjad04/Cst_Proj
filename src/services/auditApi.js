// src/services/auditApi.js
// Real Audit API (FastAPI)

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getAuth() {
  const raw = sessionStorage.getItem("cst_auth_v1");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function authHeader() {
  const auth = getAuth();
  const token = auth?.access_token || auth?.token || auth?.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.detail || data?.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  // if csv/text
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/csv")) return await res.text();
  if (contentType.includes("text/plain")) return await res.text();

  return await res.json();
}

/**
 * listAuditEvents({
 *   q, type, role, dateFrom, dateTo, limit, skip
 * })
 */
export async function listAuditEvents(params = {}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", params.q);
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.role && params.role !== "all") qs.set("role", params.role);
  if (params.dateFrom) qs.set("date_from", params.dateFrom);
  if (params.dateTo) qs.set("date_to", params.dateTo);
  if (Number.isFinite(params.limit)) qs.set("limit", String(params.limit));
  if (Number.isFinite(params.skip)) qs.set("skip", String(params.skip));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/admin/audit${suffix}`);
}

// Optional: fetch one event if your backend supports it
export async function getAuditEvent(eventId) {
  return request(`/admin/audit/${encodeURIComponent(eventId)}`);
}

// Export CSV from backend (recommended)
export async function exportAuditCsv(params = {}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", params.q);
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.role && params.role !== "all") qs.set("role", params.role);
  if (params.dateFrom) qs.set("date_from", params.dateFrom);
  if (params.dateTo) qs.set("date_to", params.dateTo);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const csvText = await request(`/admin/audit/export.csv${suffix}`, {
    headers: { Accept: "text/csv" },
  });

  return csvText;
}

/* ---------- helpers (client side) ---------- */

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

  for (const r of rows || []) {
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

export function downloadTextFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
