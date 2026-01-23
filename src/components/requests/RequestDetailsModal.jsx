// import Modal, { btnPrimary, btnSecondary } from "../ui/Modal";

// export default function RequestDetailsModal({ request, onClose, onAddSla }) {
//     const t = request.timestamps || {};
//     const loc = request.location || {};
//     const citizenRef = request.citizen_ref || {};
//     const citizen = request.citizen || {};
//     const zoneName = request.zone_name;
//     const addressHint = request.address_hint;




//     return (
//         <Modal onClose={onClose}>
//             <h2 style={{ marginTop: 0 }}>{request.request_id}</h2>

//             {/* Description */}
//             <Section title="Description">
//                 <p>{request.description || "—"}</p>
//             </Section>

//             {/* Classification */}
//             <Section title="Classification">
//                 <Row label="Category" value={request.category} />
//                 <Row label="Subcategory" value={request.sub_category} />
//                 <Row label="Priority" value={request.priority} />
//                 <Row label="Status" value={request.status} />
//             </Section>

//             <Section title="Citizen">
//                 <Row label="Anonymous" value={citizenRef.anonymous ? "Yes" : "No"} />
//                 <Row label="Contact Channel" value={citizenRef.contact_channel} />

//                 {!citizenRef.anonymous && (
//                     <>
//                         <Row label="Name" value={citizen.full_name} />
//                         <Row label="Phone" value={citizen.phone} />
//                         <Row label="Email" value={citizen.email} />
//                     </>
//                 )}
//             </Section>


//             <Section title="Location">
//                 <Row label="Zone" value={zoneName} />
//                 <Row label="Address" value={addressHint} />

//                 {Array.isArray(loc.coordinates) && (
//                     <Row
//                         label="Coordinates"
//                         value={`${loc.coordinates[0]}, ${loc.coordinates[1]}`}
//                     />
//                 )}
//             </Section>


//             {/* Tags */}
//             <Section title="Tags">
//                 {Array.isArray(request.tags) && request.tags.length > 0 ? (
//                     <div style={tagWrap}>
//                         {request.tags.map((t, i) => (
//                             <span key={i} style={tag}>{t}</span>
//                         ))}
//                     </div>
//                 ) : (
//                     <p>—</p>
//                 )}
//             </Section>

//             {/* Evidence */}
//             <Section title="Evidence">
//                 {Array.isArray(request.evidence) && request.evidence.length > 0 ? (
//                     request.evidence.map((e, i) => (
//                         <div key={i} style={{ marginBottom: 10 }}>
//                             <Row label="Type" value={e.type} />
//                             <Row label="Uploaded By" value={e.uploaded_by} />
//                             <Row
//                                 label="Uploaded At"
//                                 value={new Date(e.uploaded_at).toLocaleString()}
//                             />
//                             {e.type === "photo" && e.url && (
//                                 <img
//                                     src={e.url}
//                                     alt="Evidence"
//                                     style={{
//                                         marginTop: 8,
//                                         maxWidth: "100%",
//                                         borderRadius: 8,
//                                         border: "1px solid #e5e7eb",
//                                     }}
//                                 />
//                             )}
//                         </div>
//                     ))
//                 ) : (
//                     <p>—</p>
//                 )}
//             </Section>

//             {/* Timestamps */}
//             <Section title="Timeline">
//                 <Row label="Created" value={formatTime(t.created_at)} />
//                 <Row label="Triaged" value={formatTime(t.triaged_at)} />
//                 <Row label="Assigned" value={formatTime(t.assigned_at)} />
//                 <Row label="Resolved" value={formatTime(t.resolved_at)} />
//                 <Row label="Closed" value={formatTime(t.closed_at)} />
//                 <Row label="Updated" value={formatTime(t.updated_at)} />
//             </Section>

//             {/* Actions */}
//             <div style={actions}>
//                 <button onClick={onClose} style={btnSecondary}>Close</button>
//                 <button onClick={onAddSla} style={btnPrimary}>
//                     {request.status === "triaged" ? "View SLA" : "Add SLA"}
//                 </button>
//             </div>
//         </Modal>
//     );
// }

// /* ---------- helpers ---------- */

// function formatTime(v) {
//     if (!v) return "—";
//     return new Date(v).toLocaleString();
// }

// function Section({ title, children }) {
//     return (
//         <div style={{ marginTop: 18 }}>
//             <h4 style={{ margin: "0 0 6px 0" }}>{title}</h4>
//             <div style={{ fontSize: 14 }}>{children}</div>
//         </div>
//     );
// }

// function Row({ label, value }) {
//     return (
//         <div style={row}>
//             <span style={rowLabel}>{label}</span>
//             <span>{value || "—"}</span>
//         </div>
//     );
// }

// /* ---------- styles ---------- */

// const row = {
//     display: "flex",
//     gap: 10,
//     marginBottom: 4,
// };

// const rowLabel = {
//     width: 120,
//     color: "#6b7280",
// };

// const tagWrap = {
//     display: "flex",
//     gap: 6,
//     flexWrap: "wrap",
// };

// const tag = {
//     background: "#f3f4f6",
//     padding: "4px 8px",
//     borderRadius: 999,
//     fontSize: 12,
// };

// const actions = {
//     marginTop: 24,
//     display: "flex",
//     justifyContent: "flex-end",
//     gap: 10,
// };

// src/components/requests/RequestDetailsModal.jsx
import React, { useMemo } from "react";
import Modal, { btnPrimary, btnSecondary } from "../ui/Modal";

export default function RequestDetailsModal({ request, onClose, onAddSla }) {
    const t = request?.timestamps || {};
    const loc = request?.location || {};
    const citizenRef = request?.citizen_ref || {};
    const citizen = request?.citizen || {};
    const zoneName = request?.zone_name;
    const addressHint = request?.address_hint;

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
                        {Array.isArray(request.evidence) && request.evidence.length > 0 ? (
                            <div style={{ display: "grid", gap: 10 }}>
                                {request.evidence.map((e, i) => (
                                    <div key={i} style={styles.evidenceCard}>
                                        <div style={styles.evidenceTop}>
                                            <span style={styles.eType}>{e.type || "evidence"}</span>
                                            <span style={styles.mutedSmall}>{formatTime(e.uploaded_at)}</span>
                                        </div>

                                        <TwoColRows
                                            compact
                                            rows={[
                                                ["Uploaded By", e.uploaded_by],
                                                ["Uploaded At", formatTime(e.uploaded_at)],
                                            ]}
                                        />

                                        {e.type === "photo" && e.url ? (
                                            <img
                                                src={e.url}
                                                alt="Evidence"
                                                style={styles.evidenceImg}
                                            />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={styles.muted}>—</div>
                        )}
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
};
