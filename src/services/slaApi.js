const BASE = "http://localhost:8000/admin/sla";

async function handle(res) {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "API error");
  }
  return res.json();
}

export async function listSlaPolicies() {
  const res = await fetch(BASE);
  return handle(res);
}

export async function createSlaPolicy(payload) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function updateSlaPolicy(id, patch) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return handle(res);
}

export async function toggleSlaActive(id) {
  const res = await fetch(`${BASE}/${id}/toggle`, {
    method: "POST",
  });
  return handle(res);
}

export async function deleteSlaPolicy(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Delete failed");
  return true;
}
