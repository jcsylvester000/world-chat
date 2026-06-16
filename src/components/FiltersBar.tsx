"use client";

import { useState } from "react";
import { ALL_TAGS, PROPERTY_TYPES, TAG_NAMES } from "@/lib/constants";
import { useListingsStore } from "@/lib/store/listings-store";
import { cn } from "@/lib/utils";
import type { PropertyType } from "@/lib/types";

export default function FiltersBar() {
  const filters = useListingsStore((s) => s.filters);
  const setFilters = useListingsStore((s) => s.setFilters);

  const [search, setSearch] = useState(filters.searchText);
  const [type, setType] = useState<PropertyType | "">(filters.type);
  const [min, setMin] = useState(filters.minPrice);
  const [max, setMax] = useState(filters.maxPrice);
  const [tags, setTags] = useState<string[]>(filters.selectedTags);
  const [ats, setAts] = useState<"" | "with" | "without">(filters.hasAts);

  const toggleTag = (tag: string) =>
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  const apply = () =>
    setFilters({
      searchText: search,
      type,
      minPrice: Number(min) || 0,
      maxPrice: Number(max) || 99_999_999,
      selectedTags: tags,
      hasAts: ats,
    });

  const clear = () => {
    setSearch("");
    setType("");
    setMin(0);
    setMax(99_999_999);
    setTags([]);
    setAts("");
    setFilters({
      searchText: "",
      type: "",
      minPrice: 0,
      maxPrice: 99_999_999,
      selectedTags: [],
      hasAts: "",
    });
  };

  return (
    <div className="card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && apply()}
            placeholder="Title or location"
            className="input"
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PropertyType | "")}
            className="input"
          >
            <option value="">All types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Min price (₱)</label>
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="input"
          />
        </div>
        <div>
          <label className="label">Max price (₱)</label>
          <input
            type="number"
            min={0}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="label">Authority to Sell (ATS)</label>
        <select
          value={ats}
          onChange={(e) => setAts(e.target.value as "" | "with" | "without")}
          className="input max-w-xs"
        >
          <option value="">Any</option>
          <option value="with">Has ATS</option>
          <option value="without">No ATS</option>
        </select>
      </div>

      <div className="mt-3">
        <label className="label">Tags</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-primary bg-primary-50 text-primary"
                    : "border-line bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                {TAG_NAMES[tag]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={apply} className="btn-primary">
          Apply filters
        </button>
        <button onClick={clear} className="btn-ghost">
          Clear
        </button>
      </div>
    </div>
  );
}
