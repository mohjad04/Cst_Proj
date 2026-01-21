import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRequestById } from "../../services/requestsApi";
import { getSlaByRequest } from "../../services/slaApi";
import SLAForm from "../../components/sla/SLAForm";
import { mockRequests, mockSlas } from "../../mock/mockData";

export default function RequestDetails() {
    const { requestId } = useParams();
    const [request, setRequest] = useState(null);
    const [sla, setSla] = useState(null);

    useEffect(() => {
        const r = mockRequests.find(x => x.request_id === requestId);
        setRequest(r || null);
        setSla(mockSlas[requestId] || null);
    }, [requestId]);

    if (!request) return <div>Loading request…</div>;

    return (
        <div>
            <h2>Request {request.request_id}</h2>

            <p><b>Description:</b> {request.description}</p>
            <p><b>Category:</b> {request.category} / {request.sub_category}</p>
            <p><b>Priority:</b> {request.priority}</p>
            <p><b>Zone:</b> {request.location?.zone_name || "N/A"}</p>
            <p><b>Status:</b> {request.status}</p>

            <hr />

            <h3>SLA</h3>

            {sla ? (
                <div>
                    <p>Target: {sla.target_hours}h</p>
                    <p>Breach: {sla.breach_threshold_hours}h</p>

                    {Array.isArray(sla.escalation_steps) && (
                        <ul>
                            {sla.escalation_steps.map((s, i) => (
                                <li key={i}>
                                    after {s.after_hours}h → {s.action}
                                </li>
                            ))}
                        </ul>
                    )}
                    <p>Escalation (target): {sla.escalations?.target || "N/A"}</p>
                    <p>Escalation (breach): {sla.escalations?.breach || "N/A"}</p>
                </div>
            ) : (
                <SLAForm request={request} onCreated={setSla} />
            )}
        </div>
    );
}

