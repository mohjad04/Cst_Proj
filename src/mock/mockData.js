// MOCK REQUESTS
export const mockRequests = [
    {
        request_id: "CST-2026-0001",
        description: "Large pothole near the school entrance.",
        category: "pothole",
        sub_category: "asphalt_damage",
        priority: "P1",
        status: "triaged",
        timestamps: {
            created_at: "2026-02-01T10:00:00Z",
        },
    },
    {
        request_id: "CST-2026-0002",
        description: "Street light not working",
        category: "roads",
        sub_category: "street_light",
        priority: "P2",
        status: "new",
        timestamps: {
            created_at: "2026-02-02T09:30:00Z",
        },
    },
];

// MOCK SLA POLICIES (by request_id)
export const mockSlas = {};
