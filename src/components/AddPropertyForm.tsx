"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PhotoUploader from "@/components/PhotoUploader";
import Switch from "@/components/ui/Switch";
import { ALL_TAGS, PROPERTY_TYPES, TAG_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";
import { usePropertyStore } from "@/lib/store/property-store";
import { HAS_ATS_TAG, MAX_ATTACHMENTS, type AtsVisibility, type Property, type PropertyType } from "@/lib/types";

const SAMPLE_PDF = "https://www.africau.edu/images/default/sample.pdf";
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100" />,
});

export default function AddPropertyForm({
  onAdded,
  initial,
}: {
  onAdded: () => void;
  initial?: Property;
}) {
  const user = useAuthStore((s) => s.user);
  const add = usePropertyStore((s) => s.add);
  const edit = usePropertyStore((s) => s.edit);
  const loading = usePropertyStore((s) => s.loading);
  const isEdit = !!initial;

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    location: initial?.location ?? "",
    latitude: initial?.latitude ?? 14.58,
    longitude: initial?.longitude ?? 121.0,
    type: (initial?.type ?? "Office") as PropertyType,
  });
  const [tags, setTags] = useState<string[]>(
    (initial?.tags ?? []).filter((t) => t !== HAS_ATS_TAG)
  );
  const [customTag, setCustomTag] = useState("");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [files, setFiles] = useState<string[]>([]);
  const [atsFile, setAtsFile] = useState<string | null>(initial?.ats?.filename ?? null);
  const [atsVisibility, setAtsVisibility] = useState<AtsVisibility>(
    initial?.ats && initial?.atsVisibility ? initial.atsVisibility : "document"
  );
  const [requiresLOI, setRequiresLOI] = useState(initial?.requiresLOI ?? false);
  const [showPrice, setShowPrice] = useState(initial?.showPrice ?? user?.defaultShowPrice ?? true);
  const [showAttachments, setShowAttachments] = useState(initial?.showAttachments ?? user?.defaultShowAttachments ?? true);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const toggleTag = (tag: string) =>
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setCustomTag("");
  };
  const customTags = tags.filter((t) => !ALL_TAGS.includes(t as never) && t !== HAS_ATS_TAG);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (form.price <= 0) {
      setError("Enter a price greater than ₱0.");
      return;
    }
    if (photos.length === 0) {
      setError("Add at least one photo so buyers can see the property.");
      return;
    }
    const ats = atsFile
      ? { url: initial?.ats?.url ?? SAMPLE_PDF, filename: atsFile }
      : null;
    const finalVis: AtsVisibility = ats ? atsVisibility : "hidden";
    const finalTags =
      ats && finalVis !== "hidden" ? [...tags, HAS_ATS_TAG] : tags;

    if (isEdit && initial) {
      const ok = await edit(initial.id, user.id, {
        ...form,
        tags: finalTags,
        photos,
        showPrice,
        showAttachments,
        ats,
        atsVisibility: finalVis,
        requiresLOI: ats ? requiresLOI : false,
      });
      if (ok) onAdded();
      else setError(usePropertyStore.getState().error ?? "Could not save changes. Please try again.");
      return;
    }

    const created = await add({
      ownerId: user.id,
      ownerEmail: user.email,
      ...form,
      tags: finalTags,
      photos,
      showPrice,
      showAttachments,
      ats,
      atsVisibility: finalVis,
      requiresLOI: ats ? requiresLOI : false,
      attachments: files.map((filename) => ({ url: SAMPLE_PDF, filename })),
    });
    if (created) onAdded();
    else
      setError(
        usePropertyStore.getState().error ??
          "Could not add property. Please try again."
      );
  };

  const fileInput =
    "block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h3 className="text-lg font-bold">{isEdit ? "Edit listing" : "List a property"}</h3>
        <p className="text-sm text-slate-500">
          {isEdit ? "Update your listing details, photos, ATS and visibility." : "Add details, photos and documents. You control what buyers see."}
        </p>
      </div>

      <div>
        <label className="label">Photos</label>
        <PhotoUploader photos={photos} onChange={setPhotos} />
      </div>

      <div>
        <label className="label">Title</label>
        <input required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Prime Makati Office Floor" className="input" />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the property, condition, and highlights" className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Price (₱)</label>
          <input required type="number" min="1" step="1" value={form.price} onChange={(e) => set("price", Number(e.target.value))} className="input" />
        </div>
        <div>
          <label className="label">Type</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value as PropertyType)} className="input">
            {PROPERTY_TYPES.map((t) => (<option key={t}>{t}</option>))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Location</label>
        <input required value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Province" className="input" />
      </div>

      {/* Map picker for coordinates */}
      <div>
        <label className="label">Pin location on the map (click to set)</label>
        <div className="h-56 overflow-hidden rounded-xl border border-line">
          <LocationPicker
            lat={form.latitude}
            lng={form.longitude}
            onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
          />
        </div>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Latitude</label>
            <input type="number" step="0.000001" value={form.latitude} onChange={(e) => set("latitude", Number(e.target.value))} className="input" />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input type="number" step="0.000001" value={form.longitude} onChange={(e) => set("longitude", Number(e.target.value))} className="input" />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="label">Tags</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button type="button" key={tag} onClick={() => toggleTag(tag)} className={cn("rounded-full border px-3 py-1 text-xs font-medium transition", active ? "border-primary bg-primary-50 text-primary" : "border-line bg-white text-slate-600 hover:border-slate-300")}>
                {TAG_NAMES[tag]}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }} placeholder="Add a custom tag…" className="input" />
          <button type="button" onClick={addCustomTag} disabled={!customTag.trim()} className="btn-outline">Add</button>
        </div>
        {customTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {customTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {tag}
                <button type="button" onClick={() => toggleTag(tag)} className="text-slate-400 hover:text-danger">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Documents (create only) */}
      {!isEdit && (
        <div>
          <label className="label">Documents (PDF / DOCX · max {MAX_ATTACHMENTS})</label>
          <input type="file" accept=".pdf,.doc,.docx" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_ATTACHMENTS).map((f) => f.name))} className={fileInput} />
          {files.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs text-slate-500">
              {files.map((f) => (<li key={f}>{f}</li>))}
            </ul>
          )}
        </div>
      )}

      {/* ATS */}
      <div className="rounded-xl border border-line p-4">
        <p className="text-sm font-semibold text-slate-700">Authority to Sell (ATS)</p>
        <p className="mb-2 text-xs text-slate-500">Upload your ATS to signal you&apos;re authorized to sell. You choose how it&apos;s shown.</p>
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setAtsFile(e.target.files?.[0]?.name ?? atsFile)} className={fileInput} />
        {atsFile && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-slate-600">📄 {atsFile}{" "}
              <button type="button" onClick={() => setAtsFile(null)} className="text-danger hover:underline">remove</button>
            </p>
            <div>
              <label className="label">How to show the ATS</label>
              <select value={atsVisibility} onChange={(e) => setAtsVisibility(e.target.value as AtsVisibility)} className="input">
                <option value="document">Show as a viewable document</option>
                <option value="on_request">Show a note — available on request</option>
                <option value="hidden">Don&apos;t show it</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Require a Letter of Intent (LOI) to view ATS</span>
              <Switch checked={requiresLOI} onChange={setRequiresLOI} label="Require LOI" />
            </div>
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="space-y-3 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Visibility</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Show price publicly</span>
          <Switch checked={showPrice} onChange={setShowPrice} label="Show price" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Allow viewing attachments</span>
          <Switch checked={showAttachments} onChange={setShowAttachments} label="Show attachments" />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" disabled={loading} className="btn-accent w-full">
        {loading ? "Saving…" : isEdit ? "Save changes" : "Publish listing"}
      </button>
    </form>
  );
}
