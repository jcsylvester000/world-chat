import { create } from "zustand";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
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
} from "@/lib/data/services";
import type {
  ChatGroup,
  DirectMessage,
  DirectThread,
  Message,
  MessageContentType,
  Profile,
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
}

export const useChatStore = create<ChatState>((set, get) => ({
  groups: [],
  groupsUserId: null,
  membersByGroup: {},
  messagesByGroup: {},
  worldMessages: [],
  threads: [],
  messagesByThread: {},

  async fetchGroups(userId) {
    const id = userId ?? get().groupsUserId;
    if (!id) return;
    set({ groupsUserId: id, groups: await listGroupsForUser(id) });
  },
  async fetchWorld() {
    set({ worldMessages: await listWorldMessages() });
  },
  async fetchGroupMembers(groupId) {
    const members = await listGroupMembers(groupId);
    set({ membersByGroup: { ...get().membersByGroup, [groupId]: members } });
    return members;
  },
  async fetchGroupMessages(groupId) {
    const msgs = await listGroupMessages(groupId);
    set({ messagesByGroup: { ...get().messagesByGroup, [groupId]: msgs } });
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
    const msgs = await listDirectMessages(threadId);
    set({ messagesByThread: { ...get().messagesByThread, [threadId]: msgs } });
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
}));
