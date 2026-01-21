import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RequestDetailsModal from "../../components/requests/RequestDetailsModal";
import SlaRulesModal from "../../components/sla/SlaRulesModal";
import { SlaModal } from "./SlaPolicies";
import {
    createSlaForRequest,
    updateSlaForRequest,
    getSlaByRequest,
} from "../../services/slaApi";
import { listRequests, getRequestById } from "../../services/requestsApi";



export default function Requests() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState("all");
    // "all" | "new" | "triaged"
    const [openRequest, setOpenRequest] = useState(null);
    const [slaModal, setSlaModal] = useState({
        open: false,
        mode: "create", // "create" | "edit"
        request: null,
    });
    const [showSlaRules, setShowSlaRules] = useState(false);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            try {
                const data = await listRequests(); // gets all
                if (!alive) return;

                // Normalize for UI (if backend returns _id)
                const normalized = (Array.isArray(data) ? data : []).map((r) => ({
                    ...r,
                    id: r.id || r._id,
                }));

                setRows(normalized);
            } catch (e) {
                console.error(e);
                if (alive) setRows([]);
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, []);


    const filtered = useMemo(() => {
        return rows.filter((r) => {
            // status filter
            if (statusFilter !== "all" && r.status !== statusFilter) {
                return false;
            }

            // text search
            const query = q.trim().toLowerCase();
            if (!query) return true;

            return [r.request_id, r.category]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query);
        });
    }, [rows, q, statusFilter]);

    function statusAccent(status) {
        if (status === "new") return "#dc2626";      // red
        if (status === "triaged") return "#16a34a";  // green
        return "#9ca3af";
    }

    if (loading) return <div style={{ padding: 12 }}>Loading requests…</div>;

    return (
        <div style={styles.page}>

            <button
                style={styles.manageSlaFixed}
                onClick={() => setShowSlaRules(true)}
            >
                Manage SLA Rules
            </button>
            {/* Header */}
            <div>
                <h1 style={styles.title}>Requests</h1>

                <div style={styles.searchRow}>
                    <input
                        style={styles.search}
                        placeholder="Search requests…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    <div style={styles.filters}>
                        {["all", "new", "triaged"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                style={{
                                    ...styles.filterBtn,
                                    ...(statusFilter === s ? styles.filterBtnActive : {}),
                                }}
                            >
                                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>


                </div>


            </div>



            {/* List */}
            <div style={styles.list}>
                {filtered.map((r) => (
                    <div
                        key={r.request_id}
                        style={{
                            ...styles.card,
                            borderLeft: `5px solid ${statusAccent(r.status)}`,
                        }}
                        onClick={async () => {
                            const full = await getRequestById(r.request_id);
                            setOpenRequest(full);
                        }}
                    >
                        <div style={styles.topRow}>
                            <div style={styles.requestId}>{r.request_id}</div>
                            <div style={styles.statusText}>{r.status}</div>
                        </div>

                        <div style={styles.meta}>
                            {new Date(r.timestamps?.created_at).toLocaleString()}
                        </div>

                        <div style={styles.category}>
                            Category: <span>{r.category}</span>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div style={styles.empty}>No requests found.</div>
                )}
            </div>

            {/* ✅ MODALS MUST BE HERE */}
            {openRequest && (
                <RequestDetailsModal
                    request={openRequest}
                    onClose={() => setOpenRequest(null)}
                    onAddSla={async () => {
                        setOpenRequest(null);

                        if (openRequest.status === "triaged") {
                            const sla = await getSlaByRequest(openRequest.request_id);

                            setSlaModal({
                                open: true,
                                mode: "edit",
                                request: {
                                    ...openRequest,
                                    sla_policy: sla,
                                },
                            });
                        } else {
                            setSlaModal({
                                open: true,
                                mode: "create",
                                request: openRequest,
                            });
                        }
                    }}


                />
            )}

            {showSlaRules && (
                <SlaRulesModal onClose={() => setShowSlaRules(false)} />
            )}

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
                    onClose={() =>
                        setSlaModal({ open: false, mode: "create", request: null })
                    }
                    onSubmit={async (payload) => {
                        try {
                            if (slaModal.mode === "create") {
                                await createSlaForRequest(slaModal.request.request_id, payload);
                            } else {
                                await updateSlaForRequest(slaModal.request.request_id, payload);
                            }

                            // 🔄 reload requests from backend (single source of truth)
                            const fresh = await listRequests();
                            setRows(
                                (Array.isArray(fresh) ? fresh : []).map((r) => ({
                                    ...r,
                                    id: r.id || r._id,
                                }))
                            );

                            setSlaModal({ open: false, mode: "create", request: null });
                        } catch (e) {
                            console.error(e);
                            alert(e.message || "Failed to save SLA");
                        }
                    }}

                />
            )}



        </div>


    );

}

/* ---------- styles ---------- */

const styles = {
    page: {
        display: "grid",
        gap: 20,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        flexWrap: "wrap",
    },
    title: {
        margin: 0,
        fontSize: 24,
        fontWeight: 800,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 13,
        color: "#6b7280",
    },

    list: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 12,
    },
    card: {
        background: "white",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        border: "1px solid #e5e7eb",
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    },
    topRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    requestId: {
        fontSize: 16,
        fontWeight: 800,
        color: "#111827",
    },
    statusText: {
        fontSize: 12,
        fontWeight: 700,
        textTransform: "capitalize",
        color: "#6b7280",
        background: "#f3f4f6",
        padding: "4px 8px",
        borderRadius: 6,
    },
    meta: {
        marginTop: 4,
        fontSize: 12,
        color: "#6b7280",
    },
    category: {
        marginTop: 8,
        fontSize: 14,
        color: "#374151",
    },
    empty: {
        color: "#6b7280",
        padding: 12,
    },

    searchRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginTop: 12,
        flexWrap: "wrap",
    },

    search: {
        flex: 1,
        maxWidth: 520,
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        outline: "none",
        fontSize: 14,
    },

    filters: {
        display: "flex",
        gap: 8,
    },

    filterBtn: {
        padding: "6px 14px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
        fontSize: 13,
        cursor: "pointer",
        color: "#374151",
        fontWeight: 600,
    },

    filterBtnActive: {
        background: "#111827",
        color: "white",
        borderColor: "#111827",
    },

    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    manageBtn: {
        background: "#111827",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 700,
    },

    manageSlaFixed: {
        position: "fixed",
        top: 16,
        right: 24,
        zIndex: 1000,

        background: "#111827",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: 10,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    },


};
