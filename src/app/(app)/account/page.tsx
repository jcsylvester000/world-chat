"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Switch from "@/components/ui/Switch";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/store/auth-store";
import { usePropertyStore } from "@/lib/store/property-store";
import { formatPeso } from "@/lib/utils";
import BrokerVerification from "@/components/BrokerVerification";

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const saveProfile = useAuthStore((s) => s.saveProfile);
  const myProperties = usePropertyStore((s) => s.myProperties);
  const fetchMine = usePropertyStore((s) => s.fetchMine);
  const updateProperty = usePropertyStore((s) => s.update);
  const updateAllVisibility = usePropertyStore((s) => s.updateAllVisibility);

  const [username, setUsername] = useState(user?.username ?? "");
  const [defShowPrice, setDefShowPrice] = useState(user?.defaultShowPrice ?? true);
  const [defShowAtt, setDefShowAtt] = useState(user?.defaultShowAttachments ?? true);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setDefShowPrice(user.defaultShowPrice);
    setDefShowAtt(user.defaultShowAttachments);
    fetchMine(user.id).then(() => setReady(true));
  }, [user, fetchMine]);

  const onSave = async () => {
    await saveProfile({
      username,
      defaultShowPrice: defShowPrice,
      defaultShowAttachments: defShowAtt,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user) return <Spinner />;

  const allPrice = myProperties.length > 0 && myProperties.every((p) => p.showPrice);
  const allDocs =
    myProperties.length > 0 && myProperties.every((p) => p.showAttachments);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="text-sm text-slate-500">
          Manage your profile and what buyers can see on your listings.
        </p>
      </div>

      {/* Profile */}
      <section className="card p-6">
        <div className="flex items-center gap-4">
          <Avatar email={user.email} size={56} />
          <div>
            <p className="font-semibold text-ink">{user.email}</p>
            <Badge tone="blue" className="mt-1 capitalize">
              {user.plan} plan
            </Badge>
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Display name</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input max-w-sm"
          />
        </div>

        <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Default visibility for new listings
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Show price by default</span>
            <Switch checked={defShowPrice} onChange={setDefShowPrice} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Allow viewing attachments by default
            </span>
            <Switch checked={defShowAtt} onChange={setDefShowAtt} />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={onSave} className="btn-primary">
            Save changes
          </button>
          {saved && <span className="text-sm text-accent">✓ Saved</span>}
        </div>
      </section>

      {/* Apply to all listings */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Apply to all listings</h2>
        <p className="mb-4 text-sm text-slate-500">
          Flip a switch to instantly update every one of your{" "}
          {myProperties.length} listing{myProperties.length === 1 ? "" : "s"}.
        </p>
        <div className="space-y-3 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Show price on all listings</span>
            <Switch
              checked={allPrice}
              disabled={myProperties.length === 0}
              onChange={(v) => updateAllVisibility(user.id, { showPrice: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Allow viewing attachments on all listings
            </span>
            <Switch
              checked={allDocs}
              disabled={myProperties.length === 0}
              onChange={(v) => updateAllVisibility(user.id, { showAttachments: v })}
            />
          </div>
        </div>
      </section>

      {/* Per-listing visibility */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Customize per listing</h2>
        <p className="mb-4 text-sm text-slate-500">
          Override price and attachment visibility on individual properties.
        </p>

        {!ready ? (
          <Spinner />
        ) : myProperties.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="Add a property from My Listings to manage its visibility here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {myProperties.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-16 overflow-hidden rounded-lg bg-slate-100">
                    {p.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photos[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-slate-500">{formatPeso(p.price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    Price
                    <Switch
                      checked={p.showPrice}
                      onChange={(v) => updateProperty(p.id, { showPrice: v })}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    View attachments
                    <Switch
                      checked={p.showAttachments}
                      onChange={(v) => updateProperty(p.id, { showAttachments: v })}
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Privacy &amp; contacts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your invite code, chat discoverability (everyone / invite-only / hidden), and friend-request
          settings live on the People page.
        </p>
        <Link href="/people" className="btn-outline mt-3 inline-block !py-1.5 text-sm">
          Manage privacy &amp; invite code →
        </Link>
      </section>
      <BrokerVerification />
    </div>
  );
}
