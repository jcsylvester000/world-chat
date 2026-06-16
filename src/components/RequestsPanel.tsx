"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ChatBubble from "@/components/ChatBubble";
import ChatComposer from "@/components/ChatComposer";
import DocumentModal from "@/components/DocumentModal";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequestsStore } from "@/lib/store/requests-store";
import { findPropertyById } from "@/lib/data/services";
import { cn, displayName, formatDate, formatPeso } from "@/lib/utils";
import type { Property, PropertyRequest } from "@/lib/types";

const statusTone = { pending: "amber", approved: "green", denied: "red" } as const;
const statusLabel = { pending: "Awaiting decision", approved: "Approved", denied: "Rejected" } as const;

export default function RequestsPanel({ openId }: { openId?: string | null }) {
  const user = useAuthStore((s) => s.user);
  const {
    ownerRequests,
    myRequests,
    messagesByRequest,
    fetchOwner,
    fetchMine,
    respond,
    provideAts,
    fetchMessages,
    sendMessage,
  } = useRequestsStore();

  const [tab, setTab] = useState<"received" | "sent">("received");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [doc, setDoc] = useState<{ kind: "ats" | "loi"; req: PropertyRequest } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchOwner(user.id);
      fetchMine(user.id);
    }
  }, [user, fetchOwner, fetchMine]);

  useEffect(() => {
    if (!openId || activeId) return;
    if (ownerRequests.some((r) => r.id === openId)) { setTab("received"); setActiveId(openId); }
    else if (myRequests.some((r) => r.id === openId)) { setTab("sent"); setActiveId(openId); }
  }, [openId, ownerRequests, myRequests, activeId]);

  const list = tab === "received" ? ownerRequests : myRequests;
  const active = useMemo(() => list.find((r) => r.id === activeId) ?? null, [list, activeId]);

  useEffect(() => {
    if (activeId) fetchMessages(activeId);
    setRejecting(false);
    setReason("");
  }, [activeId, fetchMessages]);

  useEffect(() => {
    if (active) findPropertyById(active.propertyId).then((p) => setActiveProperty(p ?? null));
    else setActiveProperty(null);
  }, [active]);

  if (!user) return null;
  const messages = activeId ? messagesByRequest[activeId] ?? [] : [];
  const isOwnerOf = (r: PropertyRequest) => r.ownerId === user.id;

  const doProvideAts = async (filename: string) => {
    if (!active || busy) return;
    setBusy(true);
    try {
      await provideAts(active.id, filename, user.id);
      flash(`📜 ATS shared with ${active.requesterName}.`);
    } catch {
      flash("⚠️ Couldn't share the ATS. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const onProvideFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) doProvideAts(f.name);
  };

  const approveDocs = async () => {
    if (!active || busy) return;
    setBusy(true);
    try {
      await respond(active.id, true, user.id);
      flash("✅ Document access approved.");
    } catch {
      flash("⚠️ Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const sendReject = async () => {
    if (!active || busy) return;
    setBusy(true);
    try {
      await respond(active.id, false, user.id);
      if (reason.trim()) await sendMessage(active.id, user, reason.trim());
      setRejecting(false);
      setReason("");
      flash("❌ Request rejected.");
    } catch {
      flash("⚠️ Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex h-[calc(100dvh-13rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      {toast && (
        <div className="absolute inset-x-0 top-0 z-20 bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>
      )}
      <div className="border-b border-line px-4 py-3">
        <div className="flex gap-1">
          {(["received", "sent"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setActiveId(null); }} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition", tab === t ? "bg-primary-50 text-primary" : "text-slate-500 hover:bg-slate-100")}>
              {t === "received" ? `Received (${ownerRequests.length})` : `Sent (${myRequests.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* List */}
        <aside className={cn("w-full overflow-y-auto border-r border-line sm:w-80", activeId && "hidden sm:block")}>
          {list.length === 0 ? (
            <div className="p-6">
              <EmptyState icon="📨" title={tab === "received" ? "No requests yet" : "You haven't requested anything"} description={tab === "received" ? "When someone asks for your documents or ATS, it shows here." : "Open a listing and request documents or the ATS."} />
            </div>
          ) : (
            <ul>
              {list.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setActiveId(r.id)} className={cn("flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-slate-50", activeId === r.id && "bg-primary-50")}>
                    <Avatar email={r.requesterEmail} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink">{r.propertyTitle}</span>
                        <Badge tone={r.kind === "ats" ? "violet" : "blue"}>{r.kind === "ats" ? "ATS" : "Docs"}</Badge>
                      </div>
                      <p className="truncate text-xs text-slate-500">{tab === "received" ? r.requesterName : `to ${displayName(r.ownerEmail)}`}</p>
                      <Badge tone={statusTone[r.status]} className="mt-1">{statusLabel[r.status]}</Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Detail */}
        <section className={cn("flex flex-1 flex-col", !activeId && "hidden sm:flex")}>
          {!active ? (
            <div className="grid flex-1 place-items-center p-6">
              <EmptyState icon="📋" title="Select a request" description="Pick a request to review and decide." />
            </div>
          ) : (
            <>
              <div className="max-h-[60%] overflow-y-auto border-b border-line p-4">
                <button onClick={() => setActiveId(null)} className="mb-2 text-slate-500 sm:hidden">← Back</button>

                {/* Property summary */}
                <Link href={`/listings/${active.propertyId}`} className="flex items-center gap-3 rounded-xl border border-line p-2 transition hover:border-primary">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {activeProperty?.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeProperty.photos[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{active.propertyTitle}</p>
                    {activeProperty && <p className="text-xs text-slate-500">{formatPeso(activeProperty.price)} · {activeProperty.location}</p>}
                    <span className="text-xs text-primary">View listing →</span>
                  </div>
                </Link>

                {/* Requester */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar email={active.requesterEmail} size={34} />
                    <div>
                      <p className="text-sm font-semibold text-ink">{active.requesterName}</p>
                      <p className="text-xs text-slate-500">ID <span className="font-mono">{active.requesterCode}</span></p>
                    </div>
                  </div>
                  <Badge tone={statusTone[active.status]}>{statusLabel[active.status]}</Badge>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  Wants the{" "}
                  <Badge tone={active.kind === "ats" ? "violet" : "blue"}>{active.kind === "ats" ? "ATS" : "documents"}</Badge>{" "}
                  · {formatDate(active.createdAt)}
                </p>
                {active.message && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">“{active.message}”</p>}

                {/* LOI / ATS document buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {active.loiFilename && (
                    <button onClick={() => setDoc({ kind: "loi", req: active })} className="btn-outline !py-1.5 text-xs">📄 View LOI</button>
                  )}
                  {active.atsProvidedFilename && (
                    <button onClick={() => setDoc({ kind: "ats", req: active })} className="btn-outline !py-1.5 text-xs">📜 View ATS</button>
                  )}
                </div>

                {/* OWNER decision */}
                {isOwnerOf(active) && active.status === "pending" && (
                  <div className="mt-4 rounded-xl border border-line bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Your decision</p>
                    {!rejecting ? (
                      <div className="flex flex-wrap gap-2">
                        {active.kind === "ats" ? (
                          <button onClick={() => fileRef.current?.click()} className="btn-accent">✅ Approve &amp; provide ATS</button>
                        ) : (
                          <button onClick={approveDocs} className="btn-accent">✅ Approve access</button>
                        )}
                        <button onClick={() => setRejecting(true)} className="btn-outline !text-danger">❌ Reject</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason (optional) — sent to the requester…" className="input" />
                        <div className="flex gap-2">
                          <button onClick={sendReject} className="btn-danger">Confirm rejection</button>
                          <button onClick={() => { setRejecting(false); setReason(""); }} className="btn-outline">Cancel</button>
                        </div>
                      </div>
                    )}
                    {active.kind === "ats" ? (
                      <p className="mt-2 text-xs text-slate-400">Approving lets you attach your ATS, which the requester can then view.</p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">Approving unlocks the documents already attached to this listing.</p>
                    )}
                  </div>
                )}

                {/* Outcome banners */}
                {active.status === "approved" && (
                  <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    ✅ Approved{active.atsProvidedFilename ? ` — ATS shared (${active.atsProvidedFilename}).` : "."}
                  </p>
                )}
                {active.status === "denied" && (
                  <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">❌ Rejected.</p>
                )}
              </div>

              {/* Chat */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && <p className="text-center text-sm text-slate-400">No messages yet.</p>}
                {messages.map((m) => (
                  <ChatBubble key={m.id} email={m.senderEmail} content={m.content} contentType={m.contentType} filename={m.filename} createdAt={m.createdAt} mine={m.senderId === user.id} showAuthor={false} />
                ))}
              </div>
              <ChatComposer onSend={(content, opts) => sendMessage(active.id, user, content, opts)} placeholder="Message about this request…" />
            </>
          )}
        </section>
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onProvideFile} />

      {doc && (
        <DocumentModal
          kind={doc.kind}
          fromName={doc.kind === "loi" ? doc.req.requesterName : displayName(doc.req.ownerEmail)}
          filename={doc.kind === "loi" ? doc.req.loiFilename : doc.req.atsProvidedFilename}
          onClose={() => setDoc(null)}
          onProvide={doc.kind === "loi" && isOwnerOf(doc.req) && doc.req.status === "pending" ? (fn) => doProvideAts(fn) : undefined}
          provideLabel={doc.kind === "loi" ? "Approve & provide ATS" : undefined}
        />
      )}
    </div>
  );
}
