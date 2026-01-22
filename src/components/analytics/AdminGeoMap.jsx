import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON, useMap } from "react-leaflet";
import "leaflet.heat";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

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
    const center = useMemo(() => [(bbox.north + bbox.south) / 2, (bbox.east + bbox.west) / 2], [bbox]);

    // only OPEN requests for heatmap & zone coloring (adjust statuses as you want)
    const openRequests = useMemo(() => {
        const OPEN = new Set(["new", "triaged", "assigned", "in_progress"]);
        return (requests || []).filter((r) => OPEN.has(String(r.status || "").toLowerCase()));
    }, [requests]);

    // build heat points from coordinates
    const heatPoints = useMemo(() => {
        return openRequests
            .map((r) => {
                const c = r?.location?.coordinates; // [lat, lng] (your modal shows it as [0],[1])
                if (!Array.isArray(c) || c.length < 2) return null;
                const lat = Number(c[0]);
                const lng = Number(c[1]);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                return [lat, lng, 0.8]; // intensity
            })
            .filter(Boolean);
    }, [openRequests]);

    const bounds = [
        [bbox.south, bbox.west],
        [bbox.north, bbox.east],
    ];

    // build zone polygons as rectangles (same logic as your Android grid zones)
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
            const z = r.zone_name || r.zoneName || r.zone; // be flexible
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

    return (
        <div
            style={{
                height: 520,
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(15,23,42,0.08)",
                position: "relative", // ✅ add this line
                isolation: "isolate",     // ✅ new
                contain: "layout paint",  // ✅ new
            }}
        >            <MapContainer center={center}
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
                {/* Heatmap overlay */}
                <HeatLayer points={heatPoints} />
                {/* Zone layer (choropleth-like) */}
                <GeoJSON
                    data={zonesGeoJson}
                    style={(feature) => {
                        const zone = feature?.properties?.zone;
                        const count = openCountByZone.get(zone) || 0;
                        const t = Math.min(1, count / maxOpen); // 0..1

                        // darker red when more open requests
                        const fillOpacity = 0.08 + 0.40 * t;

                        return {
                            weight: 1.2,
                            color: "rgba(220,38,38,0.45)",          // red border
                            fillColor: "rgba(220,38,38,1)",         // RED fill (instead of blue)
                            fillOpacity,
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
                                    color: "rgba(220,38,38,0.9)",      // stroke red
                                    fillColor: "rgba(220,38,38,1)",    // fill red
                                    weight: 2,
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

/** Leaflet heat layer bridge */
function HeatLayer({ points }) {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }

        if (!points || points.length === 0) return;

        layerRef.current = L.heatLayer(points, {
            radius: 28,
            blur: 22,
            maxZoom: 17,
            gradient: {
                0.0: "#00000000",
                0.2: "#ffb3b3",
                0.4: "#ff6666",
                0.6: "#ff3333",
                0.8: "#ff0000",
                1.0: "#990000",
            },
        });

        layerRef.current.addTo(map);

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, points]);

    return null;
}

function FitToBounds({ bbox }) {
    const map = useMap();

    useEffect(() => {
        const bounds = L.latLngBounds(
            [bbox.south, bbox.west],
            [bbox.north, bbox.east]
        ).pad(0.20);

        map.fitBounds(bounds, { animate: false });

        // ✅ fix shifting: invalidate size a few times after layout settles
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

