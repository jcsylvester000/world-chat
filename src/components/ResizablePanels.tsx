"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LayoutPanel {
  id: string;
  title: string;
  mobileClass?: string; // height on stacked (mobile) layout
  render: () => ReactNode;
}

interface Persisted {
  order: string[];
  weights: Record<string, number>;
  collapsed: string[];
}

const MIN_PX = 160; // smallest a panel can be dragged to

// A resizable / reorderable / collapsible row of panels. On large screens the
// dividers can be dragged to resize, the ◀ ▶ buttons reorder, and – collapses a
// panel to a slim rail. The whole layout is saved to localStorage so it sticks.
// On small screens the panels simply stack (ordering still applies).
export default function ResizablePanels({
  storageKey,
  panels,
  defaultOrder,
}: {
  storageKey: string;
  panels: LayoutPanel[];
  defaultOrder: string[];
}) {
  const ids = panels.map((p) => p.id);
  const makeDefault = (): Persisted => ({
    order: [...defaultOrder.filter((id) => ids.includes(id)), ...ids.filter((id) => !defaultOrder.includes(id))],
    weights: Object.fromEntries(ids.map((id) => [id, 1])),
    collapsed: [],
  });
  const [layout, setLayout] = useState<Persisted>(makeDefault);
  const rowRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<Persisted>(layout);
  liveRef.current = layout;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        const order = [
          ...(p.order ?? []).filter((id) => ids.includes(id)),
          ...ids.filter((id) => !(p.order ?? []).includes(id)),
        ];
        const weights = Object.fromEntries(ids.map((id) => [id, p.weights?.[id] ?? 1]));
        const collapsed = (p.collapsed ?? []).filter((id) => ids.includes(id));
        setLayout({ order, weights, collapsed });
      }
    } catch {
      /* ignore corrupt layout */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = (next: Persisted) => {
    setLayout(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const byId = (id: string) => panels.find((p) => p.id === id)!;
  const isCollapsed = (id: string) => layout.collapsed.includes(id);

  const move = (id: string, dir: -1 | 1) => {
    const order = [...layout.order];
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    persist({ ...layout, order });
  };
  const toggleCollapse = (id: string) => {
    const collapsed = isCollapsed(id) ? layout.collapsed.filter((x) => x !== id) : [...layout.collapsed, id];
    if (collapsed.length >= layout.order.length) return; // never collapse them all
    persist({ ...layout, collapsed });
  };
  const reset = () => persist(makeDefault());

  const startDrag = (e: React.PointerEvent, leftId: string, rightId: string) => {
    e.preventDefault();
    const row = rowRef.current;
    if (!row) return;
    const leftEl = row.querySelector<HTMLElement>(`[data-panel="${leftId}"]`);
    const rightEl = row.querySelector<HTMLElement>(`[data-panel="${rightId}"]`);
    if (!leftEl || !rightEl) return;
    const lw0 = leftEl.getBoundingClientRect().width;
    const rw0 = rightEl.getBoundingClientRect().width;
    const total = (liveRef.current.weights[leftId] ?? 1) + (liveRef.current.weights[rightId] ?? 1);
    const startX = e.clientX;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const lw = Math.min(Math.max(lw0 + dx, MIN_PX), lw0 + rw0 - MIN_PX);
      const rw = lw0 + rw0 - lw;
      const wl = (total * lw) / (lw + rw);
      const wr = total - wl;
      const base = liveRef.current;
      setLayout({ ...base, weights: { ...base.weights, [leftId]: wl, [rightId]: wr } });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      persist(liveRef.current);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="hidden lg:inline">Drag the dividers to resize · ◀ ▶ to reorder · – to collapse — your layout is saved automatically.</span>
        <span className="lg:hidden">Reorder panels with ◀ ▶ (resize available on larger screens).</span>
        <button onClick={reset} className="shrink-0 rounded px-2 py-0.5 hover:bg-slate-100 hover:text-slate-600">⟲ Reset layout</button>
      </div>

      <div ref={rowRef} className="flex flex-col gap-2 lg:h-[calc(100vh-13rem)] lg:flex-row lg:gap-0">
        {layout.order.map((id, idx) => {
          const p = byId(id);
          const collapsed = isCollapsed(id);
          const nextId = layout.order[idx + 1];
          const showDivider = !!nextId && !collapsed && !isCollapsed(nextId);
          return (
            <Fragment key={id}>
              <div
                data-panel={id}
                className={cn(
                  "flex min-w-0 flex-col gap-1",
                  p.mobileClass ?? "h-[460px]",
                  collapsed ? "lg:h-full lg:w-11 lg:flex-none" : "lg:h-full lg:basis-0"
                )}
                style={collapsed ? undefined : { flexGrow: layout.weights[id] ?? 1 }}
              >
                {/* Collapsed rail (desktop only) */}
                {collapsed && (
                  <div className="hidden h-full flex-col items-center gap-2 rounded-xl border border-line bg-white py-2 shadow-sm lg:flex">
                    <button onClick={() => toggleCollapse(id)} title={`Expand ${p.title}`} className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink">⤢</button>
                    <span className="mt-1 rotate-180 text-xs font-semibold text-slate-500 [writing-mode:vertical-rl]">{p.title}</span>
                  </div>
                )}

                {/* Control bar (hidden on desktop when collapsed) */}
                <div className={cn("flex shrink-0 items-center justify-between gap-1 rounded-lg bg-slate-100/80 px-2 py-1", collapsed && "lg:hidden")}>
                  <span className="truncate text-xs font-semibold text-slate-500">{p.title}</span>
                  <div className="flex items-center gap-0.5 text-slate-400">
                    <button onClick={() => move(id, -1)} disabled={idx === 0} title="Move left" className="grid h-5 w-5 place-items-center rounded hover:bg-white hover:text-ink disabled:opacity-30">◀</button>
                    <button onClick={() => move(id, 1)} disabled={idx === layout.order.length - 1} title="Move right" className="grid h-5 w-5 place-items-center rounded hover:bg-white hover:text-ink disabled:opacity-30">▶</button>
                    <button onClick={() => toggleCollapse(id)} title="Collapse" className="hidden h-5 w-5 place-items-center rounded hover:bg-white hover:text-ink lg:grid">–</button>
                  </div>
                </div>

                {/* Panel content (hidden on desktop when collapsed) */}
                <div className={cn("min-h-0 flex-1 overflow-hidden", collapsed && "lg:hidden")}>{p.render()}</div>
              </div>

              {/* Divider (desktop only, between two expanded panels) */}
              {showDivider && (
                <div
                  onPointerDown={(e) => startDrag(e, id, nextId)}
                  title="Drag to resize"
                  className="group hidden shrink-0 cursor-col-resize items-center justify-center px-1 lg:flex"
                >
                  <div className="h-16 w-1 rounded-full bg-slate-200 transition group-hover:bg-primary group-active:bg-primary" />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
