
// src/components/requests/RequestDetailsModal.jsx
import Modal, { btnPrimary, btnSecondary } from "../ui/Modal";
import React, { useEffect, useMemo, useState } from "react";
import { getSlaMonitoring } from "../../services/requestsApi";

const toLower = (v) => String(v || "").toLowerCase();

function fmtDateTime(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

/**
 * Supports BOTH shapes:
 * 1) evidence: [{ uploaded_by: "citizen"|"employee", url, ... }]
 * 2) evidence: { citizen: [...], employee: [...] }
 */
function splitEvidence(evidence) {
    if (!evidence) return { citizen: [], employee: [] };

    if (!Array.isArray(evidence) && typeof evidence === "object") {
        return {
            citizen: Array.isArray(evidence.citizen) ? evidence.citizen : [],
            employee: Array.isArray(evidence.employee) ? evidence.employee : [],
        };
    }

    const arr = Array.isArray(evidence) ? evidence : [];
    const citizen = arr.filter((x) => toLower(x.uploaded_by) === "citizen");
    const employee = arr.filter((x) => {
        const u = toLower(x.uploaded_by);
        return u === "employee" || u === "staff" || u === "admin" || u === "municipality";
    });

    return { citizen, employee };
}

function EvidenceList({ items }) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return <div style={styles.muted}>—</div>;

    return (
        <div style={{ display: "grid", gap: 10 }}>
            {rows.map((ev, idx) => {
                // ✅ SAME AS FEEDBACKS (no url prefixing, no backend manipulation)
                const url = ev.url;
                const at = ev.uploaded_at || ev.at || ev.created_at;
                const note = ev.note || ev.caption || "";

                const isImg = ev.type === "photo"; // ✅ no need to check extension

                return (
                    <div
                        key={url || idx}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "88px 1fr",
                            gap: 10,
                            border: "1px solid rgba(15,23,42,0.08)",
                            borderRadius: 12,
                            padding: 10,
                            background: "#fff",
                        }}
                    >
                        <a
                            href={url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                width: 88,
                                height: 66,
                                borderRadius: 10,
                                overflow: "hidden",
                                border: "1px solid rgba(15,23,42,0.08)",
                                background: "#f8fafc",
                                display: "grid",
                                placeItems: "center",
                                textDecoration: "none",
                            }}
                        >
                            {isImg && url ? (
                                <img
                                    src={url}
                                    alt="evidence"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <span style={{ fontWeight: 900, color: "#64748b", fontSize: 12 }}>FILE</span>
                            )}
                        </a>

                        <div style={{ display: "grid", gap: 6 }}>
                            <div style={{ fontWeight: 950, color: "#0f172a" }}>
                                {ev.type || "evidence"}
                            </div>

                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                                {fmtDateTime(at)}
                            </div>

                            {note ? (
                                <div style={{ fontSize: 12, color: "#334155", fontWeight: 800 }}>
                                    {note}
                                </div>
                            ) : null}

                            {url ? (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: 12, fontWeight: 900, color: "#2563eb" }}
                                >
                                    Open file
                                </a>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


export default function RequestDetailsModal({ request, onClose, onAddSla }) {
    const t = request?.timestamps || {};
    const loc = request?.location || {};
    const citizenRef = request?.citizen_ref || {};
    const citizen = request?.citizen || {};
    const zoneName = request?.zone_name;
    const addressHint = request?.address_hint;
    const [slaMon, setSlaMon] = useState(null);
    const [slaMonLoading, setSlaMonLoading] = useState(false);

    useEffect(() => {
        let alive = true;

        (async () => {
            const rid = request?.request_id;
            if (!rid) return;

            setSlaMonLoading(true);
            try {
                const data = await getSlaMonitoring(rid);
                if (!alive) return;
                setSlaMon(data?.monitoring || null);
            } catch (e) {
                if (!alive) return;
                setSlaMon(null);
            } finally {
                if (alive) setSlaMonLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [request?.request_id]);

    const status = String(request?.status || "").toLowerCase();

    const statusMeta = useMemo(() => getStatusMeta(status), [status]);
    const slaDisabled = status === "closed" || status === "resolved";


    return (
        <Modal onClose={onClose}>
            {/* Header */}
            <div style={styles.header}>
                <div style={{ display: "grid", gap: 6 }}>
                    <div style={styles.titleRow}>
                        <h2 style={styles.title}>{request.request_id}</h2>
                        <span
                            style={{
                                ...styles.statusPill,
                                background: statusMeta.bg,
                                borderColor: statusMeta.border,
                                color: statusMeta.text,
                            }}
                        >
                            {statusMeta.label}
                        </span>
                    </div>

                    <div style={styles.subTitle}>
                        {request.category ? (
                            <>
                                <span style={styles.kvLight}>Category</span>{" "}
                                <span style={styles.kvStrong}>{request.category}</span>
                                {request.sub_category ? (
                                    <>
                                        <span style={{ margin: "0 8px", color: "#cbd5e1" }}>•</span>
                                        <span style={styles.kvLight}>Sub</span>{" "}
                                        <span style={styles.kvStrong}>{request.sub_category}</span>
                                    </>
                                ) : null}
                                {request.priority ? (
                                    <>
                                        <span style={{ margin: "0 8px", color: "#cbd5e1" }}>•</span>
                                        <span style={styles.kvLight}>Priority</span>{" "}
                                        <span style={styles.kvStrong}>{request.priority}</span>
                                    </>
                                ) : null}
                            </>
                        ) : (
                            <span style={{ color: "#6b7280" }}>Request details</span>
                        )}
                    </div>
                </div>

                <button onClick={onClose} type="button" style={styles.closeBtn} aria-label="Close">
                    ✕
                </button>
            </div>

            {/* Content grid */}
            <div style={styles.grid}>
                {/* LEFT */}
                <div style={{ display: "grid", gap: 14 }}>
                    <Card title="Description">
                        <div style={styles.description}>
                            {request.description || "—"}
                        </div>
                    </Card>

                    <Card title="Classification">
                        <TwoColRows
                            rows={[
                                ["Category", request.category],
                                ["Subcategory", request.sub_category],
                                ["Priority", request.priority],
                                ["Status", statusMeta.label],
                            ]}
                        />
                    </Card>

                    <Card title="Citizen">
                        <TwoColRows
                            rows={[
                                ["Anonymous", citizenRef.anonymous ? "Yes" : "No"],
                                ["Contact Channel", citizenRef.contact_channel],
                            ]}
                        />
                        {!citizenRef.anonymous && (
                            <div style={{ marginTop: 10 }}>
                                <TwoColRows
                                    rows={[
                                        ["Name", citizen.full_name],
                                        ["Phone", citizen.phone],
                                        ["Email", citizen.email],
                                    ]}
                                />
                            </div>
                        )}
                    </Card>

                    <Card title="Location">
                        <TwoColRows
                            rows={[
                                ["Zone", zoneName],
                                ["Address", addressHint],
                                [
                                    "Coordinates",
                                    Array.isArray(loc.coordinates)
                                        ? `${loc.coordinates[0]}, ${loc.coordinates[1]}`
                                        : null,
                                ],
                            ]}
                        />
                    </Card>

                    <Card title="Tags">
                        {Array.isArray(request.tags) && request.tags.length > 0 ? (
                            <div style={styles.tagWrap}>
                                {request.tags.map((tg, i) => (
                                    <span key={i} style={styles.tag}>
                                        {tg}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div style={styles.muted}>—</div>
                        )}
                    </Card>

                    <Card title="Evidence">
                        {(() => {
                            const employee = Array.isArray(request.employee_evidence)
                                ? request.employee_evidence
                                : splitEvidence(request.evidence).employee;

                            const citizen = Array.isArray(request.citizen_evidence)
                                ? request.citizen_evidence
                                : splitEvidence(request.evidence).citizen;

                            return (
                                <div style={{ display: "grid", gap: 14 }}>
                                    <div>
                                        <div style={{ fontWeight: 900, marginBottom: 8, color: "#0f172a" }}>Employees Evidence</div>
                                        <EvidenceList items={employee} />
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: 900, marginBottom: 8, color: "#0f172a" }}>Citizen Evidence</div>
                                        <EvidenceList items={citizen} />
                                    </div>
                                </div>
                            );
                        })()}
                    </Card>

                </div>

                {/* RIGHT */}
                <div style={{ display: "grid", gap: 14 }}>
                    <Card title="Timeline">
                        <Timeline
                            items={[
                                ["Created", t.created_at],
                                ["Triaged", t.triaged_at],
                                ["Assigned", t.assigned_at],
                                ["In Progress", t.in_progress_at],
                                ["Resolved", t.resolved_at],
                                ["Closed", t.closed_at],
                                ["Updated", t.updated_at],
                            ]}
                        />
                    </Card>

                    <Card title="SLA">
                        <div style={styles.slaBox}>
                            <div style={styles.slaHint}>
                                {status === "new" ? (
                                    <>This request has no SLA yet. Click <b>Add SLA</b> to create one.</>
                                ) : (
                                    <>
                                        You can <b>update</b> the SLA anytime.
                                        <br />
                                        <span style={{ color: "#64748b" }}>
                                            Team can be changed <b>only</b> when status is <b>Assigned</b>.
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* ✅ SLA Monitoring */}
                            <div style={styles.monCard}>
                                <div style={styles.monTop}>
                                    <div style={styles.monTitle}>SLA Monitoring</div>
                                    {slaMonLoading ? (
                                        <span style={styles.monMuted}>Loading…</span>
                                    ) : (
                                        <span style={{ ...styles.monPill, ...monPillStyle(slaMon?.state) }}>
                                            {monLabel(slaMon?.state)}
                                        </span>
                                    )}
                                </div>

                                <div style={styles.monGrid}>
                                    <MonKV label="Elapsed" value={fmtMinutes(slaMon?.elapsed_minutes)} />
                                    <MonKV label="Target" value={fmtHours(slaMon?.sla_target_hours)} />
                                    <MonKV label="To Target" value={fmtMinutes(slaMon?.remaining_to_target_minutes)} />
                                    <MonKV label="To Breach" value={fmtMinutes(slaMon?.remaining_to_breach_minutes)} />
                                </div>

                                {!!slaMon?.breach_reason && (
                                    <div style={styles.monNote}>
                                        <b>Reason:</b> {String(slaMon.breach_reason)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <div style={styles.actions}>
                        <button onClick={onClose} style={btnSecondary}>
                            Close
                        </button>

                        <button
                            onClick={() => onAddSla({ mode: status === "new" ? "create" : "update", request })}
                            style={{
                                ...btnPrimary,
                                ...(slaDisabled ? { opacity: 0.55, cursor: "not-allowed" } : null),
                            }}
                            disabled={slaDisabled}
                            title={slaDisabled ? "SLA cannot be updated when request is closed" : ""}
                        >
                            {slaDisabled ? "SLA Locked" : status === "new" ? "Add SLA" : "Update SLA"}
                        </button>

                    </div>

                </div>
            </div>
        </Modal>
    );
}

/* ---------- components ---------- */

function Card({ title, children }) {
    return (
        <div style={styles.card}>
            <div style={styles.cardTitle}>{title}</div>
            <div>{children}</div>
        </div>
    );
}

function TwoColRows({ rows, compact = false }) {
    return (
        <div style={{ display: "grid", gap: compact ? 6 : 8 }}>
            {rows.map(([label, value], idx) => (
                <div key={idx} style={styles.row}>
                    <div style={styles.rowLabel}>{label}</div>
                    <div style={styles.rowValue}>{value || "—"}</div>
                </div>
            ))}
        </div>
    );
}

function Timeline({ items }) {
    return (
        <div style={{ display: "grid", gap: 10 }}>
            {items.map(([label, value], idx) => (
                <div key={idx} style={styles.tlRow}>
                    <div style={styles.tlDot} />
                    <div style={{ display: "grid", gap: 2 }}>
                        <div style={styles.tlLabel}>{label}</div>
                        <div style={styles.tlValue}>{formatTime(value)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------- helpers ---------- */

function formatTime(v) {
    if (!v) return "—";
    try {
        return new Date(v).toLocaleString();
    } catch {
        return "—";
    }
}

function getStatusMeta(status) {
    const s = String(status || "").toLowerCase();

    if (s === "new")
        return { label: "New", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.22)", text: "#991b1b" };
    if (s === "triaged")
        return { label: "Triaged", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.22)", text: "#92400e" };
    if (s === "assigned")
        return { label: "Assigned", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.22)", text: "#1d4ed8" };
    if (s === "in_progress")
        return { label: "In Progress", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.22)", text: "#6d28d9" };
    if (s === "resolved")
        return { label: "Resolved", bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.22)", text: "#166534" };
    if (s === "closed")
        return { label: "Closed", bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.20)", text: "#334155" };

    return { label: status || "—", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.20)", text: "#334155" };
}

function monLabel(state) {
    const s = String(state || "").toLowerCase();
    if (s === "on_track") return "On Track";
    if (s === "at_risk") return "At Risk";
    if (s === "breached") return "Breached";
    return "—";
}

function monPillStyle(state) {
    const s = String(state || "").toLowerCase();
    if (s === "on_track") return { background: "rgba(22,163,74,0.10)", borderColor: "rgba(22,163,74,0.22)", color: "#166534" };
    if (s === "at_risk") return { background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.22)", color: "#92400e" };
    if (s === "breached") return { background: "rgba(220,38,38,0.10)", borderColor: "rgba(220,38,38,0.22)", color: "#991b1b" };
    return { background: "rgba(148,163,184,0.10)", borderColor: "rgba(148,163,184,0.20)", color: "#334155" };
}

function fmtMinutes(min) {
    if (min === null || min === undefined) return "—";
    const n = Number(min);
    if (!Number.isFinite(n)) return "—";
    if (n < 60) return `${Math.max(0, Math.floor(n))}m`;
    const h = Math.floor(n / 60);
    const m = Math.floor(n % 60);
    return `${h}h ${m}m`;
}

function fmtHours(h) {
    if (h === null || h === undefined) return "—";
    const n = Number(h);
    if (!Number.isFinite(n)) return "—";
    return `${n}h`;
}

function MonKV({ label, value }) {
    return (
        <div style={styles.monKV}>
            <div style={styles.monK}>{label}</div>
            <div style={styles.monV}>{value || "—"}</div>
        </div>
    );
}


/* ---------- styles ---------- */

const styles = {
    header: {
        position: "sticky",
        top: 0,
        zIndex: 2,
        background: "white",
        paddingBottom: 12,
        marginBottom: 14,
        borderBottom: "1px solid rgba(15,23,42,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "start",
        gap: 10,
    },
    titleRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
    title: { margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" },
    statusPill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        border: "1px solid",
    },
    subTitle: { fontSize: 13, color: "#6b7280" },
    kvLight: { color: "#94a3b8", fontWeight: 700 },
    kvStrong: { color: "#0f172a", fontWeight: 800 },

    closeBtn: {
        border: "1px solid rgba(15,23,42,0.10)",
        background: "#fff",
        show: "block",
        width: 36,
        height: 36,
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 900,
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "1.25fr 0.9fr",
        gap: 14,
        alignItems: "start",
    },

    card: {
        background: "white",
        border: "1px solid rgba(15,23,42,0.08)",
        borderRadius: 14,
        padding: 14,
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    },
    cardTitle: { fontWeight: 900, marginBottom: 10, color: "#0f172a" },

    description: {
        color: "#0f172a",
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
    },

    row: {
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 10,
        alignItems: "baseline",
    },
    rowLabel: { color: "#64748b", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" },
    rowValue: { color: "#0f172a", fontWeight: 700, fontSize: 14, overflowWrap: "anywhere" },

    tagWrap: { display: "flex", gap: 8, flexWrap: "wrap" },
    tag: {
        background: "#f1f5f9",
        border: "1px solid rgba(15,23,42,0.08)",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color: "#0f172a",
    },

    muted: { color: "#94a3b8", fontWeight: 700 },
    mutedSmall: { color: "#94a3b8", fontSize: 12, fontWeight: 700 },

    evidenceCard: {
        border: "1px solid rgba(15,23,42,0.08)",
        borderRadius: 12,
        padding: 12,
        background: "#fff",
    },
    evidenceTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    eType: {
        fontSize: 12,
        fontWeight: 900,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid rgba(15,23,42,0.08)",
        background: "#f8fafc",
        color: "#0f172a",
    },
    evidenceImg: {
        marginTop: 10,
        width: "100%",
        maxHeight: 220,
        objectFit: "cover",
        borderRadius: 12,
        border: "1px solid rgba(15,23,42,0.08)",
    },

    tlRow: { display: "grid", gridTemplateColumns: "14px 1fr", gap: 10, alignItems: "start" },
    tlDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        marginTop: 4,
        background: "#0f172a",
        opacity: 0.2,
    },
    tlLabel: { fontSize: 12, fontWeight: 900, color: "#0f172a" },
    tlValue: { fontSize: 12, fontWeight: 700, color: "#64748b" },

    slaBox: { display: "grid", gap: 10 },
    slaHint: { fontSize: 13, color: "#64748b", lineHeight: 1.5 },

    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        paddingTop: 4,
    },
    monCard: {
        marginTop: 10,
        border: "1px solid rgba(15,23,42,0.08)",
        background: "rgba(15,23,42,0.02)",
        borderRadius: 12,
        padding: 12,
    },
    monTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 10,
    },
    monTitle: { fontWeight: 900, color: "#0f172a" },
    monMuted: { color: "#94a3b8", fontWeight: 800, fontSize: 12 },
    monPill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: "1px solid",
    },
    monGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
    },
    monKV: { display: "grid", gap: 4 },
    monK: { fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" },
    monV: { fontSize: 13, fontWeight: 900, color: "#0f172a" },
    monNote: {
        marginTop: 10,
        fontSize: 12,
        fontWeight: 800,
        color: "#334155",
        background: "#fff",
        border: "1px solid rgba(15,23,42,0.08)",
        borderRadius: 10,
        padding: "8px 10px",
    },

};
