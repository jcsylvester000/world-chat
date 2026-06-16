"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Switch from "@/components/ui/Switch";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/store/auth-store";
import { useSocialStore } from "@/lib/store/social-store";
import { useChatStore } from "@/lib/store/chat-store";
import { displayName } from "@/lib/utils";
import type { ChatVisibility, Profile } from "@/lib/types";

const VIS_OPTIONS: { value: ChatVisibility; label: string; hint: string }[] = [
  { value: "everyone", label: "Visible to everyone", hint: "Anyone can find and add you." },
  { value: "invite_only", label: "Invite only", hint: "Hidden from search — reachable only via your code." },
  { value: "hidden", label: "Hidden", hint: "You won't appear anywhere; others can't add you." },
];

export default function PeoplePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const savePrivacy = useAuthStore((s) => s.savePrivacy);
  const { contacts, incoming, outgoing, refresh, search, requestById, requestByCode, respond } =
    useSocialStore();
  const openThread = useChatStore((s) => s.openThread);

  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (user) refresh(user.id).then(() => setReady(true));
  }, [user, refresh]);

  if (!user) return <Spinner />;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(user.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const onSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      setResults(await search(q, user.id));
    } finally {
      setSearching(false);
    }
  };

  const addByCode = async () => {
    if (!code.trim()) return;
    const res = await requestByCode(user, code.trim());
    setCodeMsg({ ok: res.ok, text: res.ok ? "Friend request sent!" : res.reason ?? "Failed." });
    if (res.ok) setCode("");
    setTimeout(() => setCodeMsg(null), 3000);
  };

  const addUser = async (p: Profile) => {
    await requestById(user, p);
    setResults((r) => r.filter((x) => x.id !== p.id));
  };

  const message = async (p: Profile) => {
    await openThread(user, p);
    router.push(`/messages?to=${p.id}`);
  };

  const outgoingIds = new Set(outgoing.map((r) => r.toId));
  const contactIds = new Set(contacts.map((c) => c.id));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">People &amp; connections</h1>
        <p className="text-sm text-slate-500">
          Share your code, control who can find you, and manage contacts.
        </p>
      </div>

      {/* Your code + privacy */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Your invite code</h2>
        <p className="mb-3 text-sm text-slate-500">
          Share this so others can send you a request — even if you&apos;re invite-only.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-lg border border-line bg-slate-50 px-4 py-2 font-mono text-lg font-bold tracking-wider text-ink">
            {user.code}
          </code>
          <button onClick={copyCode} className="btn-outline">
            {copied ? "✓ Copied" : "Copy code"}
          </button>
        </div>

        <div className="mt-5 space-y-4 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Who can find me</p>
            <div className="mt-2 space-y-2">
              {VIS_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-white p-3"
                >
                  <input
                    type="radio"
                    name="vis"
                    className="mt-1"
                    checked={user.chatVisibility === o.value}
                    onChange={() => savePrivacy({ chatVisibility: o.value })}
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{o.label}</span>
                    <span className="block text-xs text-slate-500">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Allow friend requests</span>
            <Switch
              checked={user.allowFriendRequests}
              onChange={(v) => savePrivacy({ allowFriendRequests: v })}
            />
          </div>
        </div>
      </section>

      {/* Add by code */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Add by code</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addByCode()}
            placeholder="e.g. WC-7F3K9Q"
            className="input font-mono uppercase"
          />
          <button onClick={addByCode} disabled={!code.trim()} className="btn-primary">
            Send request
          </button>
        </div>
        {codeMsg && (
          <p className={`mt-2 text-sm ${codeMsg.ok ? "text-accent" : "text-danger"}`}>
            {codeMsg.text}
          </p>
        )}
      </section>

      {/* Search discoverable */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Find people</h2>
        <input
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name or email"
          className="input mt-3"
        />
        <ul className="mt-3 space-y-1">
          {query && searching && (
            <li className="text-sm text-slate-400">Searching…</li>
          )}
          {query && !searching && results.length === 0 && (
            <li className="text-sm text-slate-400">No visible users match.</li>
          )}
          {results.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <Avatar email={p.email} size={32} />
                <span className="text-sm">{displayName(p.email)}</span>
              </div>
              {contactIds.has(p.id) ? (
                <Badge tone="green">Connected</Badge>
              ) : outgoingIds.has(p.id) ? (
                <Badge tone="amber">Requested</Badge>
              ) : (
                <button onClick={() => addUser(p)} className="btn-outline !px-3 !py-1.5 text-xs">
                  Add
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Incoming requests */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">
          Friend requests {incoming.length > 0 && `(${incoming.length})`}
        </h2>
        {!ready ? (
          <Spinner />
        ) : incoming.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No pending requests.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {incoming.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-line p-3"
              >
                <div className="flex items-center gap-2">
                  <Avatar email={r.fromEmail} size={36} />
                  <div>
                    <p className="text-sm font-medium">{displayName(r.fromEmail)}</p>
                    <p className="text-xs text-slate-500">wants to connect</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(r.id, true, user.id)}
                    className="btn-accent !px-3 !py-1.5 text-xs"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(r.id, false, user.id)}
                    className="btn-outline !px-3 !py-1.5 text-xs"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contacts */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Your contacts ({contacts.length})</h2>
        {!ready ? (
          <Spinner />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No contacts yet"
            description="Add people by code or from search to start private conversations."
          />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar email={c.email} size={40} />
                  <div>
                    <p className="text-sm font-medium">{displayName(c.email)}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </div>
                </div>
                <button onClick={() => message(c)} className="btn-primary !px-3 !py-1.5 text-xs">
                  💬 Message
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
