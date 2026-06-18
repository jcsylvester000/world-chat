"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import Modal from "@/components/Modal";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore } from "@/lib/store/chat-store";
import { captureLeafletMap } from "@/lib/map/capture";
import { displayName } from "@/lib/utils";

const COLORS = ["#ef4444", "#2563eb", "#eab308", "#22c55e", "#111827", "#ffffff"];
const SIZES = [3, 6, 11];

interface Stroke { color: string; size: number; pts: { x: number; y: number }[] }

export default function MapSnapshotControl({
  getMap,
  markers,
}: {
  getMap: () => LeafletMap | null;
  markers: { lat: number; lng: number }[];
}) {
  const user = useAuthStore((s) => s.user);
  const groups = useChatStore((s) => s.groups);
  const threads = useChatStore((s) => s.threads);
  const activeTarget = useChatStore((s) => s.activeTarget);
  const sendWorld = useChatStore((s) => s.sendWorld);
  const sendDirect = useChatStore((s) => s.sendDirect);
  const sendGroupMessage = useChatStore((s) => s.sendGroupMessage);
  const fetchGroups = useChatStore((s) => s.fetchGroups);
  const fetchThreads = useChatStore((s) => s.fetchThreads);

  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [caption, setCaption] = useState("");
  const [dest, setDest] = useState("world");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const snapRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);

  const canWorld = !!user && (user.plan === "premium" || user.isAdmin);

  const options = useMemo(() => {
    const list: { key: string; label: string; disabled?: boolean }[] = [
      { key: "world", label: canWorld ? "🌐 World chat" : "🌐 World chat (Premium only)", disabled: !canWorld },
    ];
    groups.forEach((g) => list.push({ key: "group:" + g.id, label: "👥 " + g.name }));
    threads.forEach((t) => {
      const otherEmail = t.participantEmails[t.participantIds[0] === user?.id ? 1 : 0];
      list.push({ key: "dm:" + t.id, label: "💬 " + displayName(otherEmail) });
    });
    return list;
  }, [groups, threads, user?.id, canWorld]);

  const defaultDest = () => {
    if (activeTarget?.kind === "world" && canWorld) return "world";
    if (activeTarget?.kind === "dm") return "dm:" + activeTarget.threadId;
    if (activeTarget?.kind === "group") return "group:" + activeTarget.groupId;
    if (canWorld) return "world";
    const first = options.find((o) => !o.disabled);
    return first?.key ?? "world";
  };

  const redraw = () => {
    const view = viewRef.current;
    const snap = snapRef.current;
    if (!view || !snap) return;
    const ctx = view.getContext("2d")!;
    ctx.clearRect(0, 0, view.width, view.height);
    ctx.drawImage(snap, 0, 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const st of strokesRef.current) {
      ctx.strokeStyle = st.color;
      ctx.lineWidth = st.size;
      ctx.beginPath();
      st.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (!open) return;
    if (viewRef.current && snapRef.current) {
      viewRef.current.width = snapRef.current.width;
      viewRef.current.height = snapRef.current.height;
      strokesRef.current = [];
      drawingRef.current = null;
      redraw();
    }
    setCaption("");
    setDest(defaultDest());
    if (user) {
      if (groups.length === 0) fetchGroups(user.id);
      if (threads.length === 0) fetchThreads(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const snapshot = async () => {
    const map = getMap();
    if (!map) return;
    setBusy(true);
    setFlash(null);
    try {
      snapRef.current = await captureLeafletMap(map, markers);
      setOpen(true);
    } catch {
      setFlash("Couldn't capture the map. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const toCanvasPoint = (e: React.PointerEvent) => {
    const c = viewRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drawingRef.current = { color, size, pts: [toCanvasPoint(e)] };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current.pts.push(toCanvasPoint(e));
    const ctx = viewRef.current!.getContext("2d")!;
    ctx.strokeStyle = drawingRef.current.color;
    ctx.lineWidth = drawingRef.current.size;
    ctx.lineJoin = ctx.lineCap = "round";
    const pts = drawingRef.current.pts;
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  };
  const onUp = () => {
    if (drawingRef.current && drawingRef.current.pts.length > 1) strokesRef.current.push(drawingRef.current);
    drawingRef.current = null;
  };
  const undo = () => { strokesRef.current.pop(); redraw(); };
  const clear = () => { strokesRef.current = []; redraw(); };

  const dataUrl = () => viewRef.current?.toDataURL("image/png") ?? "";
  const download = () => {
    const a = document.createElement("a");
    a.href = dataUrl();
    a.download = "map-snapshot.png";
    a.click();
  };

  const sendOne = async (content: string, opts?: { contentType?: "image"; filename?: string }) => {
    if (!user) throw new Error("You need to be signed in.");
    if (dest === "world") return sendWorld(user, content, opts);
    if (dest.startsWith("group:")) return sendGroupMessage(dest.slice(6), user, content, opts);
    if (dest.startsWith("dm:")) return sendDirect(dest.slice(3), user, content, opts);
    throw new Error("Pick a destination first.");
  };

  const send = async () => {
    setSending(true);
    setFlash(null);
    try {
      await sendOne(dataUrl(), { contentType: "image", filename: "map-snapshot.png" });
      if (caption.trim()) await sendOne(caption.trim());
      setOpen(false);
      setFlash("Sent to chat ✓");
      setTimeout(() => setFlash(null), 2500);
    } catch (e) {
      setFlash((e as Error).message || "Couldn't send.");
    } finally {
      setSending(false);
    }
  };

  const selectedDisabled = options.find((o) => o.key === dest)?.disabled;

  return (
    <>
      <button
        onClick={snapshot}
        disabled={busy}
        title="Snapshot the map, annotate, and send to chat"
        className="absolute right-2 top-2 z-[1000] inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-ink shadow-md ring-1 ring-line backdrop-blur hover:bg-white"
      >
        {busy ? "Capturing…" : "📷 Snapshot"}
      </button>
      {flash && !open && (
        <span className="absolute right-2 top-12 z-[1000] rounded bg-emerald-600 px-2 py-0.5 text-xs text-white shadow">{flash}</span>
      )}

      {open && (
        <Modal onClose={() => setOpen(false)} className="!max-w-3xl">
          <h3 className="mb-3 text-lg font-bold">Annotate & send</h3>

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} title="Pen colour"
                  className={`h-6 w-6 rounded-full ring-2 ${color === c ? "ring-ink" : "ring-line"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {SIZES.map((sz) => (
                <button key={sz} onClick={() => setSize(sz)}
                  className={`grid h-7 w-7 place-items-center rounded-lg border ${size === sz ? "border-primary bg-primary-50" : "border-line"}`} title="Brush size">
                  <span className="rounded-full bg-ink" style={{ width: sz, height: sz }} />
                </button>
              ))}
            </div>
            <button onClick={undo} className="btn-outline !px-2.5 !py-1 text-xs">↶ Undo</button>
            <button onClick={clear} className="btn-outline !px-2.5 !py-1 text-xs">Clear</button>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-slate-100">
            <canvas
              ref={viewRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
              className="block h-auto w-full cursor-crosshair touch-none"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Draw on the snapshot to emphasize an area.</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Send to</label>
              <select className="input" value={dest} onChange={(e) => setDest(e.target.value)}>
                {options.map((o) => (
                  <option key={o.key} value={o.key} disabled={o.disabled}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Caption <span className="font-normal text-slate-400">(optional)</span></label>
              <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a note with the image…" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {flash && <span className="mr-auto text-xs text-rose-500">{flash}</span>}
            <button onClick={download} className="btn-outline !px-3 !py-1.5 text-sm">Download</button>
            <button onClick={() => setOpen(false)} className="btn-outline !px-3 !py-1.5 text-sm">Cancel</button>
            <button onClick={send} disabled={sending || selectedDisabled} className="btn-primary !px-3 !py-1.5 text-sm">
              {sending ? "Sending…" : "Send to chat"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
