"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Avatar from "@/components/ui/Avatar";
import MessageList, { type ChatMsg } from "@/components/MessageList";
import ChatComposer, { type ReplyTarget } from "@/components/ChatComposer";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore } from "@/lib/store/chat-store";
import { listAddableUsers } from "@/lib/data/services";
import { displayName } from "@/lib/utils";
import type { ChatGroup, Profile } from "@/lib/types";

function previewOf(m: ChatMsg): string {
  if (m.contentType === "image") return "📷 Photo";
  if (m.contentType === "attachment") return `📎 ${m.filename ?? "attachment"}`;
  const t = m.content.replace(/\s+/g, " ").trim();
  return t.length > 80 ? t.slice(0, 80) + "…" : t;
}

export default function GroupDetailModal({
  group,
  onClose,
}: {
  group: ChatGroup;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const membersByGroup = useChatStore((s) => s.membersByGroup);
  const messagesByGroup = useChatStore((s) => s.messagesByGroup);
  const fetchGroupMembers = useChatStore((s) => s.fetchGroupMembers);
  const fetchGroupMessages = useChatStore((s) => s.fetchGroupMessages);
  const addMember = useChatStore((s) => s.addMember);
  const removeMember = useChatStore((s) => s.removeMember);
  const renameGroup = useChatStore((s) => s.renameGroup);
  const deleteGroup = useChatStore((s) => s.deleteGroup);
  const sendGroupMessage = useChatStore((s) => s.sendGroupMessage);
  const reactionsByMessage = useChatStore((s) => s.reactionsByMessage);
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const editGroupMessage = useChatStore((s) => s.editGroupMessage);
  const deleteGroupMessage = useChatStore((s) => s.deleteGroupMessage);
  const markRead = useChatStore((s) => s.markRead);

  const members = useMemo(
    () => membersByGroup[group.id] ?? [],
    [membersByGroup, group.id]
  );
  const messages = messagesByGroup[group.id] ?? [];

  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [newMember, setNewMember] = useState("");
  const [tab, setTab] = useState<"chat" | "members">("chat");
  const [groupName, setGroupName] = useState(group.name);
  const [reply, setReply] = useState<ReplyTarget | null>(null);
  const [dividerAt, setDividerAt] = useState<string | null>(null);
  const mentionSource = async (q: string) => {
    const ql = q.toLowerCase();
    return members
      .filter((p) => p.id !== user?.id && (p.username.toLowerCase().includes(ql) || p.email.toLowerCase().includes(ql)))
      .map((p) => ({ id: p.id, username: p.username, email: p.email }));
  };

  useEffect(() => {
    if (user) listAddableUsers(user.id).then(setAllUsers);
    fetchGroupMembers(group.id);
    fetchGroupMessages(group.id);
  }, [group.id, user, fetchGroupMembers, fetchGroupMessages]);

  // capture unread divider + mark read on open; keep read while viewing
  useEffect(() => {
    const key = "group:" + group.id;
    setDividerAt(useChatStore.getState().lastReadByConv[key] ?? null);
    markRead(key);
  }, [group.id, markRead]);
  useEffect(() => {
    markRead("group:" + group.id);
  }, [group.id, messages.length, markRead]);

  const isOwner = group.createdByEmail === user?.email;
  const available = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          u.email !== user?.email && !members.some((m) => m.email === u.email)
      ),
    [allUsers, members, user]
  );

  const onAddMember = async () => {
    const profile = allUsers.find((u) => u.email === newMember);
    if (profile) {
      await addMember(group.id, profile);
      setNewMember("");
    }
  };

  return (
    <Modal onClose={onClose} className="!max-w-xl !p-0">
      <div className="flex items-center gap-3 border-b border-line p-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-lg font-bold text-primary">
          {group.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h3 className="font-bold">{groupName}</h3>
          <p className="text-xs text-slate-500">{members.length} members</p>
        </div>
      </div>

      <div className="flex border-b border-line px-4">
        {(["chat", "members"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <div className="flex h-[55vh] flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-slate-400">
                No messages yet. Say hello 👋
              </p>
            )}
            {user && (
              <MessageList
                messages={messages.map((m) => ({
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
                onEdit={(id, content) => editGroupMessage(group.id, id, content)}
                onDelete={(id) => deleteGroupMessage(group.id, id)}
                onReply={(m) => setReply({ id: m.id, author: m.authorEmail, preview: previewOf(m) })}
                newMessageAfter={dividerAt}
              />
            )}
          </div>
          {user && (
            <ChatComposer
              onSend={async (content, opts) => {
                await sendGroupMessage(group.id, user, content, reply ? { ...opts, replyTo: reply } : opts);
                setReply(null);
              }}
              replyTarget={reply}
              onCancelReply={() => setReply(null)}
              mentionSource={mentionSource}
            />
          )}
        </div>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto p-4">
          <ul className="space-y-1">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Avatar email={m.email} size={32} />
                  <span className="text-sm">{displayName(m.email)}</span>
                  {group.createdByEmail === m.email && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      owner
                    </span>
                  )}
                </div>
                {isOwner && m.email !== user?.email && (
                  <button
                    onClick={() => removeMember(group.id, m.id)}
                    className="text-xs text-danger hover:underline"
                  >
                    Remove
                  </button>
                )}
                {!isOwner && m.id === user?.id && (
                  <button
                    onClick={async () => {
                      await removeMember(group.id, user!.id);
                      onClose();
                    }}
                    className="text-xs text-danger hover:underline"
                  >
                    Leave
                  </button>
                )}
              </li>
            ))}
          </ul>

          {isOwner && (
            <div className="mt-3 flex gap-2">
              <select
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                className="input"
              >
                <option value="">Add a member…</option>
                {available.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.email}
                  </option>
                ))}
              </select>
              <button
                onClick={onAddMember}
                disabled={!newMember}
                className="btn-primary"
              >
                Add
              </button>
            </div>
          )}

          {isOwner && (
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              <div>
                <label className="label">Group name</label>
                <div className="flex gap-2">
                  <input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="input" />
                  <button onClick={() => renameGroup(group.id, groupName.trim() || group.name)} disabled={!groupName.trim()} className="btn-primary">Save</button>
                </div>
              </div>
              <button onClick={async () => { await deleteGroup(group.id); onClose(); }} className="btn-danger w-full">Delete group</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
