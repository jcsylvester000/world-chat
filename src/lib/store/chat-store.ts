import { create } from "zustand";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  deleteDirectMessage,
  deleteGroupMessage,
  deleteWorldMessage,
  editDirectMessage,
  editGroupMessage,
  editWorldMessage,
  getOrCreateThread,
  listGroupsForUser,
  listDirectMessages,
  listGroupMembers,
  listGroupMessages,
  listThreadsForUser,
  listWorldMessages,
  removeGroupMember,
  renameGroup,
  sendDirectMessage,
  sendGroupMessage,
  sendWorldMessage,
  listReactions,
  toggleReactionRemote,
  listReads,
  markReadRemote,
} from "@/lib/data/services";
import { USE_PRISMA } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth-store";
import type {
  ChatGroup,
  DirectMessage,
  DirectThread,
  Message,
  MessageContentType,
  Profile,
  Reaction,
  WorldMessage,
} from "@/lib/types";

interface SendOpts {
  contentType?: MessageContentType;
  filename?: string;
  replyTo?: { id: string; author: string; preview: string };
}

interface ChatState {
  groups: ChatGroup[];
  groupsUserId: string | null;
  membersByGroup: Record<string, Profile[]>;
  messagesByGroup: Record<string, Message[]>;
  worldMessages: WorldMessage[];
  threads: DirectThread[];
  messagesByThread: Record<string, DirectMessage[]>;
  reactionsByMessage: Record<string, Reaction[]>;
  lastReadByConv: Record<string, string>; // conversation key → ISO of last read

  fetchGroups: (userId?: string) => Promise<void>;
  fetchWorld: () => Promise<void>;
  fetchGroupMembers: (groupId: string) => Promise<Profile[]>;
  fetchGroupMessages: (groupId: string) => Promise<Message[]>;
  createGroup: (
    name: string,
    createdByEmail: string,
    memberEmails: string[]
  ) => Promise<void>;
  addMember: (groupId: string, user: Profile) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  renameGroup: (groupId: string, name: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  sendGroupMessage: (
    groupId: string,
    author: Profile,
    content: string,
    opts?: SendOpts
  ) => Promise<void>;
  sendWorld: (author: Profile, content: string, opts?: SendOpts) => Promise<void>;

  fetchThreads: (userId: string) => Promise<void>;
  openThread: (me: Profile, other: Profile) => Promise<string>;
  fetchDirectMessages: (threadId: string) => Promise<void>;
  sendDirect: (
    threadId: string,
    author: Profile,
    content: string,
    opts?: SendOpts
  ) => Promise<void>;

  toggleReaction: (messageId: string, emoji: string, user: Profile) => void;
  markRead: (convKey: string) => void;
  fetchReactions: (messageIds: string[]) => Promise<void>;
  fetchReads: (userId: string) => Promise<void>;

  editGroupMessage: (groupId: string, id: string, content: string) => Promise<void>;
  deleteGroupMessage: (groupId: string, id: string) => Promise<void>;
  editWorld: (id: string, content: string) => Promise<void>;
  deleteWorld: (id: string) => Promise<void>;
  editDirect: (threadId: string, id: string, content: string) => Promise<void>;
  deleteDirect: (threadId: string, id: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  groups: [],
  groupsUserId: null,
  membersByGroup: {},
  messagesByGroup: {},
  worldMessages: [],
  threads: [],
  messagesByThread: {},
  reactionsByMessage: {},
  lastReadByConv: {},

  async fetchGroups(userId) {
    const id = userId ?? get().groupsUserId;
    if (!id) return;
    set({ groupsUserId: id, groups: await listGroupsForUser(id) });
  },
  async fetchWorld() {
    const plan = useAuthStore.getState().user?.plan;
    const msgs = await listWorldMessages(plan);
    set({ worldMessages: msgs });
    await get().fetchReactions(msgs.map((m) => m.id));
  },
  async fetchGroupMembers(groupId) {
    const members = await listGroupMembers(groupId);
    set({ membersByGroup: { ...get().membersByGroup, [groupId]: members } });
    return members;
  },
  async fetchGroupMessages(groupId) {
    const plan = useAuthStore.getState().user?.plan;
    const msgs = await listGroupMessages(groupId, plan);
    set({ messagesByGroup: { ...get().messagesByGroup, [groupId]: msgs } });
    await get().fetchReactions(msgs.map((m) => m.id));
    return msgs;
  },
  async createGroup(name, createdByEmail, memberEmails) {
    await createGroup(name, createdByEmail, memberEmails);
    await get().fetchGroups();
  },
  async addMember(groupId, user) {
    await addGroupMember(groupId, user.id);
    await get().fetchGroupMembers(groupId);
  },
  async removeMember(groupId, userId) {
    await removeGroupMember(groupId, userId);
    await get().fetchGroupMembers(groupId);
  },
  async renameGroup(groupId, name) {
    await renameGroup(groupId, name);
    await get().fetchGroups();
  },
  async deleteGroup(groupId) {
    await deleteGroup(groupId);
    await get().fetchGroups();
  },
  async sendGroupMessage(groupId, author, content, opts) {
    await sendGroupMessage({
      groupId,
      userId: author.id,
      userEmail: author.email,
      content,
      contentType: opts?.contentType ?? "text",
      filename: opts?.filename,
      replyToId: opts?.replyTo?.id,
      replyToAuthor: opts?.replyTo?.author,
      replyToPreview: opts?.replyTo?.preview,
    });
    await get().fetchGroupMessages(groupId);
  },
  async sendWorld(author, content, opts) {
    await sendWorldMessage({
      userId: author.id,
      userEmail: author.email,
      content,
      contentType: opts?.contentType ?? "text",
      filename: opts?.filename,
      replyToId: opts?.replyTo?.id,
      replyToAuthor: opts?.replyTo?.author,
      replyToPreview: opts?.replyTo?.preview,
    });
    await get().fetchWorld();
  },

  async fetchThreads(userId) {
    set({ threads: await listThreadsForUser(userId) });
  },
  async openThread(me, other) {
    const thread = await getOrCreateThread(me, other);
    await get().fetchThreads(me.id);
    await get().fetchDirectMessages(thread.id);
    return thread.id;
  },
  async fetchDirectMessages(threadId) {
    const plan = useAuthStore.getState().user?.plan;
    const msgs = await listDirectMessages(threadId, plan);
    set({ messagesByThread: { ...get().messagesByThread, [threadId]: msgs } });
    await get().fetchReactions(msgs.map((m) => m.id));
  },
  async sendDirect(threadId, author, content, opts) {
    await sendDirectMessage({
      threadId,
      senderId: author.id,
      senderEmail: author.email,
      content,
      contentType: opts?.contentType ?? "text",
      filename: opts?.filename,
      replyToId: opts?.replyTo?.id,
      replyToAuthor: opts?.replyTo?.author,
      replyToPreview: opts?.replyTo?.preview,
    });
    await get().fetchDirectMessages(threadId);
  },

  async editGroupMessage(groupId, id, content) {
    await editGroupMessage(id, content);
    await get().fetchGroupMessages(groupId);
  },
  async deleteGroupMessage(groupId, id) {
    await deleteGroupMessage(id);
    await get().fetchGroupMessages(groupId);
  },
  async editWorld(id, content) {
    await editWorldMessage(id, content);
    await get().fetchWorld();
  },
  async deleteWorld(id) {
    await deleteWorldMessage(id);
    await get().fetchWorld();
  },
  async editDirect(threadId, id, content) {
    await editDirectMessage(id, content);
    await get().fetchDirectMessages(threadId);
  },
  async deleteDirect(threadId, id) {
    await deleteDirectMessage(id);
    await get().fetchDirectMessages(threadId);
  },

  markRead(convKey) {
    set({ lastReadByConv: { ...get().lastReadByConv, [convKey]: new Date().toISOString() } });
    const uid = useAuthStore.getState().user?.id;
    if (uid) void markReadRemote(uid, convKey);
  },

  toggleReaction(messageId, emoji, user) {
    const map = get().reactionsByMessage;
    const list = map[messageId] ?? [];
    const has = list.some((r) => r.emoji === emoji && r.userId === user.id);
    const next = has
      ? list.filter((r) => !(r.emoji === emoji && r.userId === user.id))
      : [...list, { emoji, userId: user.id, userEmail: user.email }];
    set({ reactionsByMessage: { ...map, [messageId]: next } });
    void toggleReactionRemote(messageId, user.id, user.email, emoji);
  },

  async fetchReactions(messageIds) {
    if (!USE_PRISMA || messageIds.length === 0) return;
    const rows = await listReactions(messageIds);
    const byId: Record<string, Reaction[]> = {};
    for (const id of messageIds) byId[id] = [];
    for (const r of rows) (byId[r.messageId] ??= []).push({ emoji: r.emoji, userId: r.userId, userEmail: r.userEmail });
    set({ reactionsByMessage: { ...get().reactionsByMessage, ...byId } });
  },

  async fetchReads(userId) {
    if (!USE_PRISMA) return;
    const rows = await listReads(userId);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.conversationId] = r.lastReadAt;
    set({ lastReadByConv: map });
  },
}));
