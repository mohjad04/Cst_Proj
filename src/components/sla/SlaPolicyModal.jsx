import React, { useState } from "react";
import Modal, { btnPrimary, btnSecondary } from "../ui/Modal";

export default function SlaPolicyModal({ request, onClose }) {
    const [target, setTarget] = useState(48);
    const [breach, setBreach] = useState(60);

    function submit() {
        console.log("Dummy SLA saved for", request.request_id, {
            target,
            breach,
        });
        onClose();
    }

    return (
        <Modal onClose={onClose}>
            <h2>Add SLA Policy</h2>

            <p style={{ color: "#6b7280" }}>
                Request: <b>{request.request_id}</b>
            </p>

            <label>Target hours</label>
            <input value={target} onChange={(e) => setTarget(e.target.value)} />

            <label>Breach hours</label>
            <input value={breach} onChange={(e) => setBreach(e.target.value)} />

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={onClose} style={btnSecondary}>Cancel</button>
                <button onClick={submit} style={btnPrimary}>Create SLA</button>
            </div>
        </Modal>
    );
}
