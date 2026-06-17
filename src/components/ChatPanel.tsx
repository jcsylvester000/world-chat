"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore } from "@/lib/store/chat-store";
import { findProfileById, listContacts, searchDiscoverableUsers } from "@/lib/data/services";
import Avatar from "@/components/ui/Avatar";
import MessageList, { type ChatMsg } from "@/components/MessageList";
import ChatComposer, { type ReplyTarget } from "@/components/ChatComposer";
import AddGroupModal from "@/components/AddGroupModal";
import GroupDetailModal from "@/components/GroupDetailModal";
import Modal from "@/components/Modal";
import QuickSwitcher, { type QuickItem } from "@/components/QuickSwitcher";
import TypingIndicator from "@/components/TypingIndicator";
import { usePresence, usePresenceHeartbeat, useTyping } from "@/lib/realtime-hooks";
import { cn, displayName } from "@/lib/utils";
import type { ChatGroup, DirectThread, Profile } from "@/lib/types";

type Tab = "direct" | "groups" | "world";

function previewOf(m: ChatMsg): string {
  if (m.contentType === "image") return "📷 Photo";
  if (m.contentType === "attachment") return `📎 ${m.filename ?? "attachment"}`;
  const t = m.content.replace(/\s+/g, " ").trim();
  return t.length > 80 ? t.slice(0, 80) + "…" : t;
}

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
  const reactionsByMessage = useChatStore((s) => s.reactionsByMessage);
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const editWorld = useChatStore((s) => s.editWorld);
  const deleteWorld = useChatStore((s) => s.deleteWorld);
  const editDirect = useChatStore((s) => s.editDirect);
  const deleteDirect = useChatStore((s) => s.deleteDirect);
  const messagesByGroup = useChatStore((s) => s.messagesByGroup);
  const fetchGroupMessages = useChatStore((s) => s.fetchGroupMessages);
  const lastReadByConv = useChatStore((s) => s.lastReadByConv);
  const markRead = useChatStore((s) => s.markRead);

  const [tab, setTab] = useState<Tab>(openDmUserId ? "direct" : defaultTab);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [showNewDm, setShowNewDm] = useState(false);
  const [people, setPeople] = useState<Profile[]>([]);
  const [dmQuery, setDmQuery] = useState("");
  const worldRef = useRef<HTMLDivElement>(null);
  const dmRef = useRef<HTMLDivElement>(null);
  const [dmReply, setDmReply] = useState<ReplyTarget | null>(null);
  const [worldReply, setWorldReply] = useState<ReplyTarget | null>(null);
  const [dmDividerAt, setDmDividerAt] = useState<string | null>(null);
  const [worldDividerAt, setWorldDividerAt] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherPeople, setSwitcherPeople] = useState<Profile[]>([]);

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

  // prefetch messages for all threads + groups so unread badges work
  useEffect(() => {
    threads.forEach((t) => fetchDirectMessages(t.id));
  }, [threads, fetchDirectMessages]);
  useEffect(() => {
    groups.forEach((g) => fetchGroupMessages(g.id));
  }, [groups, fetchGroupMessages]);

  // DM: capture divider + mark read on open, keep read while viewing
  useEffect(() => {
    if (!activeThreadId) { setDmDividerAt(null); return; }
    const key = "dm:" + activeThreadId;
    setDmDividerAt(useChatStore.getState().lastReadByConv[key] ?? null);
    markRead(key);
  }, [activeThreadId, markRead]);
  useEffect(() => {
    if (activeThreadId) markRead("dm:" + activeThreadId);
  }, [activeThreadId, dmMessages.length, markRead]);

  // World: capture divider + mark read on open, keep read while viewing
  useEffect(() => {
    if (tab !== "world") { setWorldDividerAt(null); return; }
    setWorldDividerAt(useChatStore.getState().lastReadByConv["world"] ?? null);
    markRead("world");
  }, [tab, markRead]);
  useEffect(() => {
    if (tab === "world") markRead("world");
  }, [tab, worldMessages.length, markRead]);

  // Cmd/Ctrl-K opens the quick switcher
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSwitcherOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (switcherOpen && user) listContacts(user.id).then(setSwitcherPeople);
  }, [switcherOpen, user]);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) ?? null, [threads, activeThreadId]);
  const activeOther = activeThread && user ? otherOf(activeThread, user.id) : null;
  const unreadCount = (items: { authorId: string; createdAt: string }[], key: string) => {
    const t = lastReadByConv[key];
    return items.reduce((n, m) => n + (m.authorId !== user?.id && (!t || m.createdAt > t) ? 1 : 0), 0);
  };
  const threadUnread = (th: DirectThread) =>
    unreadCount((messagesByThread[th.id] ?? []).map((m) => ({ authorId: m.senderId, createdAt: m.createdAt })), "dm:" + th.id);
  const groupUnread = (g: ChatGroup) =>
    unreadCount((messagesByGroup[g.id] ?? []).map((m) => ({ authorId: m.userId, createdAt: m.createdAt })), "group:" + g.id);
  const worldUnread = unreadCount(worldMessages.map((m) => ({ authorId: m.userId, createdAt: m.createdAt })), "world");
  const directUnread = threads.reduce((n, th) => n + threadUnread(th), 0);
  const groupsUnread = groups.reduce((n, g) => n + groupUnread(g), 0);

  usePresenceHeartbeat(user?.id, user?.email);
  const dmUserIds = user ? threads.map((t) => otherOf(t, user.id).id) : [];
  const presence = usePresence(dmUserIds);
  const dmTyping = useTyping(activeThreadId ? "dm:" + activeThreadId : null, user?.id, user?.email);
  const worldTyping = useTyping(tab === "world" ? "world" : null, user?.id, user?.email);
  const mentionSource = async (q: string) => {
    if (!user) return [];
    const rs = await searchDiscoverableUsers(q, user.id);
    return rs.map((p) => ({ id: p.id, username: p.username, email: p.email }));
  };

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

  const otherIds = new Set(threads.map((t) => otherOf(t, user.id).id));
  const quickItems: QuickItem[] = [
    { key: "world", kind: "world", label: "World chat", sub: "Everyone", badge: worldUnread, run: () => { setTab("world"); setActiveThreadId(null); } },
    ...groups.map((g) => ({ key: "g:" + g.id, kind: "group" as const, label: g.name, sub: "Group", badge: groupUnread(g), run: () => { setTab("groups"); setActiveGroup(g); } })),
    ...threads.map((t) => {
      const oo = otherOf(t, user.id);
      return { key: "t:" + t.id, kind: "dm" as const, label: displayName(oo.email), sub: oo.email, email: oo.email, badge: threadUnread(t), run: () => { setTab("direct"); setActiveThreadId(t.id); } };
    }),
    ...switcherPeople
      .filter((p) => !otherIds.has(p.id))
      .map((p) => ({ key: "p:" + p.id, kind: "person" as const, label: displayName(p.email), sub: p.email, email: p.email, run: async () => { const tid = await openThread(user, p); setTab("direct"); setActiveThreadId(tid); } })),
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex border-b border-line p-1">
        {(["direct", "groups", "world"] as const).map((t) => {
          const tu = t === "direct" ? directUnread : t === "groups" ? groupsUnread : worldUnread;
          return (
          <button key={t} onClick={() => { setTab(t); if (t !== "direct") setActiveThreadId(null); setDmReply(null); setWorldReply(null); }} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition inline-flex items-center justify-center gap-1.5", tab === t ? "bg-primary-50 text-primary" : "text-slate-500 hover:bg-slate-50")}>
            {t === "direct" ? "Direct" : t === "groups" ? "Groups" : "World"}
            {tu > 0 && <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{tu}</span>}
          </button>
          );
        })}
        <button onClick={() => setSwitcherOpen(true)} title="Quick switch (Ctrl/⌘K)" className="ml-1 shrink-0 rounded-lg px-2 text-sm text-slate-400 hover:bg-slate-50 hover:text-ink">🔍</button>
      </div>

      {/* DIRECT */}
      {tab === "direct" &&
        (activeThread && activeOther ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <button onClick={() => { setActiveThreadId(null); setDmReply(null); }} className="text-slate-500">←</button>
              <Avatar email={activeOther.email} size={30} online={presence[activeOther.id]} />
              <div className="leading-tight">
                <span className="block text-sm font-medium">{displayName(activeOther.email)}</span>
                <span className="block text-[11px] text-slate-400">{presence[activeOther.id] ? "Active now" : "Offline"}</span>
              </div>
            </div>
            <div ref={dmRef} className="min-h-0 flex-1 overflow-y-auto p-3">
              <MessageList
                messages={dmMessages.map((m) => ({
                  id: m.id,
                  authorId: m.senderId,
                  authorEmail: m.senderEmail,
                  content: m.content,
                  contentType: m.contentType,
                  filename: m.filename,
                  createdAt: m.createdAt,
                  replyToAuthor: m.replyToAuthor,
                  replyToPreview: m.replyToPreview,
                  editedAt: m.editedAt,
                  deleted: m.deleted,
                }))}
                currentUserId={user.id}
                showAuthors={false}
                myHandle={user.username}
                reactions={reactionsByMessage}
                onToggleReaction={(id, emoji) => toggleReaction(id, emoji, user)}
                onEdit={(id, content) => editDirect(activeThread.id, id, content)}
                onDelete={(id) => deleteDirect(activeThread.id, id)}
                onReply={(m) => setDmReply({ id: m.id, author: m.authorEmail, preview: previewOf(m) })}
                newMessageAfter={dmDividerAt}
              />
            </div>
            <TypingIndicator users={dmTyping.typers} />
            <ChatComposer
              onSend={async (c, o) => {
                await sendDirect(activeThread.id, user, c, dmReply ? { ...o, replyTo: dmReply } : o);
                setDmReply(null);
              }}
              replyTarget={dmReply}
              onCancelReply={() => setDmReply(null)}
              mentionSource={mentionSource}
              onTyping={dmTyping.notifyTyping}
              onStopTyping={dmTyping.stopTyping}
            />
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
                          <Avatar email={o.email} size={36} online={presence[o.id]} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{displayName(o.email)}</p>
                            <p className="truncate text-xs text-slate-500">{last ? (last.contentType === "image" ? "📷 Photo" : last.content) : "Say hello 👋"}</p>
                          </div>
                          {threadUnread(t) > 0 && <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{threadUnread(t)}</span>}
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
                  <span className="flex-1 text-sm font-medium text-ink">{g.name}</span>
                  {groupUnread(g) > 0 && <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{groupUnread(g)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* WORLD */}
      {tab === "world" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={worldRef} className="min-h-0 flex-1 overflow-y-auto p-3">
            {worldMessages.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No messages yet — say hello to everyone! 👋</p>
            )}
            <MessageList
              messages={worldMessages.map((m) => ({
                id: m.id,
                authorId: m.userId,
                authorEmail: m.userEmail,
                content: m.content,
                contentType: m.contentType,
                filename: m.filename,
                createdAt: m.createdAt,
                replyToAuthor: m.replyToAuthor,
                replyToPreview: m.replyToPreview,
                editedAt: m.editedAt,
                deleted: m.deleted,
              }))}
              currentUserId={user.id}
              myHandle={user.username}
              reactions={reactionsByMessage}
              onToggleReaction={(id, emoji) => toggleReaction(id, emoji, user)}
              onEdit={(id, content) => editWorld(id, content)}
              onDelete={(id) => deleteWorld(id)}
              onReply={(m) => setWorldReply({ id: m.id, author: m.authorEmail, preview: previewOf(m) })}
              newMessageAfter={worldDividerAt}
            />
          </div>
          <TypingIndicator users={worldTyping.typers} />
          <ChatComposer
            onSend={async (c, o) => {
              await sendWorld(user, c, worldReply ? { ...o, replyTo: worldReply } : o);
              setWorldReply(null);
            }}
            placeholder="Message everyone…"
            replyTarget={worldReply}
            onCancelReply={() => setWorldReply(null)}
            mentionSource={mentionSource}
            onTyping={worldTyping.notifyTyping}
            onStopTyping={worldTyping.stopTyping}
          />
        </div>
      )}

      <QuickSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} items={quickItems} />
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
