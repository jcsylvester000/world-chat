"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/lib/store/auth-store";
import { fileToDataUrl } from "@/lib/utils";
import { NEARBY_CATEGORIES, fetchNearby, type NearbyResult } from "@/lib/teaser/overpass";
import { exportTeaserPdf, exportTeaserPng, type TeaserData } from "@/lib/teaser/teaser-export";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
});

const TEASER_TAGS = [
  "For Sale", "As-Is Where-Is", "Clean Title", "Has ATS",
  "Joint Venture", "Company Owned", "Individual Owner", "Looking for Buyer",
];
const RADII = [0.5, 1, 2, 3, 5];
const MAX_PHOTOS = 5;
const MAX_BYTES = 3 * 1024 * 1024;
const DRAFTS_KEY = "wc-teaser-drafts-v1";
const DEFAULT_LAT = 14.5995;
const DEFAULT_LNG = 120.9842;

interface FormState {
  name: string; priceNum: string; address: string; lat: number; lng: number;
  hideLocation: boolean; description: string; lotSize: string; floorNotes: string;
  tags: string[]; photos: string[]; selectedCats: string[]; radiusKm: number; nearby: NearbyResult | null;
}
interface Draft { id: string; title: string; savedAt: string; form: FormState; }

export default function PropertyTeaserBuilder() {
  const user = useAuthStore((s) => s.user);
  const brand = (user?.company && user.company.trim()) || "WorldChat";

  const [name, setName] = useState("");
  const [priceNum, setPriceNum] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [hideLocation, setHideLocation] = useState(false);
  const [description, setDescription] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [floorNotes, setFloorNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(1);
  const [nearby, setNearby] = useState<NearbyResult | null>(null);
  const [nearbyMode, setNearbyMode] = useState<"details" | "summary">("summary");
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [exporting, setExporting] = useState<"pdf" | "png" | null>(null);
  const [recenterTok, setRecenterTok] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (raw) setDrafts(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const priceText = priceNum.trim()
    ? "₱" + Number(priceNum.replace(/[^0-9.]/g, "") || 0).toLocaleString()
    : "Price on request";
  const lotText = lotSize.trim() ? (/sqm/i.test(lotSize) ? lotSize.trim() : `${lotSize.trim()} sqm`) : "";

  const teaser: TeaserData = useMemo(() => ({
    brand, name, tags, photos, priceText, address, lat, lng, hideLocation,
    description, lotSize: lotText, floorNotes, nearby,
  }), [brand, name, tags, photos, priceText, address, lat, lng, hideLocation, description, lotText, floorNotes, nearby]);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = "";
    setPhotoError(null);
    let added = 0;
    for (const f of files) {
      if (photos.length + added >= MAX_PHOTOS) { setPhotoError(`Up to ${MAX_PHOTOS} photos.`); break; }
      if (f.size > MAX_BYTES) { setPhotoError(`"${f.name}" is over 3MB and was skipped.`); continue; }
      const url = await fileToDataUrl(f);
      setPhotos((p) => [...p, url]);
      added++;
    }
  };

  const runNearby = async (mode: "details" | "summary") => {
    if (selectedCats.length === 0) { setNearbyError("Select at least one category first."); return; }
    setNearbyError(null);
    setNearbyLoading(true);
    try {
      const r = await fetchNearby(lat, lng, radiusKm, selectedCats);
      setNearby(r);
      setNearbyMode(mode);
      if (r.details.length === 0) setNearbyError("No matching places found within the radius.");
    } catch (e) {
      setNearbyError((e as Error).message);
    } finally {
      setNearbyLoading(false);
    }
  };

  const doExport = async (kind: "pdf" | "png") => {
    setNearbyError(null);
    setExporting(kind);
    try {
      if (kind === "pdf") await exportTeaserPdf(teaser);
      else await exportTeaserPng(teaser);
    } catch (e) {
      setNearbyError("Export failed: " + (e as Error).message);
    } finally {
      setExporting(null);
    }
  };

  const persist = (list: Draft[]) => {
    setDrafts(list);
    try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(list)); return true; }
    catch { return false; }
  };
  const saveDraft = () => {
    const form: FormState = { name, priceNum, address, lat, lng, hideLocation, description, lotSize, floorNotes, tags, photos, selectedCats, radiusKm, nearby };
    const d: Draft = { id: (crypto.randomUUID?.() ?? String(Date.now())), title: name.trim() || "Untitled listing", savedAt: new Date().toISOString(), form };
    const ok = persist([d, ...drafts].slice(0, 20));
    setFlash(ok ? "Draft saved." : "Couldn't save — storage is full. Try fewer or smaller photos.");
    setTimeout(() => setFlash(null), 3500);
  };
  const loadDraft = (d: Draft) => {
    const f = d.form;
    setName(f.name); setPriceNum(f.priceNum); setAddress(f.address); setLat(f.lat); setLng(f.lng);
    setHideLocation(f.hideLocation); setDescription(f.description); setLotSize(f.lotSize); setFloorNotes(f.floorNotes);
    setTags(f.tags); setPhotos(f.photos); setSelectedCats(f.selectedCats); setRadiusKm(f.radiusKm); setNearby(f.nearby ?? null);
    setRecenterTok((t) => t + 1);
    setFlash(`Loaded "${d.title}".`);
    setTimeout(() => setFlash(null), 2500);
  };
  const deleteDraft = (id: string) => persist(drafts.filter((x) => x.id !== id));
  const reset = () => {
    setName(""); setPriceNum(""); setAddress(""); setLat(DEFAULT_LAT); setLng(DEFAULT_LNG);
    setHideLocation(false); setDescription(""); setLotSize(""); setFloorNotes("");
    setTags([]); setPhotos([]); setPhotoError(null);
    setSelectedCats([]); setRadiusKm(1); setNearby(null); setNearbyError(null);
    setRecenterTok((t) => t + 1);
  };

  return (
    <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
      {/* ── FORM ── */}
      <div className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Upload a listing</h2>

        <div>
          <label className="label">Property name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium Makati CBD Office Floor" />
        </div>

        <div>
          <label className="label">Property tags</label>
          <div className="flex flex-wrap gap-2">
            {TEASER_TAGS.map((t) => (
              <button key={t} type="button" onClick={() => setTags((a) => toggle(a, t))}
                className={`rounded-full border px-3 py-1 text-xs transition ${tags.includes(t) ? "border-primary bg-primary-50 text-primary" : "border-line text-slate-500 hover:bg-slate-50"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Property pictures <span className="font-normal text-slate-400">(max {MAX_PHOTOS}, ≤3MB each)</span></label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-3 py-4 text-sm text-slate-500 hover:border-primary hover:text-primary">
            <span>🖼️ Choose photo(s)</span>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={onPhotos} />
          </label>
          {photoError && <p className="mt-1 text-xs text-rose-500">{photoError}</p>}
          {photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt={`photo ${i + 1}`} className="h-16 w-16 rounded-lg object-cover ring-1 ring-line" />
                  <button onClick={() => setPhotos((ps) => ps.filter((_, idx) => idx !== i))}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[11px] text-white" type="button" title="Remove">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Price (PHP)</label>
          <input className="input" inputMode="numeric" value={priceNum} onChange={(e) => setPriceNum(e.target.value)} placeholder="Enter total price" />
        </div>

        <div>
          <label className="label">Address</label>
          <textarea className="input min-h-[56px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Property address…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Latitude</label>
            <input className="input" type="number" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input className="input" type="number" value={lng} onChange={(e) => setLng(Number(e.target.value))} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={hideLocation} onChange={(e) => setHideLocation(e.target.checked)} />
          Hide location section in the teaser
        </label>
        <div className="h-64 overflow-hidden rounded-xl ring-1 ring-line">
          <LocationPicker key={`form-${recenterTok}`} lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
        </div>
        <p className="text-xs text-slate-400">Click the map to drop a pin and set the coordinates.</p>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter property description" />
        </div>
        <div>
          <label className="label">Lot size (sqm)</label>
          <input className="input" value={lotSize} onChange={(e) => setLotSize(e.target.value)} placeholder="e.g. 500" />
        </div>
        <div>
          <label className="label">Floor area notes</label>
          <textarea className="input min-h-[56px]" value={floorNotes} onChange={(e) => setFloorNotes(e.target.value)} placeholder="Enter floor area details…" />
        </div>

        <div className="rounded-xl border border-line p-3">
          <p className="text-sm font-semibold">Fetch nearby businesses</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {NEARBY_CATEGORIES.map((c) => (
              <button key={c.key} type="button" onClick={() => setSelectedCats((a) => toggle(a, c.key))}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${selectedCats.includes(c.key) ? "border-primary bg-primary-50 text-primary" : "border-line text-slate-500 hover:bg-slate-50"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-500">Radius</label>
            <select className="input !w-auto !py-1 text-sm" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
              {RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
            </select>
            <button onClick={() => runNearby("details")} disabled={nearbyLoading} className="btn-outline !px-3 !py-1.5 text-xs">
              {nearbyLoading ? "Fetching…" : "Fetch details"}
            </button>
            <button onClick={() => runNearby("summary")} disabled={nearbyLoading} className="btn-outline !px-3 !py-1.5 text-xs">
              {nearbyLoading ? "Fetching…" : "Fetch summary"}
            </button>
          </div>
          {nearbyError && <p className="mt-2 text-xs text-rose-500">{nearbyError}</p>}
        </div>
      </div>

      {/* ── PREVIEW ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={saveDraft} className="btn-outline !px-3 !py-1.5 text-sm">Save as draft</button>
          <button onClick={() => doExport("pdf")} disabled={exporting !== null} className="btn-primary !px-3 !py-1.5 text-sm">
            {exporting === "pdf" ? "Preparing…" : "Print to PDF"}
          </button>
          <button onClick={() => doExport("png")} disabled={exporting !== null} className="btn-outline !px-3 !py-1.5 text-sm">
            {exporting === "png" ? "Preparing…" : "Export as image"}
          </button>
          {flash && <span className="text-xs text-emerald-600">{flash}</span>}
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-primary">{brand}</p>
            <p className="mt-0.5 text-[11px] font-semibold tracking-[0.3em] text-slate-400">PROPERTY TEASER</p>
          </div>
          <hr className="my-4 border-line" />
          <h3 className="text-center text-xl font-bold text-ink">{name || "[Property name]"}</h3>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {tags.map((t) => <span key={t} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary">{t}</span>)}
            </div>
          )}

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Price (PHP)</p>
          <p className="text-lg font-bold text-ink">{priceText}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Property pictures</p>
          {photos.length === 0 ? (
            <p className="text-sm text-slate-400">No photos yet.</p>
          ) : (
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photos.map((p, i) => <img key={i} src={p} alt={`photo ${i + 1}`} className="aspect-square w-full rounded-lg object-cover ring-1 ring-line" />)}
            </div>
          )}

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Address</p>
          <p className="text-sm text-slate-700">{address || "[Address]"}</p>

          {!hideLocation && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Location</p>
              <p className="text-xs text-slate-500">Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}</p>
              <div className="mt-1 h-56 overflow-hidden rounded-xl ring-1 ring-line">
                <LocationPicker key={`prev-${lat.toFixed(4)}-${lng.toFixed(4)}`} lat={lat} lng={lng} onChange={() => {}} />
              </div>
            </>
          )}

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{description || "[Description]"}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Lot size</p>
          <p className="text-sm text-slate-700">{lotText || "Lot size: —"}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Floor area notes</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{floorNotes || "[No floor area notes]"}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Areas nearby</p>
          {!nearby || nearby.summary.length === 0 ? (
            <p className="text-sm italic text-slate-400">No nearby areas fetched yet.</p>
          ) : nearbyMode === "summary" ? (
            <ul className="mt-1 grid grid-cols-2 gap-x-4 text-sm text-slate-700">
              {nearby.summary.map((s) => <li key={s.key} className="flex justify-between"><span>{s.label}</span><span className="font-semibold">{s.count}</span></li>)}
            </ul>
          ) : (
            <div className="mt-1 space-y-2">
              {nearby.summary.filter((s) => s.count > 0).map((s) => (
                <div key={s.key}>
                  <p className="text-sm font-semibold text-ink">{s.label} <span className="text-xs font-normal text-slate-400">({s.count})</span></p>
                  <ul className="text-xs text-slate-500">
                    {nearby.details.filter((d) => d.category === s.key).slice(0, 5).map((d, i) => (
                      <li key={i}>{d.name} · {d.distanceM} m</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DRAFTS ── */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <p className="text-sm font-bold">Saved drafts</p>
          {drafts.length === 0 ? (
            <p className="mt-1 text-xs text-slate-400">No drafts yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {drafts.map((d) => (
                <li key={d.id} className="rounded-lg border border-line p-2">
                  <p className="truncate text-sm font-medium text-ink">{d.title}</p>
                  <p className="text-[10px] text-slate-400">{new Date(d.savedAt).toLocaleString()}</p>
                  <div className="mt-1 flex gap-2">
                    <button onClick={() => loadDraft(d)} className="text-xs text-primary hover:underline">Load</button>
                    <button onClick={() => deleteDraft(d.id)} className="text-xs text-rose-500 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={reset} className="btn-primary w-full !py-2 text-sm">Upload another</button>
      </div>
    </div>
  );
}
