// Capture the current Leaflet map view to a canvas WITHOUT a screenshot library.
// We reconstruct the view from Leaflet's projection: re-load the visible OSM
// tiles (which send CORS headers, so the canvas isn't tainted) and draw the
// property pins on top. The result can be exported to PNG and sent to chat.
import type { Map as LeafletMap } from "leaflet";

const TILE = 256;

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "#2563eb";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 13, 7, Math.PI, 0, false);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - 13, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

export async function captureLeafletMap(
  map: LeafletMap,
  markers: { lat: number; lng: number }[] = []
): Promise<HTMLCanvasElement> {
  const size = map.getSize();
  const zoom = Math.round(map.getZoom());
  const bounds = map.getPixelBounds();
  const min = bounds.min!;
  const max = bounds.max!;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(size.x));
  canvas.height = Math.max(1, Math.round(size.y));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#aadaff"; // water-tone fallback while/if a tile is missing
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const span = Math.pow(2, zoom);
  const xMin = Math.floor(min.x / TILE);
  const xMax = Math.floor(max.x / TILE);
  const yMin = Math.floor(min.y / TILE);
  const yMax = Math.floor(max.y / TILE);

  const loads: Promise<void>[] = [];
  for (let tx = xMin; tx <= xMax; tx++) {
    for (let ty = yMin; ty <= yMax; ty++) {
      if (ty < 0 || ty >= span) continue;
      const wx = ((tx % span) + span) % span; // wrap horizontally
      const dx = Math.round(tx * TILE - min.x);
      const dy = Math.round(ty * TILE - min.y);
      const url = `https://tile.openstreetmap.org/${zoom}/${wx}/${ty}.png`;
      loads.push(
        new Promise<void>((resolve) => {
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.onload = () => {
            try { ctx.drawImage(im, dx, dy, TILE, TILE); } catch { /* ignore */ }
            resolve();
          };
          im.onerror = () => resolve();
          im.src = url;
        })
      );
    }
  }
  await Promise.all(loads);

  for (const m of markers) {
    try {
      const pt = map.latLngToContainerPoint([m.lat, m.lng]);
      if (pt.x >= -20 && pt.x <= canvas.width + 20 && pt.y >= -20 && pt.y <= canvas.height + 20) {
        drawPin(ctx, pt.x, pt.y);
      }
    } catch {
      /* ignore projection errors */
    }
  }

  // subtle OSM attribution so exported images credit the source
  ctx.save();
  ctx.font = "10px Arial, sans-serif";
  const label = "© OpenStreetMap";
  const w = ctx.measureText(label).width + 8;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(canvas.width - w, canvas.height - 14, w, 14);
  ctx.fillStyle = "#475569";
  ctx.fillText(label, canvas.width - w + 4, canvas.height - 3);
  ctx.restore();

  return canvas;
}
