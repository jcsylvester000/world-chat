import { create } from "zustand";
import {
  convertRequestToLead,
  createPropertyRequest,
  listRequestMessages,
  listRequestsByRequester,
  listRequestsForOwner,
  provideAts,
  respondToRequest,
  sendRequestMessage,
} from "@/lib/data/services";
import type {
  Lead,
  MessageContentType,
  Profile,
  PropertyRequest,
  RequestMessage,
} from "@/lib/types";

interface RequestsState {
  ownerRequests: PropertyRequest[];
  myRequests: PropertyRequest[];
  messagesByRequest: Record<string, RequestMessage[]>;
  fetchOwner: (ownerId: string) => Promise<void>;
  fetchMine: (userId: string) => Promise<void>;
  create: (input: Parameters<typeof createPropertyRequest>[0]) => Promise<PropertyRequest>;
  respond: (requestId: string, approve: boolean, ownerId: string) => Promise<void>;
  convertToLead: (requestId: string, ownerId: string, ownerEmail: string) => Promise<Lead | undefined>;
  provideAts: (requestId: string, atsFilename: string, ownerId: string) => Promise<void>;
  fetchMessages: (requestId: string) => Promise<void>;
  sendMessage: (
    requestId: string,
    sender: Profile,
    content: string,
    opts?: { contentType?: MessageContentType; filename?: string }
  ) => Promise<void>;
}

export const useRequestsStore = create<RequestsState>((set, get) => ({
  ownerRequests: [],
  myRequests: [],
  messagesByRequest: {},

  async fetchOwner(ownerId) {
    set({ ownerRequests: await listRequestsForOwner(ownerId) });
  },
  async fetchMine(userId) {
    set({ myRequests: await listRequestsByRequester(userId) });
  },
  async create(input) {
    const req = await createPropertyRequest(input);
    await get().fetchMine(input.requester.id);
    return req;
  },
  async respond(requestId, approve, ownerId) {
    await respondToRequest(requestId, approve);
    await get().fetchOwner(ownerId);
  },
  async convertToLead(requestId, ownerId, ownerEmail) {
    const lead = await convertRequestToLead(requestId, ownerId, ownerEmail);
    await get().fetchOwner(ownerId);
    return lead;
  },
  async provideAts(requestId, atsFilename, ownerId) {
    await provideAts(requestId, atsFilename);
    await get().fetchOwner(ownerId);
  },
  async fetchMessages(requestId) {
    const msgs = await listRequestMessages(requestId);
    set({ messagesByRequest: { ...get().messagesByRequest, [requestId]: msgs } });
  },
  async sendMessage(requestId, sender, content, opts) {
    await sendRequestMessage({
      requestId,
      senderId: sender.id,
      senderEmail: sender.email,
      content,
      contentType: opts?.contentType ?? "text",
      filename: opts?.filename,
    });
    await get().fetchMessages(requestId);
  },
}));
