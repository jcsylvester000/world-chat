"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { formatPeso } from "@/lib/utils";
import type { Property } from "@/lib/types";

// Fix Leaflet's default marker icons, which break under bundlers
// because the image paths are resolved relative to the CSS.
const DefaultIcon = L.icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Recenters the map when `focusId` changes (hovering a card flies to
// its marker).
function FocusController({
  properties,
  focusId,
}: {
  properties: Property[];
  focusId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusId) return;
    const target = properties.find((p) => p.id === focusId);
    if (target) {
      map.flyTo([target.latitude, target.longitude], 14, { duration: 0.8 });
    }
  }, [focusId, properties, map]);
  return null;
}

// Fit all markers into view when not focusing a single property, so markers
// are never off-screen behind the default Manila center.
function BoundsController({
  properties,
  focusId,
}: {
  properties: Property[];
  focusId: string | null;
}) {
  const map = useMap();
  const lastSig = useRef("");
  useEffect(() => {
    if (focusId || properties.length === 0) return;
    // Only re-fit when the actual set of markers changes, so typing in a
    // search box (which re-renders with a new array reference) doesn't snap
    // the map on every keystroke.
    const sig = properties.map((p) => p.id).join("|");
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    const points: [number, number][] = properties.map((p) => [p.latitude, p.longitude]);
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    }
  }, [properties, focusId, map]);
  return null;
}

export default function PropertyMap({
  properties,
  focusId = null,
  onMarkerClick,
}: {
  properties: Property[];
  focusId?: string | null;
  onMarkerClick?: (id: string) => void;
}) {
  return (
    <MapContainer
      center={DEFAULT_MAP_CENTER}
      zoom={DEFAULT_MAP_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]}>
          <Popup>
            <div className="min-w-[160px]">
              {p.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photos[0]}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="mb-2 h-20 w-full rounded object-cover"
                />
              )}
              <strong className="block text-sm">{p.title}</strong>
              <span className="text-xs text-slate-500">{p.location}</span>
              <div className="mt-1 text-sm font-semibold">
                {p.showPrice ? formatPeso(p.price) : "Price on request"}
              </div>
              {onMarkerClick && (
                <button
                  onClick={() => onMarkerClick(p.id)}
                  className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white"
                >
                  View details
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      <FocusController properties={properties} focusId={focusId} />
      <BoundsController properties={properties} focusId={focusId} />
    </MapContainer>
  );
}
