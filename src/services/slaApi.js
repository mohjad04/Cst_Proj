// src/services/slaApi.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.detail || msg;
    } catch { }
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return await res.json();
}

/* =========================
   SLA FOR REQUESTS (CORE)
========================= */

export async function createSlaForRequest(requestId, payload) {
  return request(`/admin/requests/${requestId}/sla`, {
    method: "POST",
    body: payload,
  });
}


// 🔹 Get SLA by request (View SLA)
export function getSlaByRequest(requestId) {
  return request(`/admin/requests/${requestId}/sla`);
}

// 🔹 Update SLA for request
export function updateSlaForRequest(requestId, payload) {
  return request(`/admin/requests/${requestId}/sla`, {
    method: "PUT",
    body: payload,
  });
}

/* =========================
   GLOBAL SLA POLICIES (OPTIONAL)
========================= */

export function listSlaPolicies() {
  return request(`/admin/sla`);
}

export function updateSlaPolicy(policyId, payload) {
  return request(`/admin/sla/${policyId}`, {
    method: "PATCH",
    body: payload,
  });
}

// ✅ GET SLA RULES (zones + priorities)
export function getSlaRules() {
  return request("/admin/sla-rules");
}

export function saveSlaRules(payload) {
  return request("/admin/sla-rules", {
    method: "PUT",
    body: payload,
  });
}
