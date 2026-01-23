// 

import React, { useEffect, useMemo, useState } from "react";
import RequestDetailsModal from "../../components/requests/RequestDetailsModal";
import SlaRulesModal from "../../components/sla/SlaRulesModal";
import { SlaModal } from "./SlaPolicies";
import {
    createSlaForRequest,
    updateSlaForRequest,
    getSlaByRequest,
} from "../../services/slaApi";
import { listRequests, getRequestById } from "../../services/requestsApi";

/* ----------------------------- small helpers ----------------------------- */
const isArr = (v) => Array.isArray(v);

function Icon({ name, style }) {
    const common = { width: 16, height: 16, display: "inline-block", ...style };
    if (name === "search")
        return (
            <svg viewBox="0 0 24 24" style={common} fill="none">
                <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.2-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    if (name === "refresh")
        return (
            <svg viewBox="0 0 24 24" style={common} fill="none">
                <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    if (name === "gear")
        return (
            <svg viewBox="0 0 24 24" style={common} fill="none">
                <path
                    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <path
                    d="M19.4 15a7.94 7.94 0 0 0 .1-1 7.94 7.94 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3h-6l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.94 7.94 0 0 0-.1 1c0 .34.03.67.1 1l-2 1.5 2 3.4 2.4-1c.53.4 1.1.74 1.7 1L9 21h6l.3-2.6c.6-.26 1.17-.6 1.7-1l2.4 1 2-3.4-2-1.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </svg>
        );
    return null;
}

function fmtDate(v) {
    if (!v) return "—";
    try {
        return new Date(v).toLocaleString();
    } catch {
        return "—";
    }
}

function statusMeta(status) {
    const s = String(status || "").toLowerCase();

    if (s === "new")
        return {
            label: "New",
            rail: "rgba(220,38,38,0.85)",
            bg: "rgba(220,38,38,0.10)",
            border: "rgba(220,38,38,0.22)",
            text: "#991b1b",
        };

    if (s === "triaged")
        return {
            label: "Triaged",
            rail: "rgba(245,158,11,0.85)", // amber
            bg: "rgba(245,158,11,0.12)",
            border: "rgba(245,158,11,0.22)",
            text: "#92400e",
        };

    if (s === "assigned")
        return {
            label: "Assigned",
            rail: "rgba(59,130,246,0.85)", // blue
            bg: "rgba(59,130,246,0.12)",
            border: "rgba(59,130,246,0.22)",
            text: "#1d4ed8",
        };

    if (s === "in_progress")
        return {
            label: "In Progress",
            rail: "rgba(168,85,247,0.85)", // purple
            bg: "rgba(168,85,247,0.12)",
            border: "rgba(168,85,247,0.22)",
            text: "#6d28d9",
        };

    if (s === "resolved")
        return {
            label: "Resolved",
            rail: "rgba(22,163,74,0.85)", // green
            bg: "rgba(22,163,74,0.10)",
            border: "rgba(22,163,74,0.22)",
            text: "#166534",
        };

    if (s === "closed")
        return {
            label: "Closed",
            rail: "rgba(100,116,139,0.75)", // slate
            bg: "rgba(100,116,139,0.10)",
            border: "rgba(100,116,139,0.20)",
            text: "#334155",
        };

    return {
        label: status || "—",
        rail: "rgba(148,163,184,0.75)",
        bg: "rgba(148,163,184,0.10)",
        border: "rgba(148,163,184,0.20)",
        text: "#334155",
    };
}


function Button({ variant = "primary", children, style, ...props }) {
    const v =
        variant === "primary"
            ? styles.btnPrimary
            : variant === "neutral"
                ? styles.btnNeutral
                : variant === "soft"
                    ? styles.btnSoft
                    : styles.btnNeutral;

    return (
        <button type="button" {...props} style={{ ...styles.btn, ...v, ...style }}>
            {children}
        </button>
    );
}

function Pill({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{ ...styles.pillBtn, ...(active ? styles.pillBtnOn : null) }}
        >
            {children}
        </button>
    );
}

/* ================================ PAGE ================================ */

export default function Requests() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all | new | triaged | resolved | closed

    const [openRequest, setOpenRequest] = useState(null);
    const [slaModal, setSlaModal] = useState({
        open: false,
        mode: "create", // "create" | "edit"
        request: null,
    });
    const [showSlaRules, setShowSlaRules] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState("all"); // all | P1..P5
    const [zoneFilter, setZoneFilter] = useState("all");         // all | ZONE-R1-C1...
    const [dateFrom, setDateFrom] = useState("");                // "YYYY-MM-DD"
    const [dateTo, setDateTo] = useState("");                    // "YYYY-MM-DD"


    async function reload() {
        setLoading(true);
        try {
            const data = await listRequests();
            const normalized = (isArr(data) ? data : []).map((r) => ({
                ...r,
                id: r.id || r._id || r.request_id,
            }));
            setRows(normalized);
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const data = await listRequests();
                if (!alive) return;

                const normalized = (isArr(data) ? data : []).map((r) => ({
                    ...r,
                    id: r.id || r._id || r.request_id,
                }));
                setRows(normalized);
            } catch (e) {
                console.error(e);
                if (alive) setRows([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const stats = useMemo(() => {
        const total = rows.length;
        const by = {
            new: 0,
            triaged: 0,
            assigned: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0,
            other: 0,
        };

        rows.forEach((r) => {
            const s = String(r.status || "").toLowerCase();
            if (by[s] !== undefined) by[s] += 1;
            else by.other += 1;
        });

        return { total, ...by };
    }, [rows]);


    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();

        // convert dateFrom/dateTo to real boundaries (local time)
        const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
        const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

        return rows
            .filter((r) => {
                const s = String(r.status || "").toLowerCase();
                if (statusFilter !== "all" && s !== statusFilter) return false;

                // ✅ priority
                const p = r?.priority ? String(r.priority) : "";
                if (priorityFilter !== "all" && p !== priorityFilter) return false;

                // ✅ zone
                const z = String(r.zone_name || r.location?.zone_name || "");
                if (zoneFilter !== "all" && z !== zoneFilter) return false;

                // ✅ dates
                const created = r.timestamps?.created_at || r.created_at;
                const createdMs = created ? new Date(created).getTime() : NaN;
                if (fromMs != null && Number.isFinite(createdMs) && createdMs < fromMs) return false;
                if (toMs != null && Number.isFinite(createdMs) && createdMs > toMs) return false;
                if ((fromMs != null || toMs != null) && !Number.isFinite(createdMs)) return false;

                // ✅ search
                if (!query) return true;
                const hay = [
                    r.request_id,
                    r.category,
                    r.sub_category,
                    r.priority,
                    r.zone_name || r.location?.zone_name,
                    r.address_hint,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return hay.includes(query);
            })
            .sort((a, b) => {
                const aT = new Date(a.timestamps?.created_at || a.created_at || 0).getTime();
                const bT = new Date(b.timestamps?.created_at || b.created_at || 0).getTime();
                return bT - aT;
            });
    }, [rows, q, statusFilter, priorityFilter, zoneFilter, dateFrom, dateTo]);

    const priorityOptions = useMemo(() => {
        const set = new Set();
        rows.forEach((r) => {
            const p = r?.priority;
            if (p) set.add(String(p));
        });
        return ["all", ...Array.from(set).sort()];
    }, [rows]);

    const zoneOptions = useMemo(() => {
        const set = new Set();
        rows.forEach((r) => {
            const z = r?.zone_name || r?.location?.zone_name;
            if (z) set.add(String(z));
        });
        return ["all", ...Array.from(set).sort()];
    }, [rows]);

    const hasAnyExtraFilter = useMemo(() => {
        return (
            statusFilter !== "all" ||
            priorityFilter !== "all" ||
            zoneFilter !== "all" ||
            !!dateFrom ||
            !!dateTo ||
            !!q.trim()
        );
    }, [statusFilter, priorityFilter, zoneFilter, dateFrom, dateTo, q]);



    async function openDetails(r) {
        try {
            const full = await getRequestById(r.request_id);
            setOpenRequest(full);
        } catch (e) {
            console.error(e);
            alert(e?.message || "Failed to open request");
        }
    }

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.loadingCard}>Loading requests…</div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* toolbar */}
            <div style={styles.toolbar}>
                <div style={styles.toolbarLeft}>
                    <div style={styles.chipsRow}>
                        <span style={styles.chip}>{stats.total} total</span>
                        <span style={{ ...styles.chip, ...styles.chipRed }}>{stats.new} new</span>
                        <span style={styles.chip}>{stats.triaged} triaged</span>
                        <span style={styles.chip}>{stats.assigned} assigned</span>
                        <span style={styles.chip}>{stats.in_progress} in progress</span>
                        <span style={{ ...styles.chip, ...styles.chipGreen }}>{stats.resolved} resolved</span>
                        <span style={{ ...styles.chip, ...styles.chipSlate }}>{stats.closed} closed</span>
                    </div>


                    <div style={styles.searchRow}>
                        <div style={styles.searchWrap}>
                            <span style={styles.searchIcon}>
                                <Icon name="search" />
                            </span>
                            <input
                                style={styles.searchInput}
                                placeholder="Search by request id, category, zone, priority…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        <select
                            style={styles.selectSm}
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            {priorityOptions.map((p) => (
                                <option key={p} value={p}>
                                    {p === "all" ? "All priorities" : p}
                                </option>
                            ))}
                        </select>

                        <select
                            style={styles.selectSm}
                            value={zoneFilter}
                            onChange={(e) => setZoneFilter(e.target.value)}
                        >
                            {zoneOptions.map((z) => (
                                <option key={z} value={z}>
                                    {z === "all" ? "All zones" : z}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            style={styles.dateInputSm}
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />

                        <span style={styles.dateDashSm}>—</span>

                        <input
                            type="date"
                            style={styles.dateInputSm}
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />


                    </div>



                    <div style={styles.pillsRow}>
                        <Pill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All</Pill>
                        <Pill active={statusFilter === "new"} onClick={() => setStatusFilter("new")}>New</Pill>
                        <Pill active={statusFilter === "triaged"} onClick={() => setStatusFilter("triaged")}>Triaged</Pill>
                        <Pill active={statusFilter === "assigned"} onClick={() => setStatusFilter("assigned")}>Assigned</Pill>
                        <Pill active={statusFilter === "in_progress"} onClick={() => setStatusFilter("in_progress")}>In Progress</Pill>
                        <Pill active={statusFilter === "resolved"} onClick={() => setStatusFilter("resolved")}>Resolved</Pill>
                        <Pill active={statusFilter === "closed"} onClick={() => setStatusFilter("closed")}>Closed</Pill>
                    </div>

                </div>

                <div style={styles.toolbarRight}>
                    <Button variant="neutral" onClick={reload}>
                        <span style={styles.btnIcon}>
                            <Icon name="refresh" />
                        </span>
                        Refresh
                    </Button>

                    <Button variant="primary" onClick={() => setShowSlaRules(true)}>
                        <span style={styles.btnIcon}>
                            <Icon name="gear" />
                        </span>
                        Manage SLA Rules
                    </Button>
                </div>
            </div>

            {/* list */}
            <div style={styles.list}>
                {filtered.map((r) => {
                    const meta = statusMeta(r.status);
                    const created = r.timestamps?.created_at || r.created_at;

                    return (
                        <button
                            key={r.request_id}
                            type="button"
                            onClick={() => openDetails(r)}
                            style={{ ...styles.card, borderLeft: `5px solid ${meta.rail}` }}
                        >
                            <div style={styles.cardTop}>
                                <div style={styles.idCol}>
                                    <div style={styles.requestId}>{r.request_id}</div>
                                    <div style={styles.timeText}>{fmtDate(created)}</div>
                                </div>

                                <div style={{ ...styles.badge, background: meta.bg, borderColor: meta.border, color: meta.text }}>
                                    {meta.label}
                                </div>
                            </div>

                            <div style={styles.cardBody}>
                                <div style={styles.kv}>
                                    <span style={styles.k}>Category</span>
                                    <span style={styles.v}>{r.category || "—"}</span>
                                </div>

                                <div style={styles.kv}>
                                    <span style={styles.k}>Priority</span>
                                    <span style={styles.v}>{r.priority || "—"}</span>
                                </div>

                                <div style={styles.kv}>
                                    <span style={styles.k}>Zone</span>
                                    <span style={styles.v}>{r.zone_name || r.location?.zone_name || "—"}</span>
                                </div>
                            </div>

                            {r.address_hint && <div style={styles.addressLine}>{r.address_hint}</div>}
                        </button>
                    );
                })}

                {filtered.length === 0 && (
                    <div style={styles.emptyBox}>
                        <div style={styles.emptyTitle}>No requests found</div>
                        <div style={styles.emptyText}>Try changing the search or filters.</div>
                    </div>
                )}
            </div>

            {/* modals */}
            {openRequest && (
                <RequestDetailsModal
                    request={openRequest}
                    onClose={() => setOpenRequest(null)}
                    onAddSla={async () => {
                        const req = openRequest;      // ✅ keep current request
                        setOpenRequest(null);         // close details modal

                        const st = String(req.status || "").toLowerCase();

                        // 🚫 CLOSED: block SLA update/create
                        if (st === "closed" || st === "resolved") {
                            // optional: show toast here if you have it
                            // setToast("Closed requests cannot update SLA");
                            return;
                        }

                        // ✅ CREATE only if NEW
                        if (st === "new") {
                            setSlaModal({ open: true, mode: "create", request: req });
                            return;
                        }

                        // ✅ otherwise UPDATE (triaged/assigned/in_progress/resolved...)
                        const sla = await getSlaByRequest(req.request_id).catch(() => null);

                        if (sla) {
                            setSlaModal({
                                open: true,
                                mode: "edit",
                                request: { ...req, sla_policy: sla },
                            });
                        } else {
                            // fallback if backend says no SLA exists yet
                            setSlaModal({ open: true, mode: "create", request: req });
                        }
                    }}
                />
            )}

            {showSlaRules && <SlaRulesModal onClose={() => setShowSlaRules(false)} />}

            {slaModal.open && (
                <SlaModal
                    title={slaModal.mode === "edit" ? "View / Edit SLA" : "Add SLA Policy"}
                    submitLabel={slaModal.mode === "edit" ? "Save Changes" : "Create SLA"}
                    initial={
                        slaModal.mode === "edit"
                            ? slaModal.request.sla_policy
                            : {
                                name: `SLA for ${slaModal.request.request_id}`,
                                zone: slaModal.request.zone_name || "ZONE-EAST",
                                category_code: slaModal.request.category,
                                subcategory_code: slaModal.request.sub_category,
                                priority: slaModal.request.priority,
                                team_id: "",
                                target_hours: 48,
                                breach_threshold_hours: 60,
                                escalation_steps: [
                                    { after_hours: 48, action: "notify_dispatcher" },
                                    { after_hours: 60, action: "notify_manager" },
                                ],
                            }
                    }
                    onClose={() => setSlaModal({ open: false, mode: "create", request: null })}
                    onSubmit={async (payload) => {
                        try {
                            if (slaModal.mode === "create") {
                                await createSlaForRequest(slaModal.request.request_id, payload);
                            } else {
                                await updateSlaForRequest(slaModal.request.request_id, payload);
                            }

                            const fresh = await listRequests();
                            setRows(
                                (Array.isArray(fresh) ? fresh : []).map((r) => ({
                                    ...r,
                                    id: r.id || r._id || r.request_id,
                                }))
                            );

                            setSlaModal({ open: false, mode: "create", request: null });
                        } catch (e) {
                            console.error(e);
                            alert(e?.message || "Failed to save SLA");
                        }
                    }}
                />
            )}
        </div>
    );
}

/* ================================ STYLES ================================ */

const styles = {
    page: { display: "grid", gap: 12 },

    loadingCard: {
        background: "rgba(255,255,255,0.92)",
        borderRadius: 16,
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 12px 26px rgba(2,6,23,0.06)",
        padding: 14,
        fontWeight: 900,
        color: "#0f172a",
    },

    toolbar: {
        background: "rgba(255,255,255,0.92)",
        borderRadius: 16,
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 12px 26px rgba(2,6,23,0.06)",
        backdropFilter: "blur(10px)",
        padding: 12,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
        flexWrap: "wrap",
    },

    toolbarLeft: { display: "grid", gap: 10, flex: "1 1 520px", minWidth: 320 },
    toolbarRight: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

    chipsRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    chip: {
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: "1px solid rgba(15,23,42,0.10)",
        background: "#f8fafc",
        color: "#0f172a",
        whiteSpace: "nowrap",
    },
    chipRed: { background: "rgba(220,38,38,0.10)", color: "#991b1b", borderColor: "rgba(220,38,38,0.20)" },
    chipGreen: { background: "rgba(22,163,74,0.10)", color: "#166534", borderColor: "rgba(22,163,74,0.20)" },
    chipSlate: { background: "rgba(100,116,139,0.10)", color: "#334155", borderColor: "rgba(100,116,139,0.20)" },

    searchWrap: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: "#ffffff",
        border: "1px solid rgba(15,23,42,0.10)",
        borderRadius: 14,
        height: 44,
        boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
        flex: "1 1 420px",
    },
    searchIcon: { position: "absolute", left: 12, color: "#64748b", display: "grid", placeItems: "center" },
    searchInput: {
        width: "100%",
        height: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        padding: "0 12px 0 38px",
        fontSize: 14,
        color: "#0f172a",
        fontWeight: 850,
    },

    pillsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
    pillBtn: {
        border: "1px solid rgba(15,23,42,0.10)",
        background: "#ffffff",
        borderRadius: 999,
        padding: "6px 12px",
        fontWeight: 900,
        fontSize: 12,
        color: "#0f172a",
        cursor: "pointer",
        boxShadow: "0 10px 18px rgba(2,6,23,0.03)",
    },
    pillBtnOn: { background: "#0f172a", color: "#ffffff", borderColor: "#0f172a" },

    btn: {
        height: 40,
        padding: "0 12px",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.10)",
        cursor: "pointer",
        fontWeight: 900,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        whiteSpace: "nowrap",
    },
    btnIcon: { width: 28, height: 28, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(15,23,42,0.06)" },
    btnPrimary: { background: "#0f172a", color: "#fff", boxShadow: "0 12px 26px rgba(2,6,23,0.16)" },
    btnNeutral: { background: "#ffffff", color: "#0f172a" },
    btnSoft: { background: "#f8fafc", color: "#0f172a" },

    list: { display: "grid", gap: 12 },

    card: {
        textAlign: "left",
        width: "100%",
        background: "rgba(255,255,255,0.92)",
        borderRadius: 16,
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 16px 34px rgba(2,6,23,0.08)",
        padding: 14,
        cursor: "pointer",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
    },

    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    idCol: { display: "grid", gap: 4, minWidth: 0 },
    requestId: { fontSize: 16, fontWeight: 950, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    timeText: { fontSize: 12, fontWeight: 850, color: "#64748b" },

    badge: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        border: "1px solid rgba(15,23,42,0.12)",
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 950,
        whiteSpace: "nowrap",
    },

    cardBody: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
    kv: { display: "grid", gap: 4, minWidth: 0 },
    k: { fontSize: 11, fontWeight: 950, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" },
    v: { fontSize: 13, fontWeight: 900, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

    addressLine: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: 850,
        color: "#334155",
        background: "rgba(15,23,42,0.04)",
        border: "1px solid rgba(15,23,42,0.06)",
        borderRadius: 12,
        padding: "8px 10px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },

    emptyBox: {
        background: "rgba(255,255,255,0.92)",
        borderRadius: 16,
        border: "1px dashed rgba(15,23,42,0.18)",
        boxShadow: "0 12px 26px rgba(2,6,23,0.06)",
        padding: 18,
    },
    emptyTitle: { fontWeight: 950, color: "#0f172a" },
    emptyText: { marginTop: 4, fontSize: 13, color: "#64748b", fontWeight: 850 },
    filtersRow: {
        display: "grid",
        gridTemplateColumns: "220px 260px 1fr auto",
        gap: 10,
        alignItems: "center",
    },

    select: {
        width: "100%",
        height: 44,
        padding: "0 12px",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.10)",
        outline: "none",
        background: "#ffffff",
        boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
        fontWeight: 850,
        color: "#0f172a",
        cursor: "pointer",
    },

    dateRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        background: "#ffffff",
        border: "1px solid rgba(15,23,42,0.10)",
        borderRadius: 14,
        padding: "0 10px",
        height: 44,
        boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
    },

    dateInput: {
        height: 36,
        border: "none",
        outline: "none",
        fontWeight: 850,
        color: "#0f172a",
        background: "transparent",
        width: 150,
    },

    dateDash: { color: "#94a3b8", fontWeight: 900 },

    clearBtn: {
        height: 44,
        padding: "0 12px",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.10)",
        background: "#ffffff",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
        color: "#0f172a",
        whiteSpace: "nowrap",
    },
    searchRow: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
    },

    selectSm: {
        height: 44,
        padding: "0 12px",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.10)",
        outline: "none",
        background: "#ffffff",
        boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
        fontWeight: 850,
        color: "#0f172a",
        cursor: "pointer",
        minWidth: 170,
    },

    dateInputSm: {
        height: 44,
        padding: "0 12px",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.10)",
        outline: "none",
        background: "#ffffff",
        boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
        fontWeight: 850,
        color: "#0f172a",
        width: 160,
    },

    dateDashSm: { color: "#94a3b8", fontWeight: 900 },

    clearBtnSm: {
        height: 44,
        padding: "0 12px",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.10)",
        background: "#ffffff",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
        color: "#0f172a",
        whiteSpace: "nowrap",
    },


};
