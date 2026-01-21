// src/components/sla/SLAForm.jsx
import React, { useState } from "react";
import { createSlaForRequest } from "../../services/slaApi";

const ACTIONS = ["notify_dispatcher", "notify_manager", "notify_admin", "create_ticket"];

export default function SLAForm({ request, onCreated }) {
    const [target, setTarget] = useState(48);
    const [breach, setBreach] = useState(60);
    const [targetAction, setTargetAction] = useState("notify_dispatcher");
    const [breachAction, setBreachAction] = useState("notify_manager");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    async function submit() {
        setErr("");
        if (Number.isNaN(target) || target <= 0) return setErr("Target hours must be > 0");
        if (Number.isNaN(breach) || breach <= 0) return setErr("Breach hours must be > 0");

        setBusy(true);
        try {
            const sla = await createSlaForRequest(request.request_id, {
                request_id: request.request_id,
                zone: request.zone_name,
                category: request.category,
                sub_category: request.sub_category,
                priority: request.priority,
                target_hours: target,
                breach_hours: breach,
                escalations: {
                    target: targetAction,
                    breach: breachAction,
                },
            });
            onCreated(sla);
        } catch (e) {
            setErr(e.message || "Failed to create SLA");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Create SLA for this request</div>

            <label>Target hours</label>
            <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} />

            <label>Breach hours</label>
            <input type="number" value={breach} onChange={(e) => setBreach(Number(e.target.value))} />

            <label>Escalation action at Target</label>
            <select value={targetAction} onChange={(e) => setTargetAction(e.target.value)}>
                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            <label>Escalation action at Breach</label>
            <select value={breachAction} onChange={(e) => setBreachAction(e.target.value)}>
                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            {err && <div style={{ color: "#b91c1c", fontWeight: 700 }}>{err}</div>}

            <button onClick={submit} disabled={busy} style={{ padding: "10px 12px", borderRadius: 10, border: "none", background: "#111827", color: "white", fontWeight: 800 }}>
                {busy ? "Creating..." : "Create SLA"}
            </button>
        </div>
    );
}
