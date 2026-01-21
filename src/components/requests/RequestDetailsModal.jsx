import Modal, { btnPrimary, btnSecondary } from "../ui/Modal";

export default function RequestDetailsModal({ request, onClose, onAddSla }) {
    const t = request.timestamps || {};
    const loc = request.location || {};
    const citizenRef = request.citizen_ref || {};
    const citizen = request.citizen || {};
    const zoneName = request.zone_name;
    const addressHint = request.address_hint;




    return (
        <Modal onClose={onClose}>
            <h2 style={{ marginTop: 0 }}>{request.request_id}</h2>

            {/* Description */}
            <Section title="Description">
                <p>{request.description || "—"}</p>
            </Section>

            {/* Classification */}
            <Section title="Classification">
                <Row label="Category" value={request.category} />
                <Row label="Subcategory" value={request.sub_category} />
                <Row label="Priority" value={request.priority} />
                <Row label="Status" value={request.status} />
            </Section>

            <Section title="Citizen">
                <Row label="Anonymous" value={citizenRef.anonymous ? "Yes" : "No"} />
                <Row label="Contact Channel" value={citizenRef.contact_channel} />

                {!citizenRef.anonymous && (
                    <>
                        <Row label="Name" value={citizen.full_name} />
                        <Row label="Phone" value={citizen.phone} />
                        <Row label="Email" value={citizen.email} />
                    </>
                )}
            </Section>


            <Section title="Location">
                <Row label="Zone" value={zoneName} />
                <Row label="Address" value={addressHint} />

                {Array.isArray(loc.coordinates) && (
                    <Row
                        label="Coordinates"
                        value={`${loc.coordinates[0]}, ${loc.coordinates[1]}`}
                    />
                )}
            </Section>


            {/* Tags */}
            <Section title="Tags">
                {Array.isArray(request.tags) && request.tags.length > 0 ? (
                    <div style={tagWrap}>
                        {request.tags.map((t, i) => (
                            <span key={i} style={tag}>{t}</span>
                        ))}
                    </div>
                ) : (
                    <p>—</p>
                )}
            </Section>

            {/* Evidence */}
            <Section title="Evidence">
                {Array.isArray(request.evidence) && request.evidence.length > 0 ? (
                    request.evidence.map((e, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                            <Row label="Type" value={e.type} />
                            <Row label="Uploaded By" value={e.uploaded_by} />
                            <Row
                                label="Uploaded At"
                                value={new Date(e.uploaded_at).toLocaleString()}
                            />
                            {e.type === "photo" && e.url && (
                                <img
                                    src={e.url}
                                    alt="Evidence"
                                    style={{
                                        marginTop: 8,
                                        maxWidth: "100%",
                                        borderRadius: 8,
                                        border: "1px solid #e5e7eb",
                                    }}
                                />
                            )}
                        </div>
                    ))
                ) : (
                    <p>—</p>
                )}
            </Section>

            {/* Timestamps */}
            <Section title="Timeline">
                <Row label="Created" value={formatTime(t.created_at)} />
                <Row label="Triaged" value={formatTime(t.triaged_at)} />
                <Row label="Assigned" value={formatTime(t.assigned_at)} />
                <Row label="Resolved" value={formatTime(t.resolved_at)} />
                <Row label="Closed" value={formatTime(t.closed_at)} />
                <Row label="Updated" value={formatTime(t.updated_at)} />
            </Section>

            {/* Actions */}
            <div style={actions}>
                <button onClick={onClose} style={btnSecondary}>Close</button>
                <button onClick={onAddSla} style={btnPrimary}>
                    {request.status === "triaged" ? "View SLA" : "Add SLA"}
                </button>
            </div>
        </Modal>
    );
}

/* ---------- helpers ---------- */

function formatTime(v) {
    if (!v) return "—";
    return new Date(v).toLocaleString();
}

function Section({ title, children }) {
    return (
        <div style={{ marginTop: 18 }}>
            <h4 style={{ margin: "0 0 6px 0" }}>{title}</h4>
            <div style={{ fontSize: 14 }}>{children}</div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div style={row}>
            <span style={rowLabel}>{label}</span>
            <span>{value || "—"}</span>
        </div>
    );
}

/* ---------- styles ---------- */

const row = {
    display: "flex",
    gap: 10,
    marginBottom: 4,
};

const rowLabel = {
    width: 120,
    color: "#6b7280",
};

const tagWrap = {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
};

const tag = {
    background: "#f3f4f6",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
};

const actions = {
    marginTop: 24,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
};
