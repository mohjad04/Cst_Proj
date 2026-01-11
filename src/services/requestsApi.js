const MOCK = [
  { request_id: "CST-2026-0001", category: "pothole", zone_id: "ZONE-DT-01", priority: "P1", status: "new", age_hours: 6.0, sla_state: "at_risk" },
  { request_id: "CST-2026-0002", category: "water_leak", zone_id: "ZONE-W-02", priority: "P2", status: "triaged", age_hours: 10.0, sla_state: "on_time" },
  { request_id: "CST-2026-0003", category: "missed_trash", zone_id: "ZONE-DT-01", priority: "P2", status: "assigned", age_hours: 30.0, sla_state: "overdue" },
];

export async function listRequests({ status } = {}) {
  await new Promise((r) => setTimeout(r, 250));
  if (!status || status === "all") return MOCK;
  return MOCK.filter((x) => x.status === status);
}

export async function getRequest(requestId) {
  await new Promise((r) => setTimeout(r, 250));
  const item = MOCK.find((x) => x.request_id === requestId);
  if (!item) throw new Error("Request not found");
  return {
    ...item,
    description: "Example description…",
    location: { address_hint: "Main Rd, Downtown", coordinates: [35.205, 31.9038] },
    timeline: [
      { type: "created", at: "2026-02-01 10:00" },
      { type: item.status, at: "2026-02-01 10:12" },
    ],
  };
}

export async function transitionRequest(requestId, nextState) {
  await new Promise((r) => setTimeout(r, 250));
  return { ok: true, request_id: requestId, status: nextState };
}
