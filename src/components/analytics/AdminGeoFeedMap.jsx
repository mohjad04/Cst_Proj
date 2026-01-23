// // // src/components/analytics/AdminGeoFeedMap.jsx
// // import React, { useMemo } from "react";
// // import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
// // import "leaflet/dist/leaflet.css";

// // export default function AdminGeoFeedMap({ geojson }) {
// //     const points = useMemo(() => {
// //         const feats = geojson?.features || [];
// //         return feats
// //             .filter((f) => f?.geometry?.type === "Point")
// //             .map((f) => {
// //                 const [lng, lat] = f.geometry.coordinates || [];
// //                 return {
// //                     lat,
// //                     lng,
// //                     props: f.properties || {},
// //                 };
// //             })
// //             .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
// //     }, [geojson]);

// //     return (
// //         <div style={{ width: "100%", height: 520, borderRadius: 14, overflow: "hidden" }}>
// //             <MapContainer
// //                 style={{ width: "100%", height: "100%" }}
// //                 center={[31.9, 35.22]}
// //                 zoom={11}
// //                 scrollWheelZoom
// //             >
// //                 <TileLayer
// //                     attribution='&copy; OpenStreetMap contributors'
// //                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
// //                 />

// //                 {points.map((p, idx) => (
// //                     <CircleMarker
// //                         key={`${p.props.request_id || idx}`}
// //                         center={[p.lat, p.lng]}
// //                         radius={8}
// //                         pathOptions={{}}
// //                     >
// //                         <Popup>
// //                             <div style={{ fontWeight: 800 }}>
// //                                 {p.props.request_id || "Request"}
// //                             </div>
// //                             <div>zone: {p.props.zone || "—"}</div>
// //                             <div>Category: {p.props.category || "—"}</div>
// //                             <div>Subcategory: {p.props.sub_category || "—"}</div>
// //                             <div>Weight: {p.props.weight ?? "—"}</div>
// //                             <div>Age (h): {p.props.age_hours ?? "—"}</div>
// //                         </Popup>
// //                     </CircleMarker>
// //                 ))}
// //             </MapContainer>
// //         </div>
// //     );
// // }
// import React, { useEffect, useMemo } from "react";
// import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
// import L from "leaflet";

// /* ------------------------------ helpers ------------------------------ */
// const clamp01 = (x) => Math.max(0, Math.min(1, x));

// function hexToRgb(hex) {
//     const h = String(hex).replace("#", "").trim();
//     const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
//     const n = parseInt(full, 16);
//     return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
// }
// function lerp(a, b, t) {
//     return a + (b - a) * t;
// }
// function colorRamp(stops, t) {
//     const tt = clamp01(t);
//     const s = [...stops].sort((a, b) => a.t - b.t);
//     if (tt <= s[0].t) return s[0].c;
//     if (tt >= s[s.length - 1].t) return s[s.length - 1].c;

//     for (let i = 0; i < s.length - 1; i++) {
//         const a = s[i], b = s[i + 1];
//         if (tt >= a.t && tt <= b.t) {
//             const localT = (tt - a.t) / (b.t - a.t || 1);
//             const A = hexToRgb(a.c), B = hexToRgb(b.c);
//             const r = Math.round(lerp(A.r, B.r, localT));
//             const g = Math.round(lerp(A.g, B.g, localT));
//             const bb = Math.round(lerp(A.b, B.b, localT));
//             return `rgb(${r}, ${g}, ${bb})`;
//         }
//     }
//     return s[0].c;
// }

// function fmt(v) {
//     if (v === null || v === undefined || v === "") return "—";
//     return String(v);
// }
// function fmtNum(v) {
//     const n = Number(v);
//     return Number.isFinite(n) ? n.toFixed(2).replace(/\.00$/, "") : "—";
// }

// /**
//  * INPUT expected from backend:
//  * geojson: { type:"FeatureCollection", features:[ {geometry:{coordinates:[lng,lat]}, properties:{count,weight,age_hours,zone,category,sub_category}} ] }
//  */
// export default function AdminGeoFeedMap({
//     geojson,
//     // keep same bbox default as your other map
//     bbox = { north: 31.995, south: 31.82, east: 35.315, west: 35.07 },
// }) {
//     // ✅ same legend stops as AdminGeoMap
//     const legendStops = useMemo(
//         () => [
//             { t: 0.0, c: "#2563eb" }, // blue
//             { t: 0.25, c: "#22c55e" }, // green
//             { t: 0.5, c: "#facc15" }, // yellow
//             { t: 0.75, c: "#f97316" }, // orange
//             { t: 1.0, c: "#ef4444" }, // red
//         ],
//         []
//     );

//     const features = useMemo(() => {
//         const f = geojson?.features;
//         return Array.isArray(f) ? f : [];
//     }, [geojson]);

//     // max for color scaling (use count/weight)
//     const maxCount = useMemo(() => {
//         let m = 0;
//         for (const ft of features) {
//             const c = ft?.properties?.count ?? ft?.properties?.weight ?? 0;
//             const n = Number(c);
//             if (Number.isFinite(n)) m = Math.max(m, n);
//         }
//         return m || 1;
//     }, [features]);

//     return (
//         <div
//             style={{
//                 height: 520,
//                 borderRadius: 16,
//                 overflow: "hidden",
//                 border: "1px solid rgba(15,23,42,0.08)",
//                 position: "relative",
//                 isolation: "isolate",
//                 contain: "layout paint",
//             }}
//         >
//             <MapLegend max={maxCount} stops={legendStops} />

//             <MapContainer
//                 style={{ height: "100%", width: "100%" }}
//                 dragging={false}
//                 scrollWheelZoom={false}
//                 doubleClickZoom={false}
//                 touchZoom={false}
//                 boxZoom={false}
//                 keyboard={false}
//                 zoomControl={false}
//             >
//                 <FitToBounds bbox={bbox} />

//                 <TileLayer
//                     attribution="&copy; OpenStreetMap"
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 />

//                 {/* Render feed cells as “glow” circle markers */}
//                 {features.map((ft, idx) => {
//                     const coords = ft?.geometry?.coordinates; // [lng, lat]
//                     if (!Array.isArray(coords) || coords.length < 2) return null;

//                     const lng = Number(coords[0]);
//                     const lat = Number(coords[1]);
//                     if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

//                     const p = ft?.properties || {};
//                     const count = Number(p.count ?? p.weight ?? 0);
//                     const t = Math.min(1, (Number.isFinite(count) ? count : 0) / maxCount);

//                     const fill = colorRamp(legendStops, t);

//                     // radius based on intensity (keep it smooth)
//                     const radius = 7 + Math.round(10 * t); // 7..17

//                     return (
//                         <CircleMarker
//                             key={p.cell_id || `${lat},${lng},${idx}`}
//                             center={[lat, lng]}
//                             radius={radius}
//                             pathOptions={{
//                                 color: "rgba(255,255,255,0.7)",
//                                 weight: 1.3,
//                                 opacity: 0.85,
//                                 fillColor: fill,
//                                 fillOpacity: 0.22 + 0.45 * t, // stronger when hotter
//                             }}
//                         >
//                             <Tooltip>
//                                 <div style={{ display: "grid", gap: 2 }}>
//                                     <b>Request Cell</b>
//                                     <span>Zone: {fmt(p.zone)}</span>
//                                     <span>Category: {fmt(p.category)}</span>
//                                     <span>Subcategory: {fmt(p.sub_category)}</span>
//                                     <span>Weight: {fmt(p.weight ?? p.count)}</span>
//                                     <span>Age (h): {fmtNum(p.age_hours)}</span>
//                                 </div>
//                             </Tooltip>
//                         </CircleMarker>
//                     );
//                 })}
//             </MapContainer>
//         </div>
//     );
// }

// /** ✅ Legend overlay (same style as other map) */
// function MapLegend({ max, stops }) {
//     const bar = `linear-gradient(to right, ${stops
//         .map((s) => `${s.c} ${Math.round(s.t * 100)}%`)
//         .join(", ")})`;

//     return (
//         <div
//             style={{
//                 position: "absolute",
//                 left: 14,
//                 bottom: 14,
//                 zIndex: 999,
//                 width: 260,
//                 padding: "10px 12px",
//                 borderRadius: 14,
//                 background: "rgba(15, 23, 42, 0.72)",
//                 border: "1px solid rgba(255,255,255,0.14)",
//                 backdropFilter: "blur(10px)",
//                 color: "rgba(255,255,255,0.92)",
//                 fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
//             }}
//         >
//             <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8, letterSpacing: 0.2 }}>
//                 Open Requests Heat Scale
//             </div>

//             <div
//                 style={{
//                     height: 10,
//                     borderRadius: 999,
//                     background: bar,
//                     border: "1px solid rgba(255,255,255,0.18)",
//                 }}
//             />

//             <div
//                 style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     marginTop: 6,
//                     fontSize: 12,
//                     opacity: 0.9,
//                 }}
//             >
//                 <span>0</span>
//                 <span>{max}</span>
//             </div>
//         </div>
//     );
// }

// function FitToBounds({ bbox }) {
//     const map = useMap();

//     useEffect(() => {
//         const bounds = L.latLngBounds([bbox.south, bbox.west], [bbox.north, bbox.east]).pad(0.2);
//         map.fitBounds(bounds, { animate: false });

//         // prevent shifting (same as other map)
//         const t1 = setTimeout(() => map.invalidateSize(false), 50);
//         const t2 = setTimeout(() => map.invalidateSize(false), 200);
//         const t3 = setTimeout(() => map.invalidateSize(false), 600);

//         return () => {
//             clearTimeout(t1);
//             clearTimeout(t2);
//             clearTimeout(t3);
//         };
//     }, [map, bbox]);

//     return null;
// }
import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";

/* ------------------------------ helpers ------------------------------ */
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function hexToRgb(hex) {
    const h = String(hex).replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function colorRamp(stops, t) {
    const tt = clamp01(t);
    const s = [...stops].sort((a, b) => a.t - b.t);
    if (tt <= s[0].t) return s[0].c;
    if (tt >= s[s.length - 1].t) return s[s.length - 1].c;

    for (let i = 0; i < s.length - 1; i++) {
        const a = s[i], b = s[i + 1];
        if (tt >= a.t && tt <= b.t) {
            const localT = (tt - a.t) / (b.t - a.t || 1);
            const A = hexToRgb(a.c), B = hexToRgb(b.c);
            const r = Math.round(lerp(A.r, B.r, localT));
            const g = Math.round(lerp(A.g, B.g, localT));
            const bb = Math.round(lerp(A.b, B.b, localT));
            return `rgb(${r}, ${g}, ${bb})`;
        }
    }
    return s[0].c;
}

function fmt(v) {
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
}
function fmtNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2).replace(/\.00$/, "") : "—";
}

/* -------------------------------- component -------------------------------- */

export default function AdminGeoFeedMap({
    geojson,
    bbox = { north: 31.995, south: 31.82, east: 35.315, west: 35.07 },
}) {
    const legendStops = useMemo(
        () => [
            { t: 0.0, c: "#2563eb" },
            { t: 0.25, c: "#22c55e" },
            { t: 0.5, c: "#facc15" },
            { t: 0.75, c: "#f97316" },
            { t: 1.0, c: "#ef4444" },
        ],
        []
    );

    const features = useMemo(() => {
        const f = geojson?.features;
        return Array.isArray(f) ? f : [];
    }, [geojson]);

    const maxCount = useMemo(() => {
        let m = 0;
        for (const ft of features) {
            const c = ft?.properties?.count ?? ft?.properties?.weight ?? 0;
            const n = Number(c);
            if (Number.isFinite(n)) m = Math.max(m, n);
        }
        return m || 1;
    }, [features]);

    return (
        <div
            style={{
                height: 520,
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(15,23,42,0.08)",
                position: "relative",
                isolation: "isolate",
                contain: "layout paint",
            }}
        >
            {/* <MapLegend max={maxCount} stops={legendStops} /> */}

            <MapContainer
                style={{ height: "100%", width: "100%" }}
                // ✅ enable zoom like a normal map
                dragging={true}
                scrollWheelZoom={true}
                doubleClickZoom={true}
                touchZoom={true}
                boxZoom={true}
                keyboard={true}
                zoomControl={true}
            >
                {/* ✅ fit to bbox + lock minZoom + bounce back when user zooms out/pans away */}
                <FitAndLockToBounds bbox={bbox} />

                <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {features.map((ft, idx) => {
                    const coords = ft?.geometry?.coordinates; // [lng, lat]
                    if (!Array.isArray(coords) || coords.length < 2) return null;

                    const lng = Number(coords[0]);
                    const lat = Number(coords[1]);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

                    const p = ft?.properties || {};
                    const count = Number(p.count ?? p.weight ?? 0);
                    const t = Math.min(1, (Number.isFinite(count) ? count : 0) / maxCount);

                    const fill = colorRamp(legendStops, t);
                    const radius = 7 + Math.round(10 * t);

                    return (
                        <CircleMarker
                            key={p.cell_id || `${lat},${lng},${idx}`}
                            center={[lat, lng]}
                            radius={radius}
                            pathOptions={{
                                color: "rgba(255,255,255,0.7)",
                                weight: 1.3,
                                opacity: 0.85,
                                fillColor: fill,
                                fillOpacity: 0.22 + 0.45 * t,
                            }}
                        >
                            <Tooltip>
                                <div style={{ display: "grid", gap: 2 }}>
                                    <b>Request Cell</b>
                                    <span>Zone: {fmt(p.zone)}</span>
                                    <span>Category: {fmt(p.category)}</span>
                                    <span>Subcategory: {fmt(p.sub_category)}</span>
                                    <span>Weight: {fmt(p.weight ?? p.count)}</span>
                                    <span>Age (h): {fmtNum(p.age_hours)}</span>
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

/* ------------------------------ legend ------------------------------ */
function MapLegend({ max, stops }) {
    const bar = `linear-gradient(to right, ${stops
        .map((s) => `${s.c} ${Math.round(s.t * 100)}%`)
        .join(", ")})`;

    return (
        <div
            style={{
                position: "absolute",
                left: 14,
                bottom: 14,
                zIndex: 999,
                width: 260,
                padding: "10px 12px",
                borderRadius: 14,
                background: "rgba(15, 23, 42, 0.72)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(10px)",
                color: "rgba(255,255,255,0.92)",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
            }}
        >
            <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8, letterSpacing: 0.2 }}>
                Open Requests Heat Scale
            </div>

            <div
                style={{
                    height: 10,
                    borderRadius: 999,
                    background: bar,
                    border: "1px solid rgba(255,255,255,0.18)",
                }}
            />

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    fontSize: 12,
                    opacity: 0.9,
                }}
            >
                <span>0</span>
                <span>{max}</span>
            </div>
        </div>
    );
}

/* ------------------------------ bounds control ------------------------------ */
/**
 * - fits to bbox on mount
 * - computes "default zoom" that fits bbox, then sets map minZoom to that
 * - if user pans far away, or tries to zoom out (can't because minZoom), we snap back
 */
function FitAndLockToBounds({ bbox }) {
    const map = useMap();
    const defaultBoundsRef = useRef(null);
    const defaultZoomRef = useRef(null);

    useEffect(() => {
        const bounds = L.latLngBounds([bbox.south, bbox.west], [bbox.north, bbox.east]).pad(0.2);
        defaultBoundsRef.current = bounds;

        // Fit once (no animation)
        map.fitBounds(bounds, { animate: false });

        // After fit, compute the zoom that fits and set as minZoom
        // (use small timeout so Leaflet has size)
        const t0 = setTimeout(() => {
            const z = map.getBoundsZoom(bounds, false);
            defaultZoomRef.current = z;
            map.setMinZoom(z);
            // optional: don't allow crazy zoom-in? keep normal max
            map.setMaxZoom(19);

            map.invalidateSize(false);
        }, 60);

        const t1 = setTimeout(() => map.invalidateSize(false), 200);
        const t2 = setTimeout(() => map.invalidateSize(false), 600);

        return () => {
            clearTimeout(t0);
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [map, bbox]);

    useEffect(() => {
        if (!map) return;

        function ensureInside() {
            const b = defaultBoundsRef.current;
            if (!b) return;

            // If user panned outside the bbox area too much => snap back
            // (use contains check on center)
            const center = map.getCenter();
            if (!b.contains(center)) {
                map.flyToBounds(b, { animate: true, duration: 0.35 });
                return;
            }

            // If zoom somehow becomes lower than defaultZoom => snap back
            const dz = defaultZoomRef.current;
            if (typeof dz === "number" && map.getZoom() < dz) {
                map.setZoom(dz, { animate: true });
            }
        }

        map.on("dragend", ensureInside);
        map.on("zoomend", ensureInside);

        return () => {
            map.off("dragend", ensureInside);
            map.off("zoomend", ensureInside);
        };
    }, [map]);

    return null;
}
