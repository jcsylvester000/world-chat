"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useListingsStore } from "@/lib/store/listings-store";
import { useSavedSearchesStore } from "@/lib/store/saved-searches-store";

// Saves the current Browse filter set so the user gets a "new matches" count
// as fresh listings post.
export default function SaveSearchButton() {
  const user = useAuthStore((s) => s.user);
  const filters = useListingsStore((s) => s.filters);
  const create = useSavedSearchesStore((s) => s.create);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const defaultName = () => {
    const parts = [filters.type || "All"];
    if (filters.searchText) parts.push(`"${filters.searchText}"`);
    if (filters.hasAts === "with") parts.push("with ATS");
    return `${parts.join(" ")} listings`;
  };

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await create(user.id, name.trim(), filters);
    setBusy(false);
    setSaved(true);
    setTimeout(() => setOpen(false), 900);
  };

  return (
    <>
      <button
        onClick={() => {
          setName(defaultName());
          setSaved(false);
          setOpen(true);
        }}
        className="btn-outline shrink-0 !px-3 !py-2 text-sm"
      >
        💾 Save search
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} className="w-full max-w-sm">
          <div className="p-6">
            <h2 className="text-lg font-bold text-ink">Save this search</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              We&apos;ll show a “new matches” count on your Saved page as fresh listings fit these filters.
            </p>
            <label className="label mt-3">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={busy || saved}>
                {saved ? "Saved ✓" : busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
