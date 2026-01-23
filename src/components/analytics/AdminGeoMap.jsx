// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON, useMap } from "react-leaflet";
// import "leaflet.heat";
// import L from "leaflet";
// import MarkerClusterGroup from "react-leaflet-cluster";

// /**
//  * INPUT:
//  * - requests: array of requests (must have coordinates + zone_name + status)
//  * - bbox: { north, south, east, west } same as your Android LIMIT_BBOX
//  * - grid: { rows, cols } same as Android GRID_ROWS/GRID_COLS
//  */
// export default function AdminGeoMap({
//     requests = [],
//     bbox = { north: 31.995, south: 31.82, east: 35.315, west: 35.07 },
//     grid = { rows: 3, cols: 4 },
// }) {
//     const center = useMemo(() => [(bbox.north + bbox.south) / 2, (bbox.east + bbox.west) / 2], [bbox]);

//     // only OPEN requests for heatmap & zone coloring (adjust statuses as you want)
//     const openRequests = useMemo(() => {
//         const OPEN = new Set(["new", "triaged", "assigned", "in_progress"]);
//         return (requests || []).filter((r) => OPEN.has(String(r.status || "").toLowerCase()));
//     }, [requests]);

//     // build heat points from coordinates
//     const heatPoints = useMemo(() => {
//         return openRequests
//             .map((r) => {
//                 const c = r?.location?.coordinates; // [lat, lng] (your modal shows it as [0],[1])
//                 if (!Array.isArray(c) || c.length < 2) return null;
//                 const lat = Number(c[0]);
//                 const lng = Number(c[1]);
//                 if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
//                 return [lat, lng, 0.8]; // intensity
//             })
//             .filter(Boolean);
//     }, [openRequests]);

//     const bounds = [
//         [bbox.south, bbox.west],
//         [bbox.north, bbox.east],
//     ];

//     // build zone polygons as rectangles (same logic as your Android grid zones)
//     const zonesGeoJson = useMemo(() => {
//         const rows = grid.rows;
//         const cols = grid.cols;

//         const latMin = bbox.south;
//         const latMax = bbox.north;
//         const lonMin = bbox.west;
//         const lonMax = bbox.east;

//         const h = latMax - latMin;
//         const w = lonMax - lonMin;


//         const features = [];
//         for (let r = 0; r < rows; r++) {
//             for (let c = 0; c < cols; c++) {
//                 const cellLatMin = latMin + (r * h) / rows;
//                 const cellLatMax = latMin + ((r + 1) * h) / rows;

//                 const cellLonMin = lonMin + (c * w) / cols;
//                 const cellLonMax = lonMin + ((c + 1) * w) / cols;

//                 const zoneName = `ZONE-R${r + 1}-C${c + 1}`;

//                 // GeoJSON polygon uses [lng, lat]
//                 const coords = [
//                     [
//                         [cellLonMin, cellLatMax],
//                         [cellLonMax, cellLatMax],
//                         [cellLonMax, cellLatMin],
//                         [cellLonMin, cellLatMin],
//                         [cellLonMin, cellLatMax],
//                     ],
//                 ];

//                 features.push({
//                     type: "Feature",
//                     properties: { zone: zoneName },
//                     geometry: { type: "Polygon", coordinates: coords },
//                 });
//             }
//         }

//         return { type: "FeatureCollection", features };
//     }, [bbox, grid]);

//     // count open requests per zone
//     const openCountByZone = useMemo(() => {
//         const map = new Map();
//         for (const r of openRequests) {
//             const z = r.zone_name || r.zoneName || r.zone; // be flexible
//             if (!z) continue;
//             map.set(z, (map.get(z) || 0) + 1);
//         }
//         return map;
//     }, [openRequests]);

//     // for coloring: find max
//     const maxOpen = useMemo(() => {
//         let m = 0;
//         for (const v of openCountByZone.values()) m = Math.max(m, v);
//         return m || 1;
//     }, [openCountByZone]);

//     return (
//         <div
//             style={{
//                 height: 520,
//                 borderRadius: 16,
//                 overflow: "hidden",
//                 border: "1px solid rgba(15,23,42,0.08)",
//                 position: "relative", // ✅ add this line
//                 isolation: "isolate",     // ✅ new
//                 contain: "layout paint",  // ✅ new
//             }}
//         >            <MapContainer center={center}
//             style={{ height: "100%", width: "100%" }}
//             dragging={false}
//             scrollWheelZoom={false}
//             doubleClickZoom={false}
//             touchZoom={false}
//             boxZoom={false}
//             keyboard={false}
//             zoomControl={false}
//         >
//                 <FitToBounds bbox={bbox} />
//                 <TileLayer
//                     attribution='&copy; OpenStreetMap'
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 />
//                 {/* Heatmap overlay */}
//                 <HeatLayer points={heatPoints} />
//                 {/* Zone layer (choropleth-like) */}
//                 <GeoJSON
//                     data={zonesGeoJson}
//                     style={(feature) => {
//                         const zone = feature?.properties?.zone;
//                         const count = openCountByZone.get(zone) || 0;
//                         const t = Math.min(1, count / maxOpen); // 0..1

//                         // darker red when more open requests
//                         const fillOpacity = 0.08 + 0.40 * t;

//                         return {
//                             weight: 1.2,
//                             color: "rgba(220,38,38,0.45)",          // red border
//                             fillColor: "rgba(220,38,38,1)",         // RED fill (instead of blue)
//                             fillOpacity,
//                         };
//                     }}
//                     onEachFeature={(feature, layer) => {
//                         const zone = feature?.properties?.zone;
//                         const count = openCountByZone.get(zone) || 0;
//                         layer.bindTooltip(`${zone} • Open: ${count}`, { sticky: true });
//                     }}
//                 />

//                 {/* Marker clustering */}
//                 <MarkerClusterGroup chunkedLoading>
//                     {openRequests.map((r) => {
//                         const c = r?.location?.coordinates;
//                         if (!Array.isArray(c) || c.length < 2) return null;
//                         const lat = Number(c[0]);
//                         const lng = Number(c[1]);
//                         if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

//                         return (
//                             <CircleMarker
//                                 key={r.request_id}
//                                 center={[lat, lng]}
//                                 radius={6}
//                                 pathOptions={{
//                                     color: "rgba(220,38,38,0.9)",      // stroke red
//                                     fillColor: "rgba(220,38,38,1)",    // fill red
//                                     weight: 2,
//                                     opacity: 0.9,
//                                     fillOpacity: 0.25,
//                                 }}
//                             >

//                                 <Tooltip>
//                                     <div style={{ display: "grid", gap: 2 }}>
//                                         <b>{r.request_id}</b>
//                                         <span>Status: {String(r.status || "").replace("_", " ")}</span>
//                                         <span>Zone: {r.zone_name || "—"}</span>
//                                     </div>
//                                 </Tooltip>
//                             </CircleMarker>
//                         );
//                     })}
//                 </MarkerClusterGroup>


//             </MapContainer>
//         </div>
//     );
// }

// /** Leaflet heat layer bridge */
// function HeatLayer({ points }) {
//     const map = useMap();
//     const layerRef = useRef(null);

//     useEffect(() => {
//         if (!map) return;

//         if (layerRef.current) {
//             map.removeLayer(layerRef.current);
//             layerRef.current = null;
//         }

//         if (!points || points.length === 0) return;

//         layerRef.current = L.heatLayer(points, {
//             radius: 28,
//             blur: 22,
//             maxZoom: 17,
//             gradient: {
//                 0.0: "#00000000",
//                 0.2: "#ffb3b3",
//                 0.4: "#ff6666",
//                 0.6: "#ff3333",
//                 0.8: "#ff0000",
//                 1.0: "#990000",
//             },
//         });

//         layerRef.current.addTo(map);

//         return () => {
//             if (layerRef.current) {
//                 map.removeLayer(layerRef.current);
//                 layerRef.current = null;
//             }
//         };
//     }, [map, points]);

//     return null;
// }

// function FitToBounds({ bbox }) {
//     const map = useMap();

//     useEffect(() => {
//         const bounds = L.latLngBounds(
//             [bbox.south, bbox.west],
//             [bbox.north, bbox.east]
//         ).pad(0.20);

//         map.fitBounds(bounds, { animate: false });

//         // ✅ fix shifting: invalidate size a few times after layout settles
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
import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON, useMap } from "react-leaflet";
import "leaflet.heat";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

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
            const b2 = Math.round(lerp(A.b, B.b, localT));
            return `rgb(${r}, ${g}, ${b2})`;
        }
    }
    return s[0].c;
}

/**
 * INPUT:
 * - requests: array of requests (must have coordinates + zone_name + status)
 * - bbox: { north, south, east, west } same as your Android LIMIT_BBOX
 * - grid: { rows, cols } same as Android GRID_ROWS/GRID_COLS
 */
export default function AdminGeoMap({
    requests = [],
    bbox = { north: 31.995, south: 31.82, east: 35.315, west: 35.07 },
    grid = { rows: 3, cols: 4 },
}) {
    const center = useMemo(
        () => [(bbox.north + bbox.south) / 2, (bbox.east + bbox.west) / 2],
        [bbox]
    );

    // only OPEN requests for heatmap & zone coloring
    const openRequests = useMemo(() => {
        const OPEN = new Set(["new", "triaged", "assigned", "in_progress"]);
        return (requests || []).filter((r) => OPEN.has(String(r.status || "").toLowerCase()));
    }, [requests]);

    // build heat points from coordinates
    const heatPoints = useMemo(() => {
        return openRequests
            .map((r) => {
                const c = r?.location?.coordinates; // [lat, lng]
                if (!Array.isArray(c) || c.length < 2) return null;
                const lat = Number(c[0]);
                const lng = Number(c[1]);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                return [lat, lng, 0.9]; // intensity
            })
            .filter(Boolean);
    }, [openRequests]);

    // build zone polygons as rectangles
    const zonesGeoJson = useMemo(() => {
        const rows = grid.rows;
        const cols = grid.cols;

        const latMin = bbox.south;
        const latMax = bbox.north;
        const lonMin = bbox.west;
        const lonMax = bbox.east;

        const h = latMax - latMin;
        const w = lonMax - lonMin;

        const features = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellLatMin = latMin + (r * h) / rows;
                const cellLatMax = latMin + ((r + 1) * h) / rows;

                const cellLonMin = lonMin + (c * w) / cols;
                const cellLonMax = lonMin + ((c + 1) * w) / cols;

                const zoneName = `ZONE-R${r + 1}-C${c + 1}`;

                // GeoJSON polygon uses [lng, lat]
                const coords = [
                    [
                        [cellLonMin, cellLatMax],
                        [cellLonMax, cellLatMax],
                        [cellLonMax, cellLatMin],
                        [cellLonMin, cellLatMin],
                        [cellLonMin, cellLatMax],
                    ],
                ];

                features.push({
                    type: "Feature",
                    properties: { zone: zoneName },
                    geometry: { type: "Polygon", coordinates: coords },
                });
            }
        }

        return { type: "FeatureCollection", features };
    }, [bbox, grid]);

    // count open requests per zone
    const openCountByZone = useMemo(() => {
        const map = new Map();
        for (const r of openRequests) {
            const z = r.zone_name || r.zoneName || r.zone;
            if (!z) continue;
            map.set(z, (map.get(z) || 0) + 1);
        }
        return map;
    }, [openRequests]);

    // for coloring: find max
    const maxOpen = useMemo(() => {
        let m = 0;
        for (const v of openCountByZone.values()) m = Math.max(m, v);
        return m || 1;
    }, [openCountByZone]);

    // ✅ temperature-style legend colors (blue → green → yellow → orange → red)
    const legendStops = useMemo(
        () => [
            { t: 0.0, c: "#2563eb" }, // blue
            { t: 0.25, c: "#22c55e" }, // green
            { t: 0.5, c: "#facc15" }, // yellow
            { t: 0.75, c: "#f97316" }, // orange
            { t: 1.0, c: "#ef4444" }, // red
        ],
        []
    );

    const zoneFill = (t) => colorRamp(legendStops, t);

    return (
        <div
            style={{
                // height: 520,
                // borderRadius: 16,
                // overflow: "hidden",
                // border: "1px solid rgba(15,23,42,0.08)",
                // position: "relative",
                // background: "#0b1220",
                height: 520,
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(15,23,42,0.08)",
                position: "relative", // ✅ add this line
                isolation: "isolate",     // ✅ new
                contain: "layout paint",  // ✅ new
            }}
        >

            <MapLegend max={maxOpen} stops={legendStops} />

            <MapContainer
                // center={center}
                // style={{ height: "100%", width: "100%" }}
                // dragging={false}
                // scrollWheelZoom={false}
                // doubleClickZoom={false}
                // touchZoom={false}
                // boxZoom={false}
                // keyboard={false}
                // zoomControl={false}
                style={{ height: "100%", width: "100%" }}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
                zoomControl={false}
            >
                <FitToBounds bbox={bbox} />

                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                />

                {/* Heatmap overlay (same colors as legend) */}
                <HeatLayer points={heatPoints} gradientStops={legendStops} />

                {/* Zones colored by open count using heat colors */}
                <GeoJSON
                    data={zonesGeoJson}
                    style={(feature) => {
                        const zone = feature?.properties?.zone;
                        const count = openCountByZone.get(zone) || 0;
                        const t = Math.min(1, count / maxOpen);

                        return {
                            weight: 1.2,
                            color: "rgba(255,255,255,0.14)", // subtle borders
                            fillColor: zoneFill(t),
                            fillOpacity: 0.18 + 0.42 * t,
                        };
                    }}
                    onEachFeature={(feature, layer) => {
                        const zone = feature?.properties?.zone;
                        const count = openCountByZone.get(zone) || 0;
                        layer.bindTooltip(`${zone} • Open: ${count}`, { sticky: true });
                    }}
                />

                {/* Marker clustering */}
                <MarkerClusterGroup chunkedLoading>
                    {openRequests.map((r) => {
                        const c = r?.location?.coordinates;
                        if (!Array.isArray(c) || c.length < 2) return null;
                        const lat = Number(c[0]);
                        const lng = Number(c[1]);
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

                        return (
                            <CircleMarker
                                key={r.request_id}
                                center={[lat, lng]}
                                radius={6}
                                pathOptions={{
                                    color: "rgba(255,255,255,0.8)",
                                    fillColor: "rgba(239,68,68,1)",
                                    weight: 1.5,
                                    opacity: 0.9,
                                    fillOpacity: 0.25,
                                }}
                            >
                                <Tooltip>
                                    <div style={{ display: "grid", gap: 2 }}>
                                        <b>{r.request_id}</b>
                                        <span>Status: {String(r.status || "").replace("_", " ")}</span>
                                        <span>Zone: {r.zone_name || "—"}</span>
                                    </div>
                                </Tooltip>
                            </CircleMarker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
}

/** ✅ Legend overlay */
function MapLegend({ max, stops }) {
    const bar = `linear-gradient(to right, ${stops.map((s) => `${s.c} ${Math.round(s.t * 100)}%`).join(", ")})`;

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

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                <span>0</span>
                <span>{max}</span>
            </div>
        </div>
    );
}

/** Leaflet heat layer bridge */
function HeatLayer({ points, gradientStops }) {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }

        if (!points || points.length === 0) return;

        const gradient = { 0.0: "rgba(0,0,0,0)" };
        (gradientStops || []).forEach((s) => {
            gradient[Number(s.t).toFixed(2)] = s.c;
        });

        layerRef.current = L.heatLayer(points, {
            radius: 32,
            blur: 26,
            maxZoom: 17,
            minOpacity: 0.25,
            gradient,
        });

        layerRef.current.addTo(map);

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, points, gradientStops]);

    return null;
}

function FitToBounds({ bbox }) {
    const map = useMap();

    useEffect(() => {
        const bounds = L.latLngBounds([bbox.south, bbox.west], [bbox.north, bbox.east]).pad(0.2);
        map.fitBounds(bounds, { animate: false });

        // prevent shifting
        const t1 = setTimeout(() => map.invalidateSize(false), 50);
        const t2 = setTimeout(() => map.invalidateSize(false), 200);
        const t3 = setTimeout(() => map.invalidateSize(false), 600);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [map, bbox]);

    return null;
}
