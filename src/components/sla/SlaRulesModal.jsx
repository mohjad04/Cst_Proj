// import Modal, { btnPrimary, btnSecondary } from "../ui/Modal";
// import { useEffect, useState } from "react";
// import { getSlaRules, saveSlaRules } from "../../services/slaApi";

// export default function SlaRulesModal({ onClose }) {
//     const [rules, setRules] = useState({
//         zones: {},
//         priorities: {},
//     });
//     const [loading, setLoading] = useState(true);

//     /* ✅ LOAD RULES FROM BACKEND */
//     useEffect(() => {
//         let alive = true;

//         async function load() {
//             try {
//                 const data = await getSlaRules();
//                 if (!alive) return;
//                 setRules(data);
//             } catch (e) {
//                 console.error(e);
//                 alert("Failed to load SLA rules");
//             } finally {
//                 if (alive) setLoading(false);
//             }
//         }

//         load();
//         return () => {
//             alive = false;
//         };
//     }, []);

//     function updateZone(zone, value) {
//         setRules((prev) => ({
//             ...prev,
//             zones: {
//                 ...prev.zones,
//                 [zone]: Number(value),
//             },
//         }));
//     }

//     function updatePriority(p, value) {
//         setRules((prev) => ({
//             ...prev,
//             priorities: {
//                 ...prev.priorities,
//                 [p]: Number(value),
//             },
//         }));
//     }

//     /* ✅ SAVE TO BACKEND */
//     async function save() {
//         try {
//             await saveSlaRules(rules);
//             onClose();
//         } catch (e) {
//             console.error(e);
//             alert("Failed to save SLA rules");
//         }
//     }

//     if (loading) {
//         return (
//             <Modal onClose={onClose}>
//                 <div>Loading SLA rules…</div>
//             </Modal>
//         );
//     }

//     return (
//         <Modal onClose={onClose}>
//             <h2>Manage SLA Rules</h2>

//             {/* Zones */}
//             <Section title="By Zone (Target Hours)">
//                 {Object.entries(rules.zones).map(([zone, hours]) => (
//                     <Row key={zone}>
//                         <span>{zone}</span>
//                         <input
//                             type="number"
//                             value={hours}
//                             onChange={(e) => updateZone(zone, e.target.value)}
//                             style={input}
//                         />
//                     </Row>
//                 ))}
//             </Section>

//             {/* Priorities */}
//             <Section title="By Priority (Target Hours)">
//                 {Object.entries(rules.priorities).map(([p, hours]) => (
//                     <Row key={p}>
//                         <span>{p}</span>
//                         <input
//                             type="number"
//                             value={hours}
//                             onChange={(e) => updatePriority(p, e.target.value)}
//                             style={input}
//                         />
//                     </Row>
//                 ))}
//             </Section>

//             <div style={actions}>
//                 <button onClick={onClose} style={btnSecondary}>
//                     Cancel
//                 </button>
//                 <button onClick={save} style={btnPrimary}>
//                     Save Rules
//                 </button>
//             </div>
//         </Modal>
//     );
// }

// /* ---------- helpers ---------- */

// function Section({ title, children }) {
//     return (
//         <div style={{ marginTop: 18 }}>
//             <h4>{title}</h4>
//             {children}
//         </div>
//     );
// }

// function Row({ children }) {
//     return (
//         <div style={row}>
//             {children}
//         </div>
//     );
// }

// /* ---------- styles ---------- */

// const row = {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
// };

// const input = {
//     width: 100,
//     padding: "6px 8px",
//     borderRadius: 8,
//     border: "1px solid #e5e7eb",
// };

// const actions = {
//     marginTop: 24,
//     display: "flex",
//     justifyContent: "flex-end",
//     gap: 10,
// };

import Modal, { btnPrimary, btnSecondary } from "../ui/Modal";
import { useEffect, useMemo, useState } from "react";
import { getSlaRules, saveSlaRules } from "../../services/slaApi";

export default function SlaRulesModal({ onClose }) {
    const [rules, setRules] = useState({ zones: {}, priorities: {} });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            setErr("");
            try {
                const data = await getSlaRules();
                if (!alive) return;
                setRules({
                    zones: data?.zones || {},
                    priorities: data?.priorities || {},
                });
            } catch (e) {
                console.error(e);
                setErr(e?.message || "Failed to load SLA rules");
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, []);

    const zoneEntries = useMemo(() => {
        return Object.entries(rules.zones || {}).sort(([a], [b]) => a.localeCompare(b));
    }, [rules.zones]);

    const priorityEntries = useMemo(() => {
        return Object.entries(rules.priorities || {}).sort(([a], [b]) => a.localeCompare(b));
    }, [rules.priorities]);

    function updateZone(zone, value) {
        setRules((prev) => ({
            ...prev,
            zones: {
                ...(prev.zones || {}),
                [zone]: Number(value),
            },
        }));
    }

    function updatePriority(p, value) {
        setRules((prev) => ({
            ...prev,
            priorities: {
                ...(prev.priorities || {}),
                [p]: Number(value),
            },
        }));
    }

    async function save() {
        setSaving(true);
        setErr("");
        try {
            await saveSlaRules(rules);
            onClose();
        } catch (e) {
            console.error(e);
            setErr(e?.message || "Failed to save SLA rules");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal onClose={onClose}>
            {/* Header */}
            <div style={styles.modalHeader}>
                <div>
                    <div style={styles.title}>Manage SLA Rules</div>
                    <div style={styles.subTitle}>Configure target hours by zone and by priority.</div>
                </div>

                <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close" title="Close">
                    ✕
                </button>
            </div>

            {loading ? (
                <div style={styles.loadingBox}>Loading SLA rules…</div>
            ) : (
                <>
                    {err && <div style={styles.errorBox}>{err}</div>}

                    {/* ✅ Scrollable content area */}
                    <div style={styles.bodyScroll}>
                        {/* Zones */}
                        <div>
                            <div style={styles.sectionTitle}>By Zone (Target Hours)</div>
                            <div style={styles.sectionHint}>Base target hours per zone.</div>

                            <div style={{ ...styles.sectionCard, marginTop: 8 }}>
                                <div style={styles.zoneGrid}>
                                    {zoneEntries.map(([zone, hours]) => (
                                        <div key={zone} style={styles.rowCompact}>
                                            <div style={styles.keyText}>{zone}</div>

                                            <div style={styles.inputWrap}>
                                                <input
                                                    type="number"
                                                    value={hours}
                                                    onChange={(e) => updateZone(zone, e.target.value)}
                                                    style={styles.input}
                                                    min={0}
                                                />
                                                <span style={styles.suffix}>h</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Priorities */}
                        <div style={{ marginTop: 16 }}>
                            <div style={styles.sectionTitle}>By Priority (Target Hours)</div>
                            <div style={styles.sectionHint}>Added hours based on priority.</div>

                            <div style={{ ...styles.sectionCard, marginTop: 8 }}>
                                <div style={styles.priorityGrid}>
                                    {priorityEntries.map(([p, hours]) => (
                                        <div key={p} style={styles.rowCompact}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <span style={styles.priorityPill}>{p}</span>
                                                <span style={styles.keyText}>Priority</span>
                                            </div>

                                            <div style={styles.inputWrap}>
                                                <input
                                                    type="number"
                                                    value={hours}
                                                    onChange={(e) => updatePriority(p, e.target.value)}
                                                    style={styles.input}
                                                    min={0}
                                                />
                                                <span style={styles.suffix}>h</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <button onClick={onClose} style={{ ...btnSecondary, borderRadius: 12 }}>
                            Cancel
                        </button>

                        <button
                            onClick={save}
                            disabled={saving}
                            style={{
                                ...btnPrimary,
                                borderRadius: 12,
                                opacity: saving ? 0.85 : 1,
                            }}
                        >
                            {saving ? "Saving..." : "Save Rules"}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
}

const styles = {
    modalHeader: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 12,
        borderBottom: "1px solid #eef2f7",
        marginBottom: 10,
    },
    title: { fontSize: 26, fontWeight: 900, color: "#0f172a" },
    subTitle: { marginTop: 6, fontSize: 13, color: "#64748b" },

    closeBtn: {
        border: "1px solid #e5e7eb",
        background: "white",
        width: 38,
        height: 38,
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 900,
        color: "#111827",
    },

    loadingBox: {
        padding: 14,
        borderRadius: 14,
        border: "1px solid #eef2f7",
        background: "#f8fafc",
        color: "#475569",
        fontWeight: 700,
    },

    errorBox: {
        padding: 12,
        borderRadius: 14,
        background: "#fff1f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
        fontWeight: 800,
        marginTop: 10,
    },

    // ✅ This keeps the modal height nice and makes only the content scroll
    bodyScroll: {
        maxHeight: "62vh",
        overflow: "auto",
        paddingRight: 6,
    },

    sectionTitle: { fontSize: 14, fontWeight: 900, color: "#0f172a" },
    sectionHint: { marginTop: 4, fontSize: 12, color: "#64748b" },

    sectionCard: {
        border: "1px solid #eef2f7",
        borderRadius: 16,
        background: "#ffffff",
        padding: 10,
    },

    // ✅ 2-column zone grid
    zoneGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
    },

    priorityGrid: {
        display: "grid",
        gap: 10,
    },

    rowCompact: {
        display: "grid",
        gridTemplateColumns: "1fr 130px",
        alignItems: "center",
        gap: 12,
        padding: "10px 10px",
        borderRadius: 14,
        border: "1px solid #f1f5f9",
        background: "#f8fafc",
    },

    keyText: { fontSize: 13, fontWeight: 900, color: "#0f172a" },

    inputWrap: { position: "relative", display: "grid", alignItems: "center" },
    input: {
        width: "100%",
        padding: "10px 34px 10px 12px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        outline: "none",
        fontSize: 13,
        fontWeight: 900,
        color: "#111827",
        background: "#ffffff",
    },
    suffix: {
        position: "absolute",
        right: 10,
        fontSize: 12,
        fontWeight: 900,
        color: "#64748b",
    },

    priorityPill: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 999,
        background: "#eef2ff",
        border: "1px solid #e0e7ff",
        fontSize: 12,
        fontWeight: 900,
        color: "#3730a3",
    },

    footer: {
        marginTop: 18,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        paddingTop: 12,
        borderTop: "1px solid #eef2f7",
    },
};
