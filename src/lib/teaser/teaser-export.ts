// Property Teaser export — renders the teaser to an offscreen <canvas> using
// only same-origin / data-URL images (uploaded photos + a proxied static map),
// then exports that canvas as PNG or as a (possibly multi-page) PDF. No
// external screenshot library and no canvas-taint issues.
import type { NearbyResult } from "@/lib/teaser/overpass";

export interface TeaserData {
  brand: string;
  name: string;
  tags: string[];
  photos: string[];
  priceText: string;
  address: string;
  lat: number;
  lng: number;
  hideLocation: boolean;
  description: string;
  lotSize: string;
  floorNotes: string;
  nearby: NearbyResult | null;
}

const INK = "#0f172a";
const SUB = "#64748b";
const ACCENT = "#0284c7";
const LINE = "#e2e8f0";
const W = 820;
const P = 40;

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

export async function fetchMapDataUrl(lat: number, lng: number, zoom = 14): Promise<string | null> {
  try {
    const res = await fetch(`/api/teaser/staticmap?lat=${lat}&lng=${lng}&zoom=${zoom}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawCover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = im.width / im.height;
  const r = w / h;
  let sx = 0, sy = 0, sw = im.width, sh = im.height;
  if (ir > r) { sw = im.height * r; sx = (im.width - sw) / 2; }
  else { sh = im.width / r; sy = (im.height - sh) / 2; }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = LINE;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

export async function renderTeaserCanvas(data: TeaserData): Promise<HTMLCanvasElement> {
  // Preload images first.
  const photos: HTMLImageElement[] = [];
  for (const p of data.photos.slice(0, 5)) {
    try { photos.push(await loadImg(p)); } catch { /* skip broken */ }
  }
  let mapImg: HTMLImageElement | null = null;
  if (!data.hideLocation && Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
    const url = await fetchMapDataUrl(data.lat, data.lng);
    if (url) { try { mapImg = await loadImg(url); } catch { mapImg = null; } }
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = 4000; // generous; cropped at the end
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.textBaseline = "top";

  let y = P;
  const innerW = W - P * 2;

  const setFont = (px: number, weight = "400") => (ctx.font = `${weight} ${px}px Arial, sans-serif`);
  const wrap = (text: string, x: number, maxW: number, lh: number, color = INK): void => {
    ctx.fillStyle = color;
    for (const para of (text || "").split("\n")) {
      const words = para.split(/\s+/);
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; }
        else line = test;
      }
      ctx.fillText(line, x, y);
      y += lh;
    }
  };
  const heading = (label: string) => {
    y += 8;
    setFont(11, "700");
    ctx.fillStyle = SUB;
    ctx.fillText(label.toUpperCase(), P, y);
    y += 16;
  };

  // Brand header
  setFont(26, "800");
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "center";
  ctx.fillText(data.brand || "WorldChat", W / 2, y);
  y += 32;
  setFont(11, "700");
  ctx.fillStyle = SUB;
  ctx.fillText("P R O P E R T Y   T E A S E R", W / 2, y);
  ctx.textAlign = "left";
  y += 24;
  ctx.strokeStyle = LINE;
  ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke();
  y += 18;

  // Title
  setFont(24, "800");
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  {
    const words = (data.name || "Untitled Listing").split(/\s+/);
    let line = ""; const lines: string[] = [];
    for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > innerW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    for (const l of lines) { ctx.fillText(l, W / 2, y); y += 30; }
  }
  ctx.textAlign = "left";
  y += 4;

  // Tags pills
  if (data.tags.length) {
    setFont(12, "600");
    let x = P;
    for (const tag of data.tags) {
      const tw = ctx.measureText(tag).width + 20;
      if (x + tw > W - P) { x = P; y += 28; }
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, tw, 22, 11);
      else ctx.rect(x, y, tw, 22);
      ctx.fill();
      ctx.fillStyle = ACCENT;
      ctx.fillText(tag, x + 10, y + 5);
      x += tw + 8;
    }
    y += 34;
  }

  // Price
  heading("Price");
  setFont(20, "800");
  ctx.fillStyle = INK;
  ctx.fillText(data.priceText || "Price on request", P, y);
  y += 30;

  // Photos
  if (photos.length) {
    heading("Property Pictures");
    const gap = 10;
    const perRow = photos.length === 1 ? 1 : photos.length <= 4 ? 2 : 3;
    const cw = (innerW - gap * (perRow - 1)) / perRow;
    const ch = perRow === 1 ? 320 : 150;
    let x = P, col = 0;
    for (const im of photos) {
      drawCover(ctx, im, x, y, cw, ch);
      col++;
      if (col >= perRow) { col = 0; x = P; y += ch + gap; } else x += cw + gap;
    }
    if (col !== 0) y += ch + gap;
    y += 4;
  }

  // Address
  heading("Address");
  setFont(14, "400");
  wrap(data.address || "—", P, innerW, 20);

  // Location
  if (!data.hideLocation) {
    heading("Location");
    setFont(13, "400");
    ctx.fillStyle = SUB;
    ctx.fillText(`Lat ${data.lat.toFixed(4)}, Lng ${data.lng.toFixed(4)}`, P, y);
    y += 22;
    if (mapImg) {
      const mw = Math.min(600, innerW);
      const mh = Math.round((mw / 600) * 320);
      drawCover(ctx, mapImg, P, y, mw, mh);
      y += mh + 8;
    }
  }

  // Description
  heading("Description");
  setFont(14, "400");
  wrap(data.description || "—", P, innerW, 20);

  // Lot size + floor notes
  heading("Lot Size");
  setFont(14, "400");
  wrap(data.lotSize || "—", P, innerW, 20);
  heading("Floor Area Notes");
  setFont(14, "400");
  wrap(data.floorNotes || "—", P, innerW, 20);

  // Nearby
  heading("Areas Nearby");
  setFont(13, "400");
  if (!data.nearby || data.nearby.summary.length === 0) {
    ctx.fillStyle = SUB;
    ctx.fillText("No nearby areas fetched.", P, y);
    y += 20;
  } else {
    for (const s of data.nearby.summary) {
      ctx.fillStyle = INK;
      setFont(13, "700");
      ctx.fillText(`${s.label}: ${s.count}`, P, y);
      const top = data.nearby.details.filter((d) => d.category === s.key).slice(0, 3)
        .map((d) => `${d.name} (${d.distanceM} m)`).join(" · ");
      if (top) {
        setFont(12, "400");
        ctx.fillStyle = SUB;
        const lx = P + ctx.measureText(`${s.label}: ${s.count}   `).width;
        ctx.fillText(top, lx, y);
      }
      y += 20;
    }
  }

  // Footer
  y += 12;
  ctx.strokeStyle = LINE;
  ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke();
  y += 10;
  setFont(11, "400");
  ctx.fillStyle = SUB;
  ctx.fillText(`Generated ${new Date().toLocaleDateString()} · via WorldChat`, P, y);
  y += 20;

  // Crop to content
  const finalH = Math.min(canvas.height, y + P);
  const out = document.createElement("canvas");
  out.width = W;
  out.height = finalH;
  const octx = out.getContext("2d")!;
  octx.drawImage(canvas, 0, 0);
  return out;
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const slug = (s: string) => (s || "teaser").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "teaser";

export async function exportTeaserPng(data: TeaserData): Promise<void> {
  const canvas = await renderTeaserCanvas(data);
  triggerDownload(canvas.toDataURL("image/png"), `${slug(data.name)}-teaser.png`);
}

export async function exportTeaserPdf(data: TeaserData): Promise<void> {
  const canvas = await renderTeaserCanvas(data);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgW = pageW - margin * 2;
  const scale = imgW / canvas.width;
  const pageCanvasH = Math.floor((pageH - margin * 2) / scale);
  let sy = 0;
  let first = true;
  while (sy < canvas.height) {
    const sliceH = Math.min(pageCanvasH, canvas.height - sy);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    slice.getContext("2d")!.drawImage(canvas, 0, sy, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    if (!first) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/png"), "PNG", margin, margin, imgW, sliceH * scale);
    sy += sliceH;
    first = false;
  }
  pdf.save(`${slug(data.name)}-teaser.pdf`);
}
