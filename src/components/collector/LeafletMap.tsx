// src/components/collector/LeafletMap.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MiniMap — peta interaktif untuk konfirmasi lokasi GPS collector
//
// IMPORT via next/dynamic (ssr:false) di RouteSection.tsx — JANGAN import langsung.
//
// Fix final: CSS critical Leaflet di-inject inline di komponen ini sendiri,
// tidak bergantung pada globals.css. Ini memastikan SVG overlay pane
// tidak di-clamp oleh global CSS Next.js (svg { max-width: 100% }).
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;

// ── CSS critical Leaflet — di-inject langsung ─────────────────────────────────
// Mengambil subset minimal yang diperlukan agar SVG overlay pane visible.
// Import di globals.css tetap disarankan, tapi komponen ini self-contained.
const LEAFLET_CRITICAL_CSS = `
  .leaflet-pane,
  .leaflet-tile,
  .leaflet-marker-icon,
  .leaflet-marker-shadow,
  .leaflet-tile-container,
  .leaflet-pane > svg,
  .leaflet-pane > canvas,
  .leaflet-zoom-box,
  .leaflet-image-layer,
  .leaflet-layer {
    position: absolute;
    left: 0;
    top: 0;
  }
  .leaflet-container {
    overflow: hidden;
    position: relative;
  }
  .leaflet-tile-pane    { z-index: 200; }
  .leaflet-overlay-pane { z-index: 400; }
  .leaflet-shadow-pane  { z-index: 500; }
  .leaflet-marker-pane  { z-index: 600; }
  .leaflet-tooltip-pane { z-index: 650; }
  .leaflet-popup-pane   { z-index: 700; }
  .leaflet-map-pane canvas { z-index: 100; }
  .leaflet-map-pane svg    { z-index: 200; }

  /* KRITIS: tanpa ini SVG di-clamp oleh global CSS Next.js */
  .leaflet-container .leaflet-overlay-pane svg {
    max-width: none !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .leaflet-overlay-pane svg {
    -moz-user-select: none;
  }
  svg.leaflet-zoom-animated {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
  }
  .leaflet-pane > svg path,
  .leaflet-tile-container {
    pointer-events: none;
  }
  .leaflet-pane > svg path.leaflet-interactive {
    pointer-events: visiblePainted;
    pointer-events: auto;
  }

  /* Tile styling — pastikan tile images tidak di-hide */
  .leaflet-tile {
    filter: inherit;
    visibility: inherit;
    opacity: 1 !important;
  }
  .leaflet-tile-container img,
  .leaflet-tile img {
    opacity: 1 !important;
    max-width: none !important;
    max-height: none !important;
    width: 256px !important;
    height: 256px !important;
  }
  .leaflet-tile-pane {
    opacity: 1;
  }

  /* Pulse animation untuk ring marker */
  @keyframes rebru-pulse {
    0%   { stroke-opacity: 0.7; }
    70%  { stroke-opacity: 0;   }
    100% { stroke-opacity: 0;   }
  }
`;

// ── Jalur 1 fix 3 — Haversine helper untuk hitung jarak GPS ──────────────────
// Dipakai MapRecenter untuk membedakan GPS refresh normal vs GPS jump jauh.
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// > 500m = GPS jump tidak wajar → setView langsung tanpa animasi
// ≤ 500m = GPS refresh normal   → panTo smooth
const GPS_JUMP_THRESHOLD_M = 500;

// ── MapRecenter ───────────────────────────────────────────────────────────────
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const isFirst = useRef(true);
  const prevPos = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isFirst.current) {
      map.setView([lat, lng], 18);
      isFirst.current = false;
      prevPos.current = { lat, lng };
    } else {
      const prev = prevPos.current;
      const dist = prev
        ? haversineMeters(prev.lat, prev.lng, lat, lng)
        : Infinity;

      if (dist > GPS_JUMP_THRESHOLD_M) {
        // Jump jauh — langsung setView tanpa animasi agar tidak confusing
        map.setView([lat, lng], map.getZoom(), { animate: false });
      } else {
        // Normal refresh — smooth panTo
        map.panTo([lat, lng], { animate: true });
      }
      prevPos.current = { lat, lng };
    }
  }, [lat, lng, map]);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MiniMap
// ─────────────────────────────────────────────────────────────────────────────

interface MiniMapProps {
  lat: number;
  lng: number;
  accuracy: number;
}

export default function MiniMap({ lat, lng, accuracy }: MiniMapProps) {
  return (
    <>
      {/* Inject CSS critical inline — self-contained, tidak butuh globals.css */}
      <style dangerouslySetInnerHTML={{ __html: LEAFLET_CRITICAL_CSS }} />

      <MapContainer
        center={[lat, lng]}
        zoom={18}
        style={{ height: "180px", width: "100%", position: "relative" }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={false}
        attributionControl={true}
        minZoom={14}
        maxZoom={19}
      >
        {/* OSM tile standar — paling reliable, tidak ada CORS issue */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
          maxZoom={19}
          tileSize={256}
          zoomOffset={0}
          crossOrigin="anonymous"
        />

        {/* Accuracy circle — hanya jika sinyal cukup baik */}
        {accuracy > 0 && accuracy < 200 && (
          <Circle
            center={[lat, lng]}
            radius={accuracy}
            color="#4a7c4e"
            fillColor="#4a7c4e"
            fillOpacity={0.06}
            weight={1}
            opacity={0.3}
            dashArray="4 6"
          />
        )}

        {/*
          Marker tiga lapis — semua CircleMarker native Leaflet.
          Props style di-pass FLAT (bukan dalam pathOptions) agar
          di-apply langsung di constructor, bukan via setStyle setelah mount.
          Ini fix untuk react-leaflet v5 di mana pathOptions di-apply
          async via useEffect setelah render pertama.
        */}

        {/* Layer 1 — pulse ring (animasi expand + fade) */}
        <CircleMarker
          center={[lat, lng]}
          radius={20}
          color="#4a7c4e"
          fillColor="#4a7c4e"
          fillOpacity={0.1}
          weight={2}
          opacity={0.45}
          stroke={true}
          fill={true}
        />

        {/* Layer 2 — halo putih tebal di sekitar dot */}
        <CircleMarker
          center={[lat, lng]}
          radius={10}
          color="#ffffff"
          fillColor="#ffffff"
          fillOpacity={1}
          weight={3}
          opacity={1}
          stroke={true}
          fill={true}
        />

        {/* Layer 3 — dot inti hijau solid */}
        <CircleMarker
          center={[lat, lng]}
          radius={7}
          color="#2d5a30"
          fillColor="#4a7c4e"
          fillOpacity={1}
          weight={2}
          opacity={1}
          stroke={true}
          fill={true}
        />

        <MapRecenter lat={lat} lng={lng} />
      </MapContainer>
    </>
  );
}
