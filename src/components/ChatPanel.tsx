"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore } from "@/lib/store/chat-store";
import { findProfileById, listContacts, searchDiscoverableUsers } from "@/lib/data/services";
import Avatar from "@/components/ui/Avatar";
import ChatBubble from "@/components/ChatBubble";
import ChatComposer from "@/components/ChatComposer";
import AddGroupModal from "@/components/AddGroupModal";
import GroupDetailModal from "@/components/GroupDetailModal";
import Modal from "@/components/Modal";
import { cn, displayName } from "@/lib/utils";
import type { ChatGroup, DirectThread, Profile } from "@/lib/types";

type Tab = "direct" | "groups" | "world";

function otherOf(thread: DirectThread, userId: string) {
  const idx = thread.participantIds[0] === userId ? 1 : 0;
  return { id: thread.participantIds[idx], email: thread.participantEmails[idx] };
}

export default function ChatPanel({
  openDmUserId,
  defaultTab = "world",
}: {
  openDmUserId?: string | null;
  defaultTab?: Tab;
}) {
  const user = useAuthStore((s) => s.user);
  const groups = useChatStore((s) => s.groups);
  const worldMessages = useChatStore((s) => s.worldMessages);
  const threads = useChatStore((s) => s.threads);
  const messagesByThread = useChatStore((s) => s.messagesByThread);
  const fetchGroups = useChatStore((s) => s.fetchGroups);
  const fetchWorld = useChatStore((s) => s.fetchWorld);
  const fetchThreads = useChatStore((s) => s.fetchThreads);
  const fetchDirectMessages = useChatStore((s) => s.fetchDirectMessages);
  const sendDirect = useChatStore((s) => s.sendDirect);
  const sendWorld = useChatStore((s) => s.sendWorld);
  const openThread = useChatStore((s) => s.openThread);

  const [tab, setTab] = useState<Tab>(openDmUserId ? "direct" : defaultTab);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [showNewDm, setShowNewDm] = useState(false);
  const [people, setPeople] = useState<Profile[]>([]);
  const [dmQuery, setDmQuery] = useState("");
  const worldRef = useRef<HTMLDivElement>(null);
  const dmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchGroups(user.id);
    fetchWorld();
    fetchThreads(user.id);
  }, [user, fetchGroups, fetchWorld, fetchThreads]);

  useEffect(() => {
    if (!user || !openDmUserId) return;
    (async () => {
      const other = await findProfileById(openDmUserId);
      if (other && other.id !== user.id) {
        const tid = await openThread(user, other);
        setTab("direct");
        setActiveThreadId(tid);
      }
    })();
  }, [user, openDmUserId, openThread]);

  useEffect(() => {
    if (activeThreadId) fetchDirectMessages(activeThreadId);
  }, [activeThreadId, fetchDirectMessages]);

  const dmMessages = activeThreadId ? messagesByThread[activeThreadId] ?? [] : [];
  useEffect(() => {
    if (tab === "world") worldRef.current?.scrollTo({ top: worldRef.current.scrollHeight });
  }, [worldMessages.length, tab]);
  useEffect(() => {
    dmRef.current?.scrollTo({ top: dmRef.current.scrollHeight });
  }, [dmMessages.length]);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) ?? null, [threads, activeThreadId]);
  const activeOther = activeThread && user ? otherOf(activeThread, user.id) : null;

  const openNewDm = async () => {
    if (!user) return;
    setShowNewDm(true);
    setDmQuery("");
    setPeople(await listContacts(user.id));
  };
  const searchPeople = async (q: string) => {
    if (!user) return;
    setDmQuery(q);
    if (!q.trim()) {
      setPeople(await listContacts(user.id));
      return;
    }
    // Union discoverable users with your existing contacts so a contact who is
    // invite-only/hidden doesn't vanish from search.
    const [discoverable, contacts] = await Promise.all([
      searchDiscoverableUsers(q, user.id),
      listContacts(user.id),
    ]);
    const ql = q.toLowerCase();
    const merged = contacts.filter(
      (c) => c.username.toLowerCase().includes(ql) || c.email.toLowerCase().includes(ql)
    );
    discoverable.forEach((d) => {
      if (!merged.some((m) => m.id === d.id)) merged.push(d);
    });
    setPeople(merged);
  };
  const startDm = async (other: Profile) => {
    if (!user) return;
    const tid = await openThread(user, other);
    setShowNewDm(false);
    setTab("direct");
    setActiveThreadId(tid);
  };

  if (!user) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex border-b border-line p-1">
        {(["direct", "groups", "world"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); if (t !== "direct") setActiveThreadId(null); }} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition", tab === t ? "bg-primary-50 text-primary" : "text-slate-500 hover:bg-slate-50")}>
            {t === "direct" ? "Direct" : t === "groups" ? "Groups" : "World"}
          </button>
        ))}
      </div>

      {/* DIRECT */}
      {tab === "direct" &&
        (activeThread && activeOther ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <button onClick={() => setActiveThreadId(null)} className="text-slate-500">←</button>
              <Avatar email={activeOther.email} size={30} />
              <span className="text-sm font-medium">{displayName(activeOther.email)}</span>
            </div>
            <div ref={dmRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {dmMessages.map((m) => (
                <ChatBubble key={m.id} email={m.senderEmail} content={m.content} contentType={m.contentType} filename={m.filename} createdAt={m.createdAt} mine={m.senderId === user.id} showAuthor={false} />
              ))}
            </div>
            <ChatComposer onSend={(c, o) => sendDirect(activeThread.id, user, c, o)} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Direct messages</span>
              <button onClick={openNewDm} className="btn-primary !px-2.5 !py-1 text-xs">+ New</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">No conversations yet. Tap <strong>+ New</strong> or message a listing owner.</p>
              ) : (
                <ul>
                  {threads.map((t) => {
                    const o = otherOf(t, user.id);
                    const last = (messagesByThread[t.id] ?? []).at(-1);
                    return (
                      <li key={t.id}>
                        <button onClick={() => setActiveThreadId(t.id)} className="flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left hover:bg-slate-50">
                          <Avatar email={o.email} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{displayName(o.email)}</p>
                            <p className="truncate text-xs text-slate-500">{last ? (last.contentType === "image" ? "📷 Photo" : last.content) : "Say hello 👋"}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ))}

      {/* GROUPS */}
      {tab === "groups" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your groups</span>
            <button onClick={() => setShowAddGroup(true)} className="btn-primary !px-2.5 !py-1 text-xs">+ New</button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {groups.length === 0 && <li className="px-2 py-3 text-sm text-slate-400">No groups yet.</li>}
            {groups.map((g) => (
              <li key={g.id}>
                <button onClick={() => setActiveGroup(g)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-sm font-semibold text-primary">{g.name.charAt(0).toUpperCase()}</span>
                  <span className="text-sm font-medium text-ink">{g.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* WORLD */}
      {tab === "world" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={worldRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {worldMessages.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No messages yet — say hello to everyone! 👋</p>
            )}
            {worldMessages.map((m) => (
              <ChatBubble key={m.id} email={m.userEmail} content={m.content} contentType={m.contentType} filename={m.filename} createdAt={m.createdAt} mine={m.userId === user.id} />
            ))}
          </div>
          <ChatComposer onSend={(c, o) => sendWorld(user, c, o)} placeholder="Message everyone…" />
        </div>
      )}

      {showAddGroup && <AddGroupModal onClose={() => setShowAddGroup(false)} />}
      {activeGroup && <GroupDetailModal group={activeGroup} onClose={() => setActiveGroup(null)} />}
      {showNewDm && (
        <Modal onClose={() => setShowNewDm(false)}>
          <h3 className="mb-3 text-lg font-bold">New message</h3>
          <input value={dmQuery} onChange={(e) => searchPeople(e.target.value)} placeholder="Search contacts or people…" className="input mb-3" />
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {people.length === 0 && <li className="px-2 py-3 text-sm text-slate-400">No people found.</li>}
            {people.map((pp) => (
              <li key={pp.id}>
                <button onClick={() => startDm(pp)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50">
                  <Avatar email={pp.email} size={34} />
                  <div>
                    <p className="text-sm font-medium">{displayName(pp.email)}</p>
                    <p className="text-xs text-slate-500">{pp.email}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}
