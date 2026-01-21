import Modal, { btnPrimary, btnSecondary } from "../ui/Modal";
import { useEffect, useState } from "react";
import { getSlaRules, saveSlaRules } from "../../services/slaApi";

export default function SlaRulesModal({ onClose }) {
    const [rules, setRules] = useState({
        zones: {},
        priorities: {},
    });
    const [loading, setLoading] = useState(true);

    /* ✅ LOAD RULES FROM BACKEND */
    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                const data = await getSlaRules();
                if (!alive) return;
                setRules(data);
            } catch (e) {
                console.error(e);
                alert("Failed to load SLA rules");
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, []);

    function updateZone(zone, value) {
        setRules((prev) => ({
            ...prev,
            zones: {
                ...prev.zones,
                [zone]: Number(value),
            },
        }));
    }

    function updatePriority(p, value) {
        setRules((prev) => ({
            ...prev,
            priorities: {
                ...prev.priorities,
                [p]: Number(value),
            },
        }));
    }

    /* ✅ SAVE TO BACKEND */
    async function save() {
        try {
            await saveSlaRules(rules);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to save SLA rules");
        }
    }

    if (loading) {
        return (
            <Modal onClose={onClose}>
                <div>Loading SLA rules…</div>
            </Modal>
        );
    }

    return (
        <Modal onClose={onClose}>
            <h2>Manage SLA Rules</h2>

            {/* Zones */}
            <Section title="By Zone (Target Hours)">
                {Object.entries(rules.zones).map(([zone, hours]) => (
                    <Row key={zone}>
                        <span>{zone}</span>
                        <input
                            type="number"
                            value={hours}
                            onChange={(e) => updateZone(zone, e.target.value)}
                            style={input}
                        />
                    </Row>
                ))}
            </Section>

            {/* Priorities */}
            <Section title="By Priority (Target Hours)">
                {Object.entries(rules.priorities).map(([p, hours]) => (
                    <Row key={p}>
                        <span>{p}</span>
                        <input
                            type="number"
                            value={hours}
                            onChange={(e) => updatePriority(p, e.target.value)}
                            style={input}
                        />
                    </Row>
                ))}
            </Section>

            <div style={actions}>
                <button onClick={onClose} style={btnSecondary}>
                    Cancel
                </button>
                <button onClick={save} style={btnPrimary}>
                    Save Rules
                </button>
            </div>
        </Modal>
    );
}

/* ---------- helpers ---------- */

function Section({ title, children }) {
    return (
        <div style={{ marginTop: 18 }}>
            <h4>{title}</h4>
            {children}
        </div>
    );
}

function Row({ children }) {
    return (
        <div style={row}>
            {children}
        </div>
    );
}

/* ---------- styles ---------- */

const row = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
};

const input = {
    width: 100,
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
};

const actions = {
    marginTop: 24,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
};
