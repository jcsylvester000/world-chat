"use client";

import { useMemo, useState } from "react";
import { formatPeso } from "@/lib/utils";
import type { Property } from "@/lib/types";

const peso0 = (n: number) => formatPeso(Math.round(n));
const pct = (n: number) => `${n.toFixed(1)}%`;

function Field({
  label,
  value,
  onChange,
  suffix,
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="relative">
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input !py-1.5 text-sm"
        />
        {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}

function Out({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5 text-center">
      <p className={`text-base font-bold ${tone ?? "text-ink"}`}>{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

export default function RoiCalculator({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(property.price));
  const [area, setArea] = useState("1000");
  const [rent, setRent] = useState(String(Math.round((property.price * 0.06) / 12)));
  const [occupancy, setOccupancy] = useState("95");
  const [opex, setOpex] = useState("25");
  const [downPct, setDownPct] = useState("30");
  const [rate, setRate] = useState("7");
  const [term, setTerm] = useState("10");

  const r = useMemo(() => {
    const P = Number(price) || 0;
    const A = Number(area) || 0;
    const M = Number(rent) || 0;
    const occ = (Number(occupancy) || 0) / 100;
    const ox = (Number(opex) || 0) / 100;
    const annualGross = M * 12;
    const noi = annualGross * occ * (1 - ox);
    const grossYield = P > 0 ? (annualGross / P) * 100 : 0;
    const capRate = P > 0 ? (noi / P) * 100 : 0;
    const pricePerSqm = A > 0 ? P / A : 0;
    const loan = P * (1 - (Number(downPct) || 0) / 100);
    const mRate = (Number(rate) || 0) / 100 / 12;
    const n = (Number(term) || 0) * 12;
    const monthly = n <= 0 ? 0 : mRate > 0 ? (loan * mRate) / (1 - Math.pow(1 + mRate, -n)) : loan / n;
    return { noi, grossYield, capRate, pricePerSqm, monthly };
  }, [price, area, rent, occupancy, opex, downPct, rate, term]);

  return (
    <div className="card overflow-hidden p-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-3 text-left">
        <span className="font-semibold text-ink">📊 Investment calculator</span>
        <span className="text-sm text-slate-400">{open ? "Hide" : "Estimate yield & payments"}</span>
      </button>

      {open && (
        <div className="border-t border-line px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Purchase price (₱)" value={price} onChange={setPrice} step="100000" />
            <Field label="Floor area (sqm)" value={area} onChange={setArea} />
            <Field label="Monthly rent (₱)" value={rent} onChange={setRent} step="1000" />
            <Field label="Occupancy" value={occupancy} onChange={setOccupancy} suffix="%" />
            <Field label="Operating costs" value={opex} onChange={setOpex} suffix="%" />
            <Field label="Down payment" value={downPct} onChange={setDownPct} suffix="%" />
            <Field label="Interest rate" value={rate} onChange={setRate} suffix="%" step="0.1" />
            <Field label="Loan term" value={term} onChange={setTerm} suffix="yrs" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Out label="Gross yield" value={pct(r.grossYield)} tone="text-primary" />
            <Out label="Cap rate" value={pct(r.capRate)} tone="text-accent" />
            <Out label="NOI / year" value={peso0(r.noi)} />
            <Out label="Price / sqm" value={peso0(r.pricePerSqm)} />
            <Out label="Loan / month" value={peso0(r.monthly)} tone="text-rose-500" />
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Estimates only — adjust the inputs to your assumptions. Cap rate = net operating income ÷ price; gross yield = annual rent ÷ price.
          </p>
        </div>
      )}
    </div>
  );
}
