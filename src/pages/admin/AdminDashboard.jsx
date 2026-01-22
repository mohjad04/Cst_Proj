
// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getAdminDashboard } from "../../services/dashboardApi";
import AdminGeoMap from "../../components/analytics/AdminGeoMap";
import { listRequests } from "../../services/requestsApi";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

/* ----------------------------- helpers ----------------------------- */
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const fmtInt = (v) => (isNum(v) ? v.toLocaleString() : "—");
const safeArr = (v) => (Array.isArray(v) ? v : []);

function fmtHoursToHuman(hours) {
  if (!isNum(hours) || hours < 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return h ? `${d}d ${h}h` : `${d}d`;
}

/* ------------------------------- UI pieces ------------------------------ */
function Card({ title, subtitle, right, children, style, bodyStyle }) {
  return (
    <div style={{ ...styles.card, ...style }}>
      {(title || subtitle || right) && (
        <div style={styles.cardHeader}>
          <div>
            {title && <div style={styles.cardTitle}>{title}</div>}
            {subtitle && <div style={styles.cardSubtitle}>{subtitle}</div>}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      )}
      <div style={{ ...styles.cardBody, ...bodyStyle }}>{children}</div>
    </div>
  );
}

function Section({ title, subtitle, right, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>{title}</div>
          {subtitle ? <div style={styles.sectionSubtitle}>{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

function StatCard({ label, value, hint, deltaLabel, progress }) {
  return (
    <Card
      title={label}
      subtitle={hint}
      right={deltaLabel ? <span style={styles.badge}>{deltaLabel}</span> : null}
      style={styles.statCard}
    >
      <div style={styles.statValue}>{value}</div>
      {progress !== undefined && (
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${clamp(progress)}%` }} />
        </div>
      )}
    </Card>
  );
}

function SlaMiniCard({ label, value, total, tone }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={styles.slaMiniCard}>
      <div style={{ ...styles.slaDot, background: tone }} />
      <div style={styles.slaMiniLabel}>{label}</div>
      <div style={styles.slaMiniValue}>{fmtInt(value)}</div>
      <div style={styles.slaMiniPct}>{pct}%</div>
    </div>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div style={styles.tabsWrap}>
      <div style={styles.tabs}>
        {tabs.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              style={{ ...styles.tabBtn, ...(active ? styles.tabBtnActive : null) }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniTabs({ tabs, value, onChange }) {
  return (
    <div style={styles.miniTabsWrap}>
      <div style={styles.miniTabs}>
        {tabs.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              style={{
                ...styles.miniTabBtn,
                ...(active ? styles.miniTabBtnActive : null),
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ZoneSummary({ requests }) {
  const OPEN = new Set(["new", "triaged", "assigned", "in_progress"]);

  const rows = useMemo(() => {
    const map = new Map();

    (requests || []).forEach((r) => {
      const st = String(r.status || "").toLowerCase();
      if (!OPEN.has(st)) return;

      const z = r.zone_name || r.zone;
      if (!z) return;

      map.set(z, (map.get(z) || 0) + 1);
    });

    return [...map.entries()]
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  if (rows.length === 0) return <div style={styles.emptyState}>No open requests with zones.</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((r) => (
        <div
          key={r.zone}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            border: "1px solid #e6eaf2",
            borderRadius: 12,
            background: "#fff",
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          <span>{r.zone}</span>
          <span style={{ color: "#64748b", fontWeight: 950 }}>{r.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- main --------------------------------- */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState("requests");
  const [breakdownTab, setBreakdownTab] = useState("status");
  const [geoRequests, setGeoRequests] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoErr, setGeoErr] = useState("");


  useEffect(() => {
    let mounted = true;

    getAdminDashboard()
      .then((res) => mounted && setData(res))
      .catch((e) => {
        console.error(e);
        mounted && setLoadError("Failed to load dashboard data.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "analytics") return;

    let alive = true;

    async function loadGeo() {
      setGeoLoading(true);
      setGeoErr("");
      try {
        const rows = await listRequests();
        if (!alive) return;
        setGeoRequests(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setGeoErr("Failed to load map requests.");
      } finally {
        if (alive) setGeoLoading(false);
      }
    }

    loadGeo();
    const id = setInterval(loadGeo, 10000); // every 10 seconds

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [activeTab]);


  const THEME = {
    accent: "#2563eb",
    good: "#16a34a",
    warn: "#f59e0b",
    bad: "#dc2626",
    muted: "#64748b",
    ink: "#0f172a",
  };

  const pieColors = [THEME.accent, THEME.good, THEME.warn, THEME.bad, "#7c3aed"];

  const computed = useMemo(() => {
    const totals = data?.totals ?? {};
    const sla = data?.sla ?? {};
    const zones = safeArr(data?.zones);
    const users = data?.users ?? {};
    const teams = data?.teams ?? {};

    const totalRequests = totals.total_requests ?? 0;
    const openRequests = totals.open_requests ?? 0;
    const closedRequests = totals.closed_requests ?? 0;
    const closedRate = totals.closed_rate ?? 0;

    const avgResponseHuman = fmtHoursToHuman(
      isNum(totals.avg_response_time_minutes)
        ? totals.avg_response_time_minutes / 60
        : null
    );

    const slaOk = sla.ok ?? 0;
    const slaAtRisk = sla.at_risk ?? 0;
    const slaBreached = sla.breached ?? 0;
    const slaCompliance = sla.compliance_percent ?? 0;

    const slaTotal = slaOk + slaAtRisk + slaBreached;

    const openShare =
      totalRequests > 0 ? Math.round((openRequests / totalRequests) * 100) : 0;

    const complianceLabel =
      slaCompliance >= 90
        ? "Excellent"
        : slaCompliance >= 75
          ? "Good"
          : slaCompliance >= 60
            ? "Fair"
            : "Needs attention";

    return {
      totalRequests,
      openRequests,
      closedRequests,
      closedRate,
      openShare,
      avgResponseHuman,

      slaTotal,
      slaOk,
      slaAtRisk,
      slaBreached,
      slaCompliance,
      complianceLabel,

      verifiedUsers: users.verified ?? 0,
      unverifiedUsers: users.unverified ?? 0,
      citizensCount: users.citizens ?? 0,
      staffCount: users.staff ?? 0,

      teamsList: safeArr(teams.per_team),
      totalTeams: teams.total ?? 0,

      zonesCount: zones.length,
      zones,
    };
  }, [data]);

  const statusChartData = Object.entries(data?.status_breakdown || {}).map(
    ([status, count]) => ({ status, count })
  );

  const slaBadge = (
    <span
      style={{
        ...styles.badge,
        borderColor:
          computed.slaCompliance >= 80
            ? `${THEME.good}33`
            : computed.slaCompliance >= 60
              ? `${THEME.warn}33`
              : `${THEME.bad}33`,
        color:
          computed.slaCompliance >= 80
            ? THEME.good
            : computed.slaCompliance >= 60
              ? THEME.warn
              : THEME.bad,
        background:
          computed.slaCompliance >= 80
            ? `${THEME.good}14`
            : computed.slaCompliance >= 60
              ? `${THEME.warn}14`
              : `${THEME.bad}14`,
      }}
    >
      {computed.complianceLabel} · {computed.slaCompliance}%
    </span>
  );

  const tabs = [
    { id: "requests", label: "Requests" },
    { id: "users", label: "Users • Teams" },
    { id: "analytics", label: "Analytics" },
  ];

  const breakdownTabs = [
    { id: "status", label: "Status" },
    { id: "zones", label: "Zones" },
    { id: "priority", label: "Priority" },
    { id: "category", label: "Category" },
    { id: "sla", label: "SLA" },
  ];

  // fixed heights to STOP jumping
  const CHART_H = 280;
  const BREAKDOWN_PANEL_H = 340; // keep same height for all breakdowns

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingLine}>Loading…</div>

          <div style={styles.gridAuto}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={styles.skeletonCard} />
            ))}
          </div>

          <div style={styles.gridAutoWide}>
            <div style={styles.skeletonCardTall} />
            <div style={styles.skeletonCardTall} />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Card title="Error" subtitle="Dashboard">
            <div style={styles.errorBox}>{loadError || "No data."}</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Tabs (tight, no huge top spacing) */}
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

        {/* Fixed tab panel height => main tabs won't shrink/grow */}
        <div style={styles.tabPanel}>
          {activeTab === "requests" && (
            <div style={styles.tabInner}>
              <Section
                title="Requests Overview"
                subtitle="KPIs and overview"
                right={<span style={styles.smallPill}>Overview</span>}
              >
                <div style={styles.gridAuto}>
                  <StatCard
                    label="Total Requests"
                    value={fmtInt(computed.totalRequests)}
                    hint="All time"
                    deltaLabel="Requests"
                  />
                  <StatCard
                    label="Open Requests"
                    value={fmtInt(computed.openRequests)}
                    hint="Needs attention"
                    deltaLabel={`${computed.openShare}% of total`}
                    progress={computed.openShare}
                  />
                  <StatCard
                    label="Closed Rate"
                    value={`${computed.closedRate}%`}
                    hint={`${fmtInt(computed.closedRequests)} resolved`}
                    deltaLabel="Completion"
                    progress={computed.closedRate}
                  />
                  <StatCard
                    label="Avg Response Time"
                    value={computed.avgResponseHuman}
                    hint="Time to triage"
                    deltaLabel="Avg"
                  />
                </div>
              </Section>

              <Section
                title="Request Trend"
                subtitle="Last 7 days"
                right={<span style={styles.smallPill}>Trend</span>}
              >
                <Card title="Requests Over Time" subtitle="Last 7 days">
                  {safeArr(data.trend).length > 0 ? (
                    <ResponsiveContainer width="100%" height={CHART_H}>
                      <LineChart data={data.trend}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: THEME.muted }}
                          tickFormatter={(v) =>
                            typeof v === "string" ? v.slice(5) : v
                          }
                        />
                        <YAxis tick={{ fontSize: 12, fill: THEME.muted }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={THEME.accent}
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={styles.emptyState}>No trend data available.</div>
                  )}
                </Card>
              </Section>

              <Section
                title="Request Breakdowns"
                subtitle="Status, zones, priority, category, SLA"
                right={<span style={styles.smallPill}>Breakdowns</span>}
              >
                <MiniTabs
                  tabs={breakdownTabs}
                  value={breakdownTab}
                  onChange={setBreakdownTab}
                />

                {/* Fixed height area so switching breakdown tabs doesn't jump */}
                <div style={{ ...styles.fixedPanel, height: BREAKDOWN_PANEL_H }}>
                  {breakdownTab === "status" && (
                    <Card
                      title="By Status"
                      subtitle="Requests by status"
                      style={{ height: "100%" }}
                      bodyStyle={{ height: "100%" }}
                    >
                      {statusChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={BREAKDOWN_PANEL_H - 90}>
                          <BarChart data={statusChartData} barCategoryGap={14}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                              dataKey="status"
                              tick={{ fontSize: 12, fill: THEME.muted }}
                            />
                            <YAxis tick={{ fontSize: 12, fill: THEME.muted }} />
                            <Tooltip />
                            <Bar
                              dataKey="count"
                              fill={THEME.accent}
                              radius={[10, 10, 0, 0]}
                              activeBar={false}

                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={styles.emptyState}>No status breakdown available.</div>
                      )}
                    </Card>
                  )}

                  {breakdownTab === "zones" && (
                    <Card
                      title="By Zone"
                      subtitle="Geographical distribution"
                      style={{ height: "100%" }}
                      bodyStyle={{ height: "100%" }}
                    >
                      {computed.zones.length > 0 ? (
                        <ResponsiveContainer width="100%" height={BREAKDOWN_PANEL_H - 90}>
                          <BarChart data={computed.zones} barCategoryGap={14}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                              dataKey="zone"
                              tick={{ fontSize: 12, fill: THEME.muted }}
                            />
                            <YAxis tick={{ fontSize: 12, fill: THEME.muted }} />
                            <Tooltip />
                            <Bar
                              dataKey="count"
                              fill={THEME.warn}
                              radius={[10, 10, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={styles.emptyState}>No zone data available.</div>
                      )}
                    </Card>
                  )}

                  {breakdownTab === "priority" && (
                    <Card
                      title="By Priority"
                      subtitle="Priority distribution"
                      style={{ height: "100%" }}
                      bodyStyle={{ height: "100%" }}
                    >
                      {safeArr(data.priority_distribution).length > 0 ? (
                        <ResponsiveContainer width="100%" height={BREAKDOWN_PANEL_H - 70}>
                          <PieChart>
                            <Pie
                              data={data.priority_distribution}
                              dataKey="count"
                              nameKey="priority"
                              cx="50%"
                              cy="50%"
                              outerRadius={110}
                            >
                              {data.priority_distribution.map((_, i) => (
                                <Cell key={i} fill={pieColors[i % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={styles.emptyState}>No priority data available.</div>
                      )}
                    </Card>
                  )}

                  {breakdownTab === "category" && (
                    <Card
                      title="By Category"
                      subtitle="Categories and subcategories"
                      style={{ height: "100%" }}
                      bodyStyle={{ height: "100%", overflow: "auto" }}
                    >
                      {safeArr(data.requests_by_category).length > 0 ? (
                        <div style={styles.categoryGrid}>
                          {data.requests_by_category.map((cat, idx) => (
                            <div key={cat.category ?? idx} style={styles.categoryCard}>
                              <div style={styles.categoryTop}>
                                <div style={styles.categoryName}>
                                  <span
                                    style={{
                                      ...styles.categoryDot,
                                      background: pieColors[idx % pieColors.length],
                                    }}
                                  />
                                  {cat.category || "—"}
                                </div>
                                <div style={styles.categoryTotal}>{fmtInt(cat.total)}</div>
                              </div>

                              <div style={styles.tagWrap}>
                                {(cat.subs || []).length ? (
                                  cat.subs.map((s) => (
                                    <div key={s.name} style={styles.tag}>
                                      <span style={styles.tagName}>{s.name}</span>
                                      <span style={styles.tagCount}>{fmtInt(s.count)}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div style={styles.emptyStateSmall}>No subcategories.</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={styles.emptyState}>No category breakdown available.</div>
                      )}
                    </Card>
                  )}

                  {breakdownTab === "sla" && (
                    <Card
                      title="SLA Summary"
                      subtitle="On-track vs risk and breaches"
                      right={slaBadge}
                      style={{ height: "100%" }}
                      bodyStyle={{ height: "100%", overflow: "auto" }}
                    >
                      <div style={styles.slaRowAuto}>
                        <SlaMiniCard
                          label="On Track"
                          value={computed.slaOk}
                          total={computed.slaTotal}
                          tone={THEME.good}
                        />
                        <SlaMiniCard
                          label="At Risk"
                          value={computed.slaAtRisk}
                          total={computed.slaTotal}
                          tone={THEME.warn}
                        />
                        <SlaMiniCard
                          label="Breached"
                          value={computed.slaBreached}
                          total={computed.slaTotal}
                          tone={THEME.bad}
                        />
                        <div style={styles.slaBig}>
                          <div style={styles.slaBigLabel}>Overall compliance</div>
                          <div style={styles.slaBigValue}>{computed.slaCompliance}%</div>
                          <div style={styles.progressTrack}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${clamp(computed.slaCompliance)}%`,
                                background:
                                  computed.slaCompliance >= 80
                                    ? THEME.good
                                    : computed.slaCompliance >= 60
                                      ? THEME.warn
                                      : THEME.bad,
                              }}
                            />
                          </div>
                          <div style={styles.slaBigHint}>
                            Based on {fmtInt(computed.slaTotal)} total SLA items
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </Section>
            </div>
          )}

          {activeTab === "users" && (
            <div style={styles.tabInner}>
              <Section
                title="Users"
                subtitle="Verification and user types"
                right={<span style={styles.smallPill}>Users</span>}
              >
                <div style={styles.gridAuto}>
                  <StatCard
                    label="Verified Users"
                    value={fmtInt(computed.verifiedUsers)}
                    hint="Completed verification"
                  />
                  <StatCard
                    label="Unverified Users"
                    value={fmtInt(computed.unverifiedUsers)}
                    hint="Pending verification"
                  />
                  <StatCard
                    label="Citizens"
                    value={fmtInt(computed.citizensCount)}
                    hint="Service users"
                  />
                  <StatCard
                    label="Staff"
                    value={fmtInt(computed.staffCount)}
                    hint="Municipal staff"
                  />
                </div>
              </Section>

              <Section
                title="Teams"
                subtitle="Coverage and workload"
                right={<span style={styles.smallPill}>Teams</span>}
              >
                <div style={styles.gridAuto}>
                  <StatCard
                    label="Total Teams"
                    value={fmtInt(computed.totalTeams)}
                    hint="Active teams"
                  />
                  <StatCard
                    label="Zones Covered"
                    value={fmtInt(computed.zonesCount)}
                    hint="Active zones"
                  />
                </div>
              </Section>

              <Section
                title="Team Workload"
                subtitle="Requests per team"
                right={<span style={styles.smallPill}>Workload</span>}
              >
                <Card title="Teams & Workload" subtitle="Requests per team">
                  {computed.teamsList.length > 0 ? (
                    <ResponsiveContainer width="100%" height={CHART_H}>
                      <BarChart data={computed.teamsList} barCategoryGap={14}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: THEME.muted }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 12, fill: THEME.muted }} />
                        <Tooltip />
                        <Bar
                          dataKey="requests_count"
                          fill={THEME.accent}
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={styles.emptyState}>No team data available.</div>
                  )}
                </Card>
              </Section>
            </div>
          )}

          {activeTab === "analytics" && (
            <div style={styles.tabInner}>
              <Section
                title="Geo Feeds & Map"
                subtitle="Live heat-map of open requests, clustering, and zone summaries"
                right={<span style={styles.smallPill}>Live</span>}
              >
                {geoErr ? (
                  <div style={styles.errorBox}>{geoErr}</div>
                ) : geoLoading && geoRequests.length === 0 ? (
                  <div style={styles.emptyState}>Loading map data…</div>
                ) : (
                  <>
                    <Card
                      title="Live Heat-map + Clustering"
                      subtitle="Open requests only (new/triaged/assigned/in_progress)"
                    >
                      <AdminGeoMap
                        requests={geoRequests}
                        bbox={{ north: 31.995, south: 31.82, east: 35.315, west: 35.07 }}
                        grid={{ rows: 3, cols: 4 }}
                      />
                    </Card>

                    <div style={{ height: 12 }} />

                    <Card
                      title="Zone Summary (Open Requests)"
                      subtitle="Darker zones mean more open requests"
                    >
                      {/* simple zone table summary */}
                      <ZoneSummary requests={geoRequests} />
                    </Card>
                  </>
                )}
              </Section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* --------------------------------- styles -------------------------------- */
const styles = {
  page: {
    width: "100%",
    padding: 0,
    margin: 0,
    background: "transparent",
  },

  container: {
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    display: "grid",
    gap: 12, // tighter => less top whitespace
  },

  loadingLine: {
    fontWeight: 900,
    color: "#0f172a",
    padding: "4px 2px",
  },

  // Tabs stick under the header, but NOT create huge whitespace
  tabsWrap: {
    top: 64,     // ✅ exactly the topbar height
    zIndex: 10,
    marginTop: 0,
    paddingTop: 10,
    paddingBottom: 10,
    background: "linear-gradient(#f4f6fb 70%, rgba(244,246,251,0))",
  },
  tabs: {
    width: "fit-content",
    maxWidth: "100%",
    display: "flex",
    gap: 6,
    padding: 6,
    borderRadius: 999,
    background: "#ffffff",
    border: "1px solid #e6eaf2",
    boxShadow: "0 6px 18px rgba(2,6,23,0.06)",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  tabBtn: {
    appearance: "none",
    border: "1px solid transparent",
    background: "transparent",
    padding: "9px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  },
  tabBtnActive: {
    background: "#0f172a",
    borderColor: "#0f172a",
    color: "#ffffff",
  },

  // fixed panel height for main tabs
  tabPanel: {
    minHeight: "calc(100vh - 64px - 24px)", // keeps page stable
  },
  tabInner: {
    display: "grid",
    gap: 14,
  },

  miniTabsWrap: { marginBottom: 12 },
  miniTabs: {
    width: "fit-content",
    maxWidth: "100%",
    display: "flex",
    gap: 8,
    padding: 6,
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e6eaf2",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  miniTabBtn: {
    appearance: "none",
    border: "1px solid transparent",
    background: "transparent",
    padding: "8px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    color: "#334155",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  },
  miniTabBtnActive: {
    background: "#0f172a",
    color: "#fff",
    borderColor: "#0f172a",
  },

  section: {
    borderRadius: 18,
    border: "1px solid #e6eaf2",
    background: "#ffffff",
    boxShadow: "0 10px 26px rgba(2,6,23,0.06)",
    overflow: "hidden",
  },
  sectionHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    background:
      "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
  },
  sectionTitle: { fontSize: 14, fontWeight: 950, color: "#0f172a" },
  sectionSubtitle: { marginTop: 2, fontSize: 12, color: "#64748b" },
  sectionBody: { padding: 16 },

  smallPill: {
    fontSize: 12,
    fontWeight: 900,
    color: "#334155",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    padding: "6px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },

  gridAuto: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },
  gridAutoWide: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 12,
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e6eaf2",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: 900, color: "#0f172a" },
  cardSubtitle: { marginTop: 2, fontSize: 12, color: "#64748b" },
  cardBody: {
    width: "100%",
  },

  statCard: { minHeight: 120 },
  statValue: {
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: "-0.02em",
    marginTop: 6,
  },

  badge: {
    fontSize: 12,
    fontWeight: 900,
    color: "#334155",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "6px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },

  progressTrack: {
    height: 8,
    background: "#eef2ff",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: 999,
    transition: "width 250ms ease",
  },

  fixedPanel: {
    width: "100%",
  },

  slaRowAuto: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  slaMiniCard: {
    border: "1px solid #e6eaf2",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gridTemplateRows: "auto auto",
    gap: "6px 10px",
    alignItems: "center",
    background: "#ffffff",
  },
  slaDot: { width: 10, height: 10, borderRadius: "50%", gridRow: "1 / span 2" },
  slaMiniLabel: { fontSize: 12, color: "#64748b", fontWeight: 800 },
  slaMiniValue: { fontSize: 22, fontWeight: 950, color: "#0f172a", gridColumn: 2 },
  slaMiniPct: {
    fontSize: 12,
    fontWeight: 900,
    color: "#334155",
    gridColumn: 3,
    gridRow: "1 / span 2",
    alignSelf: "center",
  },
  slaBig: {
    border: "1px solid #e6eaf2",
    borderRadius: 14,
    padding: 14,
    background: "#ffffff",
  },
  slaBigLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  slaBigValue: { fontSize: 34, fontWeight: 950, color: "#0f172a", marginTop: 6 },
  slaBigHint: { marginTop: 8, fontSize: 12, color: "#64748b" },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
  },
  categoryCard: {
    border: "1px solid #e6eaf2",
    borderRadius: 14,
    padding: 14,
    background: "#ffffff",
  },
  categoryTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  categoryName: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 950,
    color: "#0f172a",
  },
  categoryDot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  categoryTotal: { fontSize: 18, fontWeight: 950, color: "#0f172a" },

  tagWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  tag: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    background: "#f8fafc",
    border: "1px solid #e6eaf2",
    borderRadius: 999,
  },
  tagName: { fontSize: 12, fontWeight: 900, color: "#334155" },
  tagCount: {
    fontSize: 12,
    fontWeight: 950,
    color: "#0f172a",
    background: "#e2e8f0",
    padding: "2px 8px",
    borderRadius: 999,
  },

  emptyState: {
    padding: 14,
    color: "#64748b",
    fontSize: 13,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
  },
  emptyStateSmall: {
    padding: 10,
    color: "#64748b",
    fontSize: 12,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
  },
  placeholderBox: {
    padding: 14,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#334155",
    fontWeight: 800,
  },

  errorBox: {
    padding: 14,
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontWeight: 800,
  },

  skeletonCard: {
    height: 120,
    borderRadius: 16,
    background: "linear-gradient(90deg, #ffffff 0%, #f1f5f9 50%, #ffffff 100%)",
    border: "1px solid #e6eaf2",
  },
  skeletonCardTall: {
    height: 320,
    borderRadius: 16,
    background: "linear-gradient(90deg, #ffffff 0%, #f1f5f9 50%, #ffffff 100%)",
    border: "1px solid #e6eaf2",
  },
};
