// import React, { useEffect, useMemo, useState } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
// } from "recharts";

// import { listRequests } from "../../services/requestsApi";
// import { listSlaPolicies } from "../../services/slaApi";
// import { listAgents } from "../../services/agentsApi";
// import { listCategories } from "../../services/categoriesApi";

// const ZONES = ["All", "ZONE-DT-01", "ZONE-W-02", "ZONE-N-03", "ZONE-S-04"];

// export default function Analytics() {
//   const [loading, setLoading] = useState(true);
//   const [requests, setRequests] = useState([]);
//   const [slaPolicies, setSlaPolicies] = useState([]);
//   const [agents, setAgents] = useState([]);
//   const [categories, setCategories] = useState([]);

//   // Filters
//   const [zone, setZone] = useState("All");
//   const [category, setCategory] = useState("All");
//   const [from, setFrom] = useState("");
//   const [to, setTo] = useState("");

//   async function load() {
//     setLoading(true);
//     try {
//       const [rq, sla, ag, cat] = await Promise.all([
//         listRequests(),
//         listSlaPolicies(),
//         listAgents(),
//         listCategories(),
//       ]);
//       setRequests(rq || []);
//       setSlaPolicies(sla || []);
//       setAgents(ag || []);
//       setCategories(cat || []);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     load();
//   }, []);

//   const categoryOptions = useMemo(() => {
//     // support 2 shapes: list of categories OR {categories:[...]}
//     const list = Array.isArray(categories) ? categories : categories?.categories || [];
//     return list.map((c) => c.code || c.category_code || c.name).filter(Boolean);
//   }, [categories]);

//   const filteredRequests = useMemo(() => {
//     const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
//     const toTs = to ? new Date(to + "T23:59:59").getTime() : null;

//     return (requests || []).filter((r) => {
//       if (zone !== "All" && (r.zone || r.location_zone || r.coverage_zone) !== zone) return false;
//       if (category !== "All" && (r.category || r.category_code) !== category) return false;

//       const created = r.created_at || r.timestamps?.created_at || r.createdAt;
//       const t = created ? new Date(created).getTime() : null;

//       if (fromTs != null && t != null && t < fromTs) return false;
//       if (toTs != null && t != null && t > toTs) return false;

//       return true;
//     });
//   }, [requests, zone, category, from, to]);

//   // --------- KPIs ----------
//   const kpis = useMemo(() => {
//     const total = filteredRequests.length;

//     const byStatus = countBy(filteredRequests, (r) => (r.status || r.current_state || "unknown").toLowerCase());
//     const open = (byStatus["open"] || 0) + (byStatus["new"] || 0) + (byStatus["triaged"] || 0) + (byStatus["assigned"] || 0);
//     const closed = byStatus["closed"] || 0;

//     const breached = filteredRequests.filter((r) => Boolean(r.sla_breached || r.sla?.breached)).length;

//     // productivity: closed per agent (very simple)
//     const closedByAgent = countBy(
//       filteredRequests.filter((r) => (r.status || "").toLowerCase() === "closed"),
//       (r) => r.assigned_to?.agent_id || r.assigned_agent_id || r.assignee_id || "unassigned"
//     );

//     const topAgent = Object.entries(closedByAgent).sort((a, b) => b[1] - a[1])[0];

//     return {
//       total,
//       open,
//       closed,
//       breached,
//       breachRate: total ? Math.round((breached / total) * 100) : 0,
//       topAgent: topAgent ? `${topAgent[0]} (${topAgent[1]})` : "—",
//     };
//   }, [filteredRequests]);

//   // --------- CHARTS ----------
//   const statusData = useMemo(() => {
//     const by = countBy(filteredRequests, (r) => (r.status || "unknown").toLowerCase());
//     return Object.entries(by)
//       .map(([name, value]) => ({ name, value }))
//       .sort((a, b) => b.value - a.value);
//   }, [filteredRequests]);

//   const zoneData = useMemo(() => {
//     const by = countBy(filteredRequests, (r) => r.zone || r.location_zone || r.coverage_zone || "unknown");
//     return Object.entries(by)
//       .map(([name, value]) => ({ name, value }))
//       .sort((a, b) => b.value - a.value);
//   }, [filteredRequests]);

//   const categoryData = useMemo(() => {
//     const by = countBy(filteredRequests, (r) => r.category || r.category_code || "unknown");
//     return Object.entries(by)
//       .map(([name, value]) => ({ name, value }))
//       .sort((a, b) => b.value - a.value);
//   }, [filteredRequests]);

//   const trendData = useMemo(() => {
//     // group by date YYYY-MM-DD
//     const map = new Map();
//     for (const r of filteredRequests) {
//       const created = r.created_at || r.timestamps?.created_at || r.createdAt;
//       const key = created ? new Date(created).toISOString().slice(0, 10) : "unknown";
//       map.set(key, (map.get(key) || 0) + 1);
//     }
//     return Array.from(map.entries())
//       .filter(([k]) => k !== "unknown")
//       .sort((a, b) => a[0].localeCompare(b[0]))
//       .map(([date, count]) => ({ date, count }));
//   }, [filteredRequests]);

//   const slaData = useMemo(() => {
//     // Policy coverage: number of requests per priority matched
//     const byPriority = countBy(filteredRequests, (r) => r.priority || r.sla?.priority || "P3");
//     return ["P1", "P2", "P3"].map((p) => ({ name: p, value: byPriority[p] || 0 }));
//   }, [filteredRequests]);

//   const health = useMemo(() => {
//     // quick “data readiness”
//     return {
//       requests: requests.length,
//       sla: slaPolicies.length,
//       agents: agents.length,
//       categories: Array.isArray(categories) ? categories.length : (categories?.categories || []).length,
//     };
//   }, [requests, slaPolicies, agents, categories]);

//   return (
//     <div style={{ display: "grid", gap: 12 }}>
//       <div style={styles.headerRow}>
//         <div>
//           <h1 style={{ margin: 0 }}>Analytics</h1>
//           <div style={{ color: "#6b7280", marginTop: 6 }}>
//             Backlog by status/zone/category, SLA breach rates, productivity, distributions.
//           </div>
//         </div>

//         <div style={{ display: "flex", gap: 10 }}>
//           <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={load}>
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div style={styles.card}>
//         <div style={styles.toolbar}>
//           <select style={styles.input} value={zone} onChange={(e) => setZone(e.target.value)}>
//             {ZONES.map((z) => (
//               <option key={z} value={z}>
//                 {z}
//               </option>
//             ))}
//           </select>

//           <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
//             <option value="All">All categories</option>
//             {categoryOptions.map((c) => (
//               <option key={c} value={c}>
//                 {c}
//               </option>
//             ))}
//           </select>

//           <input style={styles.input} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
//           <input style={styles.input} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
//         </div>

//         <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
//           Data loaded: Requests <b>{health.requests}</b> • SLA <b>{health.sla}</b> • Agents <b>{health.agents}</b> • Categories <b>{health.categories}</b>
//         </div>
//       </div>

//       {/* KPIs */}
//       <div style={styles.kpiGrid}>
//         <Kpi title="Total Requests" value={loading ? "…" : kpis.total} />
//         <Kpi title="Open / In-progress" value={loading ? "…" : kpis.open} />
//         <Kpi title="Closed" value={loading ? "…" : kpis.closed} />
//         <Kpi title="SLA Breached" value={loading ? "…" : `${kpis.breached} (${kpis.breachRate}%)`} />
//       </div>

//       {/* Charts */}
//       <div style={styles.chartsGrid}>
//         <ChartCard title="Requests by Status">
//           <ResponsiveContainer width="100%" height={260}>
//             <BarChart data={statusData}>
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="value" />
//             </BarChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         <ChartCard title="Requests by Zone">
//           <ResponsiveContainer width="100%" height={260}>
//             <BarChart data={zoneData}>
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="value" />
//             </BarChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         <ChartCard title="Requests Trend (by day)">
//           <ResponsiveContainer width="100%" height={260}>
//             <LineChart data={trendData}>
//               <XAxis dataKey="date" />
//               <YAxis />
//               <Tooltip />
//               <Line dataKey="count" />
//             </LineChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         <ChartCard title="Priority Distribution (Proxy SLA load)">
//           <ResponsiveContainer width="100%" height={260}>
//             <PieChart>
//               <Pie data={slaData} dataKey="value" nameKey="name" outerRadius={90} label>
//                 {slaData.map((_, i) => (
//                   <Cell key={i} />
//                 ))}
//               </Pie>
//               <Tooltip />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         </ChartCard>
//       </div>

//       {/* Notes */}
//       <div style={styles.card}>
//         <div style={{ fontWeight: 900, marginBottom: 6 }}>Next improvements</div>
//         <ul style={{ margin: 0, color: "#6b7280" }}>
//           <li>Compute SLA breach by policy (zone+category+priority) instead of request flag.</li>
//           <li>Add agent productivity chart: closed per agent + avg resolution time.</li>
//           <li>Add map heat layer (Leaflet) for request locations.</li>
//         </ul>
//       </div>
//     </div>
//   );
// }

// function Kpi({ title, value }) {
//   return (
//     <div style={styles.kpiCard}>
//       <div style={{ color: "#6b7280", fontWeight: 800, fontSize: 13 }}>{title}</div>
//       <div style={{ fontSize: 26, fontWeight: 950, marginTop: 6 }}>{value}</div>
//     </div>
//   );
// }

// function ChartCard({ title, children }) {
//   return (
//     <div style={styles.card}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
//         <div style={{ fontWeight: 950 }}>{title}</div>
//       </div>
//       <div style={{ marginTop: 10 }}>{children}</div>
//     </div>
//   );
// }

// function countBy(list, keyFn) {
//   const m = {};
//   for (const item of list) {
//     const k = String(keyFn(item) ?? "unknown");
//     m[k] = (m[k] || 0) + 1;
//   }
//   return m;
// }

// const styles = {
//   headerRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "start",
//     gap: 12,
//     flexWrap: "wrap",
//   },
//   card: {
//     background: "white",
//     borderRadius: 14,
//     padding: 14,
//     boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
//     border: "1px solid rgba(17,24,39,0.06)",
//   },
//   toolbar: { display: "grid", gridTemplateColumns: "220px 1fr 180px 180px", gap: 10 },
//   input: {
//     width: "100%",
//     padding: "10px 12px",
//     borderRadius: 10,
//     border: "1px solid #e5e7eb",
//     outline: "none",
//   },
//   btn: {
//     border: "none",
//     padding: "10px 14px",
//     borderRadius: 10,
//     cursor: "pointer",
//     fontWeight: 900,
//   },
//   kpiGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
//     gap: 12,
//   },
//   kpiCard: {
//     background: "white",
//     borderRadius: 14,
//     padding: 14,
//     boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
//     border: "1px solid rgba(17,24,39,0.06)",
//   },
//   chartsGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
//     gap: 12,
//   },
// };
