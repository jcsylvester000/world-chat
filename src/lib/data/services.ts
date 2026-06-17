// ─── Data-service layer ─────────────────────────────────────────
// The ONLY place the UI talks to "the database". Today it reads/writes
// the in-memory mock arrays. Swap each body for a Prisma call later —
// signatures stay the same.

import {
  auditLogs,
  chatGroups,
  directMessages,
  directThreads,
  friendRequests,
  groupMembers,
  messages,
  notifications,
  aiRequests,
  invoices,
  payments,
  profiles,
  supportTickets,
  properties,
  propertyRequests,
  requestMessages,
  settings,
  worldMessages,
  leads,
  leadStages,
  leadSources,
  leadTypes,
  favorites,
  savedSearches,
  viewings,
  verificationRequests,
  reviews,
  leadActivities,
} from "./mock-data";
import { matchesListingFilters } from "@/lib/filter";
import {
  CHAT_RETENTION_DAYS,
  HAS_ATS_TAG,
  type AppNotification,
  type AuditLog,
  type ChatGroup,
  type ChatVisibility,
  type DirectMessage,
  type DirectThread,
  type FriendRequest,
  type ListingFilters,
  type Message,
  type Paginated,
  type Payment,
  type Plan,
  type Profile,
  type Property,
  type PropertyAttachment,
  type PropertyRequest,
  type RequestKind,
  type RequestMessage,
  type WorldMessage,
  type BillingInterval,
  type Invoice,
  type NotificationType,
  type SupportTicket,
  type TicketCategory,
  type TicketStatus,
  type AiRequest,
  type AiToolType,
  type AiRequestStatus,
  type AiFile,
  type Lead,
  type LeadMeta,
  type LeadStatus,
  type SavedSearch,
  type SavedSearchWithCount,
  type Viewing,
  type VerificationRequest,
  type Review,
  type BrokerReviewsBundle,
  type BrokerAnalytics,
  type LeadActivity,
  type LeadActivityType,
} from "@/lib/types";
import { BASIC_LISTING_CAP, PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_ANNUAL, aiPrice } from "@/lib/constants";
import * as billing from "@/lib/billing";
import { apiGet, apiSend, USE_PRISMA } from "@/lib/api";

const latency = <T>(value: T, ms = 0): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
// Next human-facing number (e.g. TKT-1003) from the max existing suffix — robust
// to seed edits / reordering, unlike a length-based counter.
function nextNumber(prefix: string, existing: string[], start = 1000): string {
  const max = existing.reduce((m, n) => {
    const num = parseInt(n.split("-").pop() ?? "", 10);
    return Number.isFinite(num) ? Math.max(m, num) : m;
  }, start - 1);
  return `${prefix}-${max + 1}`;
}

// ── Demo clock ────────────────────────────────────────────────
// Lets an admin "fast-forward" time to demonstrate month-end billing,
// the 5-day grace window, and listing expiry without waiting. When unset,
// the real system clock is used. Billing logic reads nowDate().
let demoNow: string | null = null;
export function nowDate(): Date {
  return demoNow ? new Date(demoNow) : new Date();
}
export function nowIso(): string {
  return nowDate().toISOString();
}
function formatHumanDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
export async function getClock(): Promise<string | null> {
  return latency(demoNow);
}
export async function setClock(iso: string | null): Promise<void> {
  demoNow = iso;
  await latency(null);
}

const RETENTION_MS = CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const isFresh = (iso: string) => nowDate().getTime() - new Date(iso).getTime() <= RETENTION_MS;
function pruneOld<T extends { createdAt: string }>(arr: T[]) {
  for (let i = arr.length - 1; i >= 0; i--) if (!isFresh(arr[i].createdAt)) arr.splice(i, 1);
}

// ── Profiles ──────────────────────────────────────────────────
export async function listProfiles(): Promise<Profile[]> {
  return latency([...profiles]);
}
export async function findProfileByEmail(email: string): Promise<Profile | undefined> {
  return latency(profiles.find((p) => p.email === email));
}
export async function findProfileById(id: string): Promise<Profile | undefined> {
  return latency(profiles.find((p) => p.id === id));
}
// Compute when a premium term next renews/expires. Monthly accounts renew
// on the LAST day of next month (billing is always month-end); annual
// renews at month-end a year out. Uses the demo clock via nowDate().
function computeRenewal(interval: BillingInterval): string {
  const now = nowDate();
  if (interval === "annual") {
    return billing.periodEnd(billing.addMonths(now, 12)).toISOString();
  }
  return billing.nextPeriodEnd(now).toISOString();
}

// Single source of truth for a user's subscription. Premium locks in a
// billing interval + renewal date; downgrading to basic clears both.
export async function setProfileSubscription(
  userId: string,
  plan: Plan,
  interval: BillingInterval = "monthly"
): Promise<void> {
  const p = profiles.find((x) => x.id === userId);
  if (p) {
    p.plan = plan;
    if (plan === "premium") {
      p.planInterval = interval;
      p.planRenewsAt = computeRenewal(interval);
    } else {
      p.planInterval = null;
      p.planRenewsAt = null;
    }
  }
  await latency(null);
}

export async function setProfilePlan(userId: string, plan: Plan): Promise<void> {
  await setProfileSubscription(userId, plan);
}
export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, "username" | "defaultShowPrice" | "defaultShowAttachments">>
): Promise<Profile | undefined> {
  const p = profiles.find((x) => x.id === userId);
  if (p) Object.assign(p, patch);
  return latency(p);
}
export async function updateChatPrivacy(
  userId: string,
  patch: Partial<Pick<Profile, "chatVisibility" | "allowFriendRequests">>
): Promise<Profile | undefined> {
  const p = profiles.find((x) => x.id === userId);
  if (p) Object.assign(p, patch);
  return latency(p);
}
export async function findProfileByCode(code: string): Promise<Profile | undefined> {
  const c = code.trim().toUpperCase();
  return latency(profiles.find((p) => p.code.toUpperCase() === c));
}
export async function searchDiscoverableUsers(query: string, excludeId: string): Promise<Profile[]> {
  const q = query.trim().toLowerCase();
  return latency(
    profiles.filter(
      (p) =>
        p.id !== excludeId &&
        p.chatVisibility === "everyone" &&
        (q === "" || p.username.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
    )
  );
}

// ── Properties ────────────────────────────────────────────────
export async function listProperties(): Promise<Property[]> {
  if (USE_PRISMA) return apiGet<Property[]>("/api/properties");
  return latency(
    [...properties].filter((p) => !isListingExpired(p)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
export async function findPropertyById(id: string): Promise<Property | undefined> {
  return latency(properties.find((p) => p.id === id));
}
// Like findPropertyById but returns undefined for expired listings, so a
// direct link to an expired listing shows the not-found state.
export async function findVisiblePropertyById(id: string): Promise<Property | undefined> {
  if (USE_PRISMA) {
    const r = await fetch(`/api/properties/${encodeURIComponent(id)}`);
    return r.ok ? ((await r.json()) as Property) : undefined;
  }
  const p = properties.find((x) => x.id === id);
  return latency(p && !isListingExpired(p) ? p : undefined);
}
export async function listPropertiesByOwner(ownerId: string): Promise<Property[]> {
  if (USE_PRISMA) return apiGet<Property[]>(`/api/properties?ownerId=${encodeURIComponent(ownerId)}`);
  return latency(
    properties
      .filter((p) => p.ownerId === ownerId && !isListingExpired(p))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
export async function createProperty(
  input: Omit<Property, "id" | "createdAt" | "attachments"> & {
    attachments?: Omit<PropertyAttachment, "id" | "propertyId">[];
  }
): Promise<Property> {
  if (USE_PRISMA) return apiSend<Property>("/api/properties", "POST", input);
  // Enforce the Basic-plan listing cap. Premium is unlimited.
  const owner = profiles.find((p) => p.id === input.ownerId);
  if (owner && owner.plan === "basic") {
    const count = properties.filter((p) => p.ownerId === owner.id && !isListingExpired(p)).length;
    if (count >= BASIC_LISTING_CAP) {
      throw new Error(
        `Basic plan is limited to ${BASIC_LISTING_CAP} listings. Upgrade to Premium for unlimited listings.`
      );
    }
  }
  const id = uid("p");
  const property: Property = {
    ...input,
    id,
    createdAt: nowIso(),
    attachments: (input.attachments ?? []).map((a) => ({ ...a, id: uid("a"), propertyId: id })),
  };
  properties.unshift(property);
  return latency(property);
}
export async function updateProperty(
  id: string,
  patch: Partial<
    Pick<
      Property,
      | "showPrice" | "showAttachments" | "title" | "price" | "description"
      | "location" | "latitude" | "longitude" | "type" | "tags" | "photos"
      | "ats" | "atsVisibility" | "requiresLOI"
    >
  >
): Promise<Property | undefined> {
  if (USE_PRISMA) return apiSend<Property>(`/api/properties/${encodeURIComponent(id)}`, "PATCH", patch);
  const p = properties.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
  return latency(p);
}
export async function updateOwnerVisibility(
  ownerId: string,
  patch: Partial<Pick<Property, "showPrice" | "showAttachments">>
): Promise<void> {
  properties.forEach((p) => {
    if (p.ownerId === ownerId) Object.assign(p, patch);
  });
  await latency(null);
}
export async function deleteProperty(id: string): Promise<void> {
  if (USE_PRISMA) {
    await apiSend(`/api/properties/${encodeURIComponent(id)}`, "DELETE");
    return;
  }
  const i = properties.findIndex((p) => p.id === id);
  if (i >= 0) properties.splice(i, 1);
  await latency(null);
}

export async function queryListings(
  filters: ListingFilters,
  page: number,
  perPage: number
): Promise<Paginated<Property>> {
  if (USE_PRISMA)
    return apiSend<Paginated<Property>>("/api/properties/query", "POST", { filters, page, perPage });
  const filtered = properties
    .filter((p) => !isListingExpired(p) && matchesListingFilters(p, filters))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const from = (page - 1) * perPage;
  return latency({ items: filtered.slice(from, from + perPage), totalCount: filtered.length });
}

// ── Property requests (documents / ATS) + per-request chat ────
export async function getRequest(
  propertyId: string,
  requesterId: string,
  kind: RequestKind
): Promise<PropertyRequest | undefined> {
  return latency(
    propertyRequests.find(
      (r) => r.propertyId === propertyId && r.requesterId === requesterId && r.kind === kind
    )
  );
}
export async function hasAccess(
  propertyId: string,
  userId: string,
  kind: RequestKind
): Promise<boolean> {
  return latency(
    propertyRequests.some(
      (r) =>
        r.propertyId === propertyId &&
        r.requesterId === userId &&
        r.kind === kind &&
        r.status === "approved"
    )
  );
}
export async function createPropertyRequest(input: {
  property: Property;
  requester: Profile;
  kind: RequestKind;
  requesterName: string;
  message: string;
  loiFilename?: string;
}): Promise<PropertyRequest> {
  const { property, requester, kind, requesterName, message, loiFilename } = input;
  let req = propertyRequests.find(
    (r) => r.propertyId === property.id && r.requesterId === requester.id && r.kind === kind
  );
  if (req) {
    if (req.status === "denied") req.status = "pending";
    req.message = message;
    req.requesterName = requesterName;
    req.loiFilename = loiFilename;
  } else {
    req = {
      id: uid("pr"),
      propertyId: property.id,
      propertyTitle: property.title,
      kind,
      requesterId: requester.id,
      requesterName,
      requesterEmail: requester.email,
      requesterCode: requester.code,
      ownerId: property.ownerId,
      ownerEmail: property.ownerEmail,
      message,
      loiFilename,
      status: "pending",
      createdAt: nowIso(),
    };
    propertyRequests.push(req);
  }
  notifications.push({
    id: uid("ntf"),
    userId: property.ownerId,
    type: "request_new",
    title: kind === "ats" ? "New ATS request" : "New document request",
    body: `${requesterName} requested ${kind === "ats" ? "the ATS" : "documents"} for ${property.title}.`,
    link: `/my-listings?tab=requests&open=${req.id}`,
    requestId: req.id,
    requestKind: kind,
    read: false,
    createdAt: nowIso(),
  });
  return latency(req);
}
export async function respondToRequest(
  requestId: string,
  approve: boolean
): Promise<PropertyRequest | undefined> {
  const req = propertyRequests.find((r) => r.id === requestId);
  if (!req) return latency(undefined);
  req.status = approve ? "approved" : "denied";
  notifications.push({
    id: uid("ntf"),
    userId: req.requesterId,
    type: approve ? "request_approved" : "request_denied",
    title: approve ? "Request approved" : "Request declined",
    body: approve
      ? `You can now view ${req.kind === "ats" ? "the ATS" : "documents"} for ${req.propertyTitle}.`
      : `Your ${req.kind === "ats" ? "ATS" : "document"} request for ${req.propertyTitle} was declined.`,
    link: `/listings/${req.propertyId}`,
    requestId: req.id,
    read: false,
    createdAt: nowIso(),
  });
  return latency(req);
}
export async function listRequestsForOwner(ownerId: string): Promise<PropertyRequest[]> {
  return latency(
    propertyRequests.filter((r) => r.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
export async function listRequestsByRequester(requesterId: string): Promise<PropertyRequest[]> {
  return latency(
    propertyRequests
      .filter((r) => r.requesterId === requesterId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
export async function listRequestMessages(requestId: string): Promise<RequestMessage[]> {
  return latency(
    requestMessages.filter((m) => m.requestId === requestId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
}
export async function sendRequestMessage(
  input: Omit<RequestMessage, "id" | "createdAt">
): Promise<RequestMessage> {
  const msg: RequestMessage = { ...input, id: uid("rm"), createdAt: nowIso() };
  requestMessages.push(msg);
  const req = propertyRequests.find((r) => r.id === input.requestId);
  if (req) {
    const recipient = input.senderId === req.ownerId ? req.requesterId : req.ownerId;
    notifications.push({
      id: uid("ntf"),
      userId: recipient,
      type: "request_message",
      title: "New message on a request",
      body: `New message about ${req.propertyTitle}.`,
      link: `/my-listings?tab=requests&open=${req.id}`,
      requestId: req.id,
      read: false,
      createdAt: nowIso(),
    });
  }
  return latency(msg);
}

// ── Notifications ─────────────────────────────────────────────
export async function listNotifications(userId: string): Promise<AppNotification[]> {
  return latency(
    notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
export async function markNotificationRead(id: string): Promise<void> {
  const n = notifications.find((x) => x.id === id);
  if (n) n.read = true;
  await latency(null);
}
export async function markAllNotificationsRead(userId: string): Promise<void> {
  notifications.forEach((n) => {
    if (n.userId === userId) n.read = true;
  });
  await latency(null);
}

// ── Chat: groups + world + direct (7-day retention) ───────────
export async function listChatGroups(): Promise<ChatGroup[]> {
  return latency([...chatGroups].sort((a, b) => a.name.localeCompare(b.name)));
}
// Only the groups the user belongs to (or created) — groups are private.
export async function listGroupsForUser(userId: string): Promise<ChatGroup[]> {
  const u = profiles.find((p) => p.id === userId);
  return latency(
    chatGroups
      .filter((g) => (groupMembers[g.id] ?? []).includes(userId) || (!!u && g.createdByEmail === u.email))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}
export async function listGroupMembers(groupId: string): Promise<Profile[]> {
  const ids = groupMembers[groupId] ?? [];
  return latency(profiles.filter((p) => ids.includes(p.id)));
}
export async function createGroup(
  name: string,
  createdByEmail: string,
  memberEmails: string[]
): Promise<ChatGroup> {
  const group: ChatGroup = { id: uid("g"), name, createdByEmail };
  chatGroups.push(group);
  const emails = Array.from(new Set([createdByEmail, ...memberEmails]));
  groupMembers[group.id] = profiles.filter((p) => emails.includes(p.email)).map((p) => p.id);
  return latency(group);
}
export async function renameGroup(groupId: string, name: string): Promise<void> {
  const g = chatGroups.find((x) => x.id === groupId);
  if (g) g.name = name;
  await latency(null);
}
export async function deleteGroup(groupId: string): Promise<void> {
  const i = chatGroups.findIndex((g) => g.id === groupId);
  if (i >= 0) chatGroups.splice(i, 1);
  delete groupMembers[groupId];
  for (let j = messages.length - 1; j >= 0; j--)
    if (messages[j].groupId === groupId) messages.splice(j, 1);
  await latency(null);
}
export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  const list = groupMembers[groupId] ?? (groupMembers[groupId] = []);
  if (!list.includes(userId)) list.push(userId);
  await latency(null);
}
export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  groupMembers[groupId] = (groupMembers[groupId] ?? []).filter((id) => id !== userId);
  await latency(null);
}
export async function listGroupMessages(groupId: string): Promise<Message[]> {
  pruneOld(messages);
  return latency(
    messages.filter((m) => m.groupId === groupId && isFresh(m.createdAt)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
}
export async function sendGroupMessage(input: Omit<Message, "id" | "createdAt">): Promise<Message> {
  const msg: Message = { ...input, id: uid("m"), createdAt: nowIso() };
  messages.push(msg);
  return latency(msg);
}
export async function listWorldMessages(): Promise<WorldMessage[]> {
  pruneOld(worldMessages);
  return latency(
    worldMessages.filter((m) => isFresh(m.createdAt)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
}
export async function sendWorldMessage(input: Omit<WorldMessage, "id" | "createdAt">): Promise<WorldMessage> {
  const msg: WorldMessage = { ...input, id: uid("w"), createdAt: nowIso() };
  worldMessages.push(msg);
  return latency(msg);
}
export async function listThreadsForUser(userId: string): Promise<DirectThread[]> {
  return latency(
    directThreads.filter((t) => t.participantIds.includes(userId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
export async function getOrCreateThread(a: Profile, b: Profile): Promise<DirectThread> {
  const existing = directThreads.find(
    (t) => t.participantIds.includes(a.id) && t.participantIds.includes(b.id)
  );
  if (existing) return latency(existing);
  const thread: DirectThread = {
    id: uid("dt"),
    participantIds: [a.id, b.id],
    participantEmails: [a.email, b.email],
    createdAt: nowIso(),
  };
  directThreads.push(thread);
  return latency(thread);
}
export async function listDirectMessages(threadId: string): Promise<DirectMessage[]> {
  pruneOld(directMessages);
  return latency(
    directMessages.filter((m) => m.threadId === threadId && isFresh(m.createdAt)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
}
export async function sendDirectMessage(input: Omit<DirectMessage, "id" | "createdAt">): Promise<DirectMessage> {
  const msg: DirectMessage = { ...input, id: uid("dm"), createdAt: nowIso() };
  directMessages.push(msg);
  return latency(msg);
}

// ── Friend requests + contacts ────────────────────────────────
function contactIds(userId: string): string[] {
  return friendRequests
    .filter((r) => r.status === "accepted" && (r.fromId === userId || r.toId === userId))
    .map((r) => (r.fromId === userId ? r.toId : r.fromId));
}
export async function areContacts(a: string, b: string): Promise<boolean> {
  return latency(contactIds(a).includes(b));
}
export async function listContacts(userId: string): Promise<Profile[]> {
  const ids = contactIds(userId);
  return latency(profiles.filter((p) => ids.includes(p.id)));
}
export async function listAddableUsers(userId: string): Promise<Profile[]> {
  const ids = contactIds(userId);
  return latency(
    profiles.filter((p) => p.id !== userId && (p.chatVisibility === "everyone" || ids.includes(p.id)))
  );
}
export async function listIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  return latency(
    friendRequests.filter((r) => r.toId === userId && r.status === "pending").sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
export async function listOutgoingFriendRequests(userId: string): Promise<FriendRequest[]> {
  return latency(
    friendRequests.filter((r) => r.fromId === userId && r.status === "pending").sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
export async function sendFriendRequest(
  from: Profile,
  to: Profile
): Promise<{ ok: boolean; reason?: string }> {
  if (from.id === to.id) return latency({ ok: false, reason: "That's your own code." });
  if (contactIds(from.id).includes(to.id)) return latency({ ok: false, reason: "You're already connected." });
  if (!to.allowFriendRequests) return latency({ ok: false, reason: "This user isn't accepting requests." });
  const existing = friendRequests.find(
    (r) =>
      r.status === "pending" &&
      ((r.fromId === from.id && r.toId === to.id) || (r.fromId === to.id && r.toId === from.id))
  );
  if (existing) return latency({ ok: false, reason: "A request is already pending." });
  const req: FriendRequest = {
    id: uid("fr"),
    fromId: from.id,
    fromEmail: from.email,
    toId: to.id,
    toEmail: to.email,
    status: "pending",
    createdAt: nowIso(),
  };
  friendRequests.push(req);
  notifications.push({
    id: uid("ntf"),
    userId: to.id,
    type: "friend_request",
    title: "New friend request",
    body: `${from.username || from.email} wants to connect with you.`,
    link: "/people",
    requestId: req.id,
    read: false,
    createdAt: nowIso(),
  });
  return latency({ ok: true });
}
export async function respondFriendRequest(requestId: string, accept: boolean): Promise<void> {
  const req = friendRequests.find((r) => r.id === requestId);
  if (!req) return latency(undefined);
  req.status = accept ? "accepted" : "declined";
  notifications.push({
    id: uid("ntf"),
    userId: req.fromId,
    type: accept ? "friend_accepted" : "admin_notice",
    title: accept ? "Friend request accepted" : "Friend request declined",
    body: accept
      ? `${req.toEmail} accepted your request. You can now message each other.`
      : `${req.toEmail} declined your connection request.`,
    link: "/people",
    requestId: req.id,
    read: false,
    createdAt: nowIso(),
  });
  await latency(null);
}

// ── Admin: payments + settings ────────────────────────────────
export async function listPendingPayments(): Promise<Payment[]> {
  return latency(payments.filter((p) => p.status === "pending").sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
export async function approvePayment(admin: Profile, paymentId: string, userId: string, plan: Plan): Promise<Invoice | undefined> {
  const now = nowDate();
  const pay = payments.find((p) => p.id === paymentId);
  // Idempotency: if already reviewed (e.g. a second admin clicked Approve),
  // don't issue a duplicate invoice — return the existing one.
  if (pay && pay.status !== "pending") {
    return latency(pay.invoiceId ? invoices.find((i) => i.id === pay.invoiceId) : undefined);
  }
  if (pay) pay.status = "approved";
  // Lock in the plan AND the billing term the user paid for.
  const interval: BillingInterval = pay?.interval ?? "monthly";
  await setProfileSubscription(userId, plan, interval);
  const u = profiles.find((p) => p.id === userId);

  // Issue an invoice for the period the payment covers.
  const periodStart = pay?.periodStart ?? billing.periodStart(now).toISOString();
  const periodEnd = pay?.periodEnd ?? billing.periodEnd(now).toISOString();
  const amount = interval === "annual" ? PREMIUM_PRICE_ANNUAL : PREMIUM_PRICE_MONTHLY;
  const invoice: Invoice = {
    id: uid("inv"),
    number: invoiceNumber(now),
    userId,
    userEmail: u?.email ?? userId,
    plan,
    interval,
    amount,
    periodStart,
    periodEnd,
    dueDate: periodEnd,
    status: "paid",
    paymentId: pay?.id,
    proofUrl: pay?.attachmentUrl ?? null,
    reference: pay?.reference,
    issuedAt: now.toISOString(),
    issuedBy: admin.email,
  };
  invoices.unshift(invoice);
  if (pay) {
    pay.reviewedAt = now.toISOString();
    pay.reviewedBy = admin.email;
    pay.invoiceId = invoice.id;
    pay.periodStart = periodStart;
    pay.periodEnd = periodEnd;
  }

  logAction(admin, "Approved payment", u?.email ?? userId, `${plan} (${interval}) · ${invoice.number} · ref ${pay?.reference ?? ""}`);
  if (u) {
    pushNotif(
      u.id,
      "invoice_issued",
      "Payment approved — invoice ready",
      `Your ${plan} plan (${interval}) is active. Invoice ${invoice.number} is ready to download.`,
      "/subscription"
    );
  }
  return latency(invoice);
}
export async function rejectPayment(admin: Profile, paymentId: string): Promise<void> {
  const pay = payments.find((p) => p.id === paymentId);
  if (pay) {
    pay.status = "rejected";
    pay.reviewedAt = nowIso();
    pay.reviewedBy = admin.email;
  }
  const u = pay ? profiles.find((p) => p.id === pay.userId) : undefined;
  logAction(admin, "Rejected payment", u?.email ?? "", `ref ${pay?.reference ?? ""}`);
  if (u) notifyUser(u.id, "Payment not verified", "Your payment could not be verified. Please re-submit your proof of payment.", "/subscription");
  await latency(null);
}
export async function submitPayment(input: Omit<Payment, "id" | "createdAt" | "status">): Promise<Payment> {
  const now = nowDate();
  const pay: Payment = {
    ...input,
    id: uid("pay"),
    status: "pending",
    createdAt: now.toISOString(),
    periodStart: input.periodStart ?? billing.periodStart(now).toISOString(),
    periodEnd: input.periodEnd ?? billing.periodEnd(now).toISOString(),
  };
  payments.push(pay);
  const u = profiles.find((p) => p.id === pay.userId);
  notifyAllAdmins(
    "New payment to review",
    `${u?.email ?? pay.userId} submitted proof for ${pay.plan} (${pay.interval}) · ref ${pay.reference}.`
  );
  return latency(pay);
}
export async function getSetting(key: string): Promise<string | undefined> {
  return latency(settings.find((s) => s.key === key)?.value);
}

export { HAS_ATS_TAG };
export type { ChatVisibility };

// Owner provides the ATS (as an attachment) in response to a request,
// which approves it and notifies the requester.
export async function provideAts(requestId: string, atsFilename: string): Promise<PropertyRequest | undefined> {
  const req = propertyRequests.find((r) => r.id === requestId);
  if (!req) return latency(undefined);
  req.status = "approved";
  req.atsProvidedFilename = atsFilename;
  notifications.push({
    id: uid("ntf"),
    userId: req.requesterId,
    type: "request_approved",
    title: "ATS provided",
    body: `The owner shared the ATS for ${req.propertyTitle}.`,
    link: `/listings/${req.propertyId}`,
    requestId: req.id,
    read: false,
    createdAt: nowIso(),
  });
  return latency(req);
}

// ── Admin: audit, users, plan, activation, password, messaging ─
function logAction(admin: Profile, action: string, target: string, detail?: string) {
  auditLogs.unshift({
    id: uid("log"),
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    target,
    detail,
    createdAt: nowIso(),
  });
}
function pushNotif(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link: string
) {
  notifications.push({
    id: uid("ntf"),
    userId,
    type,
    title,
    body,
    link,
    read: false,
    createdAt: nowIso(),
  });
}
function notifyUser(userId: string, title: string, body: string, link = "/account") {
  pushNotif(userId, "admin_notice", title, body, link);
}
function notifyAllAdmins(title: string, body: string, link = "/admin/accounting") {
  profiles.filter((p) => p.isAdmin).forEach((a) => pushNotif(a.id, "payment_submitted", title, body, link));
}
function notifyBilling(userId: string, title: string, body: string, link = "/subscription") {
  pushNotif(userId, "billing_warning", title, body, link);
}
// Next sequential invoice number, e.g. INV-2026-0007.
function invoiceNumber(d: Date): string {
  // Max existing suffix for this year + 1 — robust to deletions and year resets.
  const prefix = `INV-${d.getFullYear()}-`;
  const max = invoices.reduce((m, inv) => {
    if (!inv.number.startsWith(prefix)) return m;
    const n = parseInt(inv.number.slice(prefix.length), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
// A free (basic) listing is expired once past 6 months old or 2 months of
// owner inactivity. Premium listings never expire.
function isListingExpired(p: Property): boolean {
  const owner = profiles.find((o) => o.id === p.ownerId);
  if (!owner || owner.plan !== "basic") return false;
  return billing.isFreeListingExpired(p.createdAt, owner.lastActiveAt, nowDate());
}

export async function listUsersForAdmin(): Promise<Profile[]> {
  return latency([...profiles].sort((a, b) => a.email.localeCompare(b.email)));
}
export async function listAuditLogs(): Promise<AuditLog[]> {
  return latency([...auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
export async function adminSetUserPlan(
  admin: Profile,
  userId: string,
  plan: Plan,
  interval: BillingInterval = "monthly"
): Promise<void> {
  const u = profiles.find((p) => p.id === userId);
  if (!u) return latency(undefined);
  const prevPlan = u.plan;
  const prevInterval = u.planInterval;
  // No-op if neither the plan nor (for premium) the billing term changed.
  if (prevPlan === plan && (plan === "basic" || prevInterval === interval)) {
    return latency(undefined);
  }
  await setProfileSubscription(userId, plan, interval);
  const action =
    plan === "basic"
      ? "Downgraded plan"
      : prevPlan === "basic"
        ? "Upgraded plan"
        : "Changed billing term";
  const detail =
    plan === "premium" ? `${prevPlan} → premium (${interval})` : `${prevPlan} → basic`;
  logAction(admin, action, u.email, detail);
  notifyUser(
    u.id,
    "Your plan was updated",
    plan === "premium"
      ? `An admin set your plan to premium (${interval}).`
      : "An admin set your plan to basic.",
    "/subscription"
  );
  await latency(null);
}
export async function adminSetUserActive(admin: Profile, userId: string, active: boolean): Promise<void> {
  if (admin.id === userId && !active) return latency(undefined); // can't deactivate yourself
  const u = profiles.find((p) => p.id === userId);
  if (!u) return latency(undefined);
  u.active = active;
  logAction(admin, active ? "Activated account" : "Deactivated account", u.email);
  notifyUser(
    u.id,
    active ? "Account reactivated" : "Account deactivated",
    active ? "Your account has been reactivated." : "Your account was deactivated by an admin.",
  );
  await latency(null);
}
export async function adminResetPassword(admin: Profile, userId: string): Promise<string> {
  const u = profiles.find((p) => p.id === userId);
  const temp = `WC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  if (u) {
    logAction(admin, "Reset password", u.email, "Temporary password issued");
    notifyUser(u.id, "Password reset", "An admin reset your password. A temporary password was issued — contact support to retrieve it.");
  }
  return latency(temp);
}
export async function adminMessageUser(admin: Profile, target: Profile, content: string): Promise<void> {
  const thread = await getOrCreateThread(admin, target);
  await sendDirectMessage({
    threadId: thread.id,
    senderId: admin.id,
    senderEmail: admin.email,
    content,
    contentType: "text",
  });
  notifyUser(target.id, "Message from an admin", content.slice(0, 90), "/messages");
  logAction(admin, "Messaged user", target.email);
  await latency(null);
}

// ── Billing: invoices, payment history, month-end cycle ───────
export async function listInvoices(): Promise<Invoice[]> {
  return latency([...invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)));
}
export async function listInvoicesForUser(userId: string): Promise<Invoice[]> {
  return latency(
    invoices.filter((i) => i.userId === userId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
  );
}
export async function getInvoice(id: string): Promise<Invoice | undefined> {
  return latency(invoices.find((i) => i.id === id));
}
export async function listAllPayments(): Promise<Payment[]> {
  return latency([...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
export async function listPaymentsForUser(userId: string): Promise<Payment[]> {
  return latency(
    payments.filter((p) => p.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

// Bump a user's activity timestamp (resets the 2-month inactivity clock).
export async function markActive(userId: string): Promise<void> {
  const u = profiles.find((p) => p.id === userId);
  if (u) u.lastActiveAt = nowIso();
  await latency(null);
}

export interface BillingRunResult {
  date: string;
  downgraded: number;
  warned: number;
  expiredListings: number;
}

// Process the month-end cycle as of the (demo) clock:
//  • premium accounts past the 5-day grace window are downgraded to Basic,
//    and any listings beyond the Basic cap are permanently deleted;
//  • accounts inside the grace window get a reminder;
//  • expired free listings (6 months old, or 2 months inactivity) are deleted.
export async function runBillingCycle(admin: Profile): Promise<BillingRunResult> {
  const now = nowDate();
  let downgraded = 0;
  let warned = 0;
  let expiredListings = 0;

  for (const u of profiles) {
    if (u.plan !== "premium" || !u.planRenewsAt) continue;
    const state = billing.billingState(u.planRenewsAt, now);
    if (state === "overdue") {
      u.plan = "basic";
      u.planInterval = null;
      u.planRenewsAt = null;
      downgraded++;
      // Delete listings beyond the Basic cap (keep the most recent ones).
      const mine = properties
        .filter((p) => p.ownerId === u.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const overCap = mine.slice(BASIC_LISTING_CAP);
      overCap.forEach((p) => {
        const i = properties.findIndex((x) => x.id === p.id);
        if (i >= 0) properties.splice(i, 1);
      });
      logAction(
        admin,
        "Auto-downgraded (unpaid)",
        u.email,
        `past ${billing.GRACE_DAYS}-day grace · removed ${overCap.length} listing(s) over cap`
      );
      notifyBilling(
        u.id,
        "Account downgraded to Basic",
        `We didn't receive payment within the ${billing.GRACE_DAYS}-day grace period, so your account is now Basic.` +
          (overCap.length
            ? ` ${overCap.length} listing(s) over the ${BASIC_LISTING_CAP}-listing limit were removed.`
            : "")
      );
    } else if (state === "grace") {
      warned++;
      notifyBilling(
        u.id,
        "Payment overdue — grace period",
        `Your payment was due on the last day of the month. Please pay within ${billing.GRACE_DAYS} days to avoid being downgraded to Basic.`
      );
    }
  }

  // Expire free listings (runs after downgrades so newly-Basic users are included).
  for (let i = properties.length - 1; i >= 0; i--) {
    const p = properties[i];
    const owner = profiles.find((o) => o.id === p.ownerId);
    if (owner && owner.plan === "basic" && billing.isFreeListingExpired(p.createdAt, owner.lastActiveAt, now)) {
      properties.splice(i, 1);
      expiredListings++;
      notifyBilling(
        owner.id,
        "Listing expired & removed",
        `Your free listing "${p.title}" expired (free listings last ${billing.FREE_LISTING_MAX_AGE_MONTHS} months, or ${billing.INACTIVITY_EXPIRY_MONTHS} months of inactivity) and was removed from the marketplace.`
      );
    }
  }

  logAction(
    admin,
    "Ran billing cycle",
    billing.periodLabel(now),
    `downgraded ${downgraded}, grace warnings ${warned}, expired listings ${expiredListings}`
  );
  return latency({ date: now.toISOString(), downgraded, warned, expiredListings });
}

// ── Support tickets ───────────────────────────────────────────
function notifyAdmins(type: NotificationType, title: string, body: string, link: string) {
  profiles.filter((p) => p.isAdmin).forEach((a) => pushNotif(a.id, type, title, body, link));
}

export async function createTicket(input: {
  userId: string;
  userEmail: string;
  plan: Plan;
  priority: boolean;
  category: TicketCategory;
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  const now = nowIso();
  const ticket: SupportTicket = {
    id: uid("tkt"),
    number: nextNumber("TKT", supportTickets.map((t) => t.number)),
    ...input,
    status: "open",
    createdAt: now,
    updatedAt: now,
    replies: [],
  };
  supportTickets.unshift(ticket);
  notifyAdmins(
    "ticket_update",
    `New ${input.priority ? "priority " : ""}support ticket`,
    `${input.userEmail}: ${input.subject}`,
    "/admin/tickets"
  );
  return latency(ticket);
}

export async function listTickets(): Promise<SupportTicket[]> {
  return latency(
    [...supportTickets].sort((a, b) => {
      // open first, then priority, then most recently updated
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    })
  );
}
export async function listTicketsForUser(userId: string): Promise<SupportTicket[]> {
  return latency(
    supportTickets.filter((t) => t.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}
export async function getTicket(id: string): Promise<SupportTicket | undefined> {
  return latency(supportTickets.find((t) => t.id === id));
}
export async function replyTicket(ticketId: string, from: Profile, body: string): Promise<SupportTicket | undefined> {
  const t = supportTickets.find((x) => x.id === ticketId);
  if (!t) return latency(undefined);
  const now = nowIso();
  t.replies.push({
    id: uid("trp"),
    ticketId,
    fromEmail: from.email,
    isAdmin: from.isAdmin,
    body,
    createdAt: now,
  });
  t.updatedAt = now;
  if (from.isAdmin) {
    // re-open if it was resolved and notify the user
    if (t.status === "resolved") t.status = "open";
    pushNotif(t.userId, "ticket_update", "Support replied", `Re: ${t.subject}`, "/support");
  } else {
    notifyAdmins("ticket_update", "Ticket reply", `${from.email}: ${t.subject}`, "/admin/tickets");
  }
  return latency(t);
}
export async function setTicketStatus(admin: Profile, ticketId: string, status: TicketStatus): Promise<void> {
  const t = supportTickets.find((x) => x.id === ticketId);
  if (!t) return latency(undefined);
  t.status = status;
  t.updatedAt = nowIso();
  logAction(admin, status === "resolved" ? "Resolved ticket" : "Reopened ticket", t.userEmail, t.number);
  pushNotif(
    t.userId,
    "ticket_update",
    status === "resolved" ? "Ticket resolved" : "Ticket reopened",
    t.subject,
    "/support"
  );
  await latency(null);
}

// ── Billing: bulk payment-due reminders ───────────────────────
export async function sendPaymentReminder(
  admin: Profile,
  userIds: string[],
  dueDateIso: string
): Promise<number> {
  const due = formatHumanDate(dueDateIso);
  let count = 0;
  userIds.forEach((id) => {
    const u = profiles.find((p) => p.id === id);
    if (!u) return;
    notifyBilling(
      u.id,
      "Payment reminder",
      `Your payment is due by ${due}. Please settle before then or your account will be moved to Basic.`
    );
    count++;
  });
  logAction(admin, "Sent payment reminders", `${count} user(s)`, `due ${due}`);
  await latency(null);
  return count;
}

// ── AI Tools (paid, admin-processed requests) ─────────────────
export async function submitAiRequest(input: {
  userId: string;
  userEmail: string;
  type: AiToolType;
  price: number;
  description: string;
  documents: AiFile[];
  proofUrl: string | null;
}): Promise<AiRequest> {
  const now = nowIso();
  const req: AiRequest = {
    id: uid("air"),
    number: nextNumber("AIR", aiRequests.map((r) => r.number)),
    ...input,
    price: aiPrice(input.type), // derive server-side; never trust the client price
    status: "pending",
    resultDocuments: [],
    createdAt: now,
    updatedAt: now,
  };
  aiRequests.unshift(req);
  notifyAdmins(
    "ai_update",
    "New AI request to process",
    `${input.userEmail}: ${input.type === "comparison" ? "Property Comparison" : "Property Analysis"} (₱${aiPrice(input.type)})`,
    "/admin/ai-requests"
  );
  return latency(req);
}

export async function listAiRequests(): Promise<AiRequest[]> {
  return latency(
    [...aiRequests].sort((a, b) => {
      if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    })
  );
}
export async function listAiRequestsForUser(userId: string): Promise<AiRequest[]> {
  return latency(
    aiRequests.filter((r) => r.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}
export async function getAiRequest(id: string): Promise<AiRequest | undefined> {
  return latency(aiRequests.find((r) => r.id === id));
}

// Admin reviews a request: mark completed (with delivered documents),
// rejected (with notes), or back to pending. Notifies the user.
export async function reviewAiRequest(
  admin: Profile,
  id: string,
  status: AiRequestStatus,
  opts: { notes?: string; resultDocuments?: AiFile[] } = {}
): Promise<AiRequest | undefined> {
  const r = aiRequests.find((x) => x.id === id);
  if (!r) return latency(undefined);
  r.status = status;
  r.reviewedBy = admin.email;
  r.updatedAt = nowIso();
  if (opts.notes !== undefined) r.adminNotes = opts.notes;
  if (opts.resultDocuments) r.resultDocuments = opts.resultDocuments;
  if (status !== "completed") r.resultDocuments = []; // only completed delivers docs

  logAction(admin, `AI request ${status}`, r.userEmail, r.number);
  const msg =
    status === "completed"
      ? "Your AI request is ready — the documents are available to download."
      : status === "rejected"
        ? `Your AI request was rejected.${opts.notes ? ` Note: ${opts.notes}` : ""}`
        : "Your AI request is being processed.";
  pushNotif(r.userId, "ai_update", `AI request ${status}`, msg, "/ai-tools");
  return latency(r);
}

// ─── Leads Board ────────────────────────────────────────────────
// Pipeline-style lead management (concepts adapted from Krayin CRM).
// Premium-gated in the UI; the data layer dispatches to /api/leads under
// Postgres or mutates the in-memory arrays under the mock data source.
export async function getLeadMeta(): Promise<LeadMeta> {
  if (USE_PRISMA) return apiGet<LeadMeta>("/api/leads/meta");
  return latency({
    stages: [...leadStages].sort((a, b) => a.sortOrder - b.sortOrder),
    sources: [...leadSources],
    types: [...leadTypes],
  });
}

export async function listLeadsByOwner(ownerId: string): Promise<Lead[]> {
  if (USE_PRISMA) return apiGet<Lead[]>(`/api/leads?ownerId=${encodeURIComponent(ownerId)}`);
  const mine = leads
    .filter((l) => l.ownerId === ownerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return latency(
    mine.map((l) => {
      const open = leadActivities
        .filter((a) => a.leadId === l.id && !a.done && a.dueAt)
        .sort((x, y) => (x.dueAt as string).localeCompare(y.dueAt as string));
      return { ...l, nextActionAt: open[0]?.dueAt ?? null };
    })
  );
}

export async function createLead(
  input: Omit<Lead, "id" | "createdAt" | "updatedAt">
): Promise<Lead> {
  if (USE_PRISMA) return apiSend<Lead>("/api/leads", "POST", input);
  const now = nowIso();
  const lead: Lead = { ...input, id: uid("lead"), createdAt: now, updatedAt: now };
  leads.unshift(lead);
  return latency(lead);
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt">>
): Promise<Lead | undefined> {
  if (USE_PRISMA) return apiSend<Lead>(`/api/leads/${encodeURIComponent(id)}`, "PATCH", patch);
  const l = leads.find((x) => x.id === id);
  if (!l) return latency(undefined);
  Object.assign(l, patch, { updatedAt: nowIso() });
  return latency(l);
}

export async function updateLeadStage(
  id: string,
  stageId: string,
  lostReason?: string | null
): Promise<Lead | undefined> {
  if (USE_PRISMA)
    return apiSend<Lead>(`/api/leads/${encodeURIComponent(id)}/stage`, "PATCH", {
      stageId,
      lostReason,
    });
  const l = leads.find((x) => x.id === id);
  if (!l) return latency(undefined);
  const stage = leadStages.find((s) => s.id === stageId);
  const status: LeadStatus = stage?.isWon ? "won" : stage?.isLost ? "lost" : "open";
  l.stageId = stageId;
  l.status = status;
  l.closedAt = stage?.isWon || stage?.isLost ? nowIso() : null;
  l.lostReason = stage?.isLost ? lostReason ?? null : null;
  l.updatedAt = nowIso();
  return latency(l);
}

export async function deleteLead(id: string): Promise<void> {
  if (USE_PRISMA) {
    await apiSend(`/api/leads/${encodeURIComponent(id)}`, "DELETE");
    return;
  }
  const i = leads.findIndex((x) => x.id === id);
  if (i >= 0) leads.splice(i, 1);
  await latency(null);
}

// ─── Favorites / saved listings ─────────────────────────────────
export async function listFavoriteProperties(userId: string): Promise<Property[]> {
  if (USE_PRISMA) return apiGet<Property[]>(`/api/favorites?userId=${encodeURIComponent(userId)}`);
  const ordered = favorites
    .filter((f) => f.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const result = ordered
    .map((f) => properties.find((p) => p.id === f.propertyId))
    .filter((p): p is Property => !!p);
  return latency(result);
}

export async function addFavorite(userId: string, propertyId: string): Promise<void> {
  if (USE_PRISMA) {
    await apiSend("/api/favorites", "POST", { userId, propertyId });
    return;
  }
  if (!favorites.some((f) => f.userId === userId && f.propertyId === propertyId)) {
    favorites.unshift({ id: uid("fav"), userId, propertyId, createdAt: nowIso() });
  }
  await latency(null);
}

export async function removeFavorite(userId: string, propertyId: string): Promise<void> {
  if (USE_PRISMA) {
    await apiSend("/api/favorites", "DELETE", { userId, propertyId });
    return;
  }
  const i = favorites.findIndex((f) => f.userId === userId && f.propertyId === propertyId);
  if (i >= 0) favorites.splice(i, 1);
  await latency(null);
}

// ─── Saved searches ─────────────────────────────────────────────
export async function listSavedSearches(userId: string): Promise<SavedSearchWithCount[]> {
  if (USE_PRISMA)
    return apiGet<SavedSearchWithCount[]>(`/api/saved-searches?userId=${encodeURIComponent(userId)}`);
  const rows = savedSearches
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return latency(
    rows.map((s) => {
      const since = new Date(s.lastViewedAt).getTime();
      const newCount = properties.filter(
        (p) => new Date(p.createdAt).getTime() > since && matchesListingFilters(p, s.filters)
      ).length;
      return { ...s, newCount };
    })
  );
}

export async function createSavedSearch(
  userId: string,
  name: string,
  filters: ListingFilters
): Promise<SavedSearch> {
  if (USE_PRISMA) return apiSend<SavedSearch>("/api/saved-searches", "POST", { userId, name, filters });
  const s: SavedSearch = {
    id: uid("ss"),
    userId,
    name,
    filters,
    notify: true,
    createdAt: nowIso(),
    lastViewedAt: nowIso(),
  };
  savedSearches.unshift(s);
  return latency(s);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  if (USE_PRISMA) {
    await apiSend(`/api/saved-searches/${encodeURIComponent(id)}`, "DELETE");
    return;
  }
  const i = savedSearches.findIndex((s) => s.id === id);
  if (i >= 0) savedSearches.splice(i, 1);
  await latency(null);
}

export async function touchSavedSearch(id: string): Promise<void> {
  if (USE_PRISMA) {
    await apiSend(`/api/saved-searches/${encodeURIComponent(id)}`, "PATCH", { markViewed: true });
    return;
  }
  const s = savedSearches.find((x) => x.id === id);
  if (s) s.lastViewedAt = nowIso();
  await latency(null);
}

export async function setSavedSearchNotify(id: string, notify: boolean): Promise<void> {
  if (USE_PRISMA) {
    await apiSend(`/api/saved-searches/${encodeURIComponent(id)}`, "PATCH", { notify });
    return;
  }
  const s = savedSearches.find((x) => x.id === id);
  if (s) s.notify = notify;
  await latency(null);
}

// ─── Schedule a viewing ─────────────────────────────────────────
type ViewingInput = Omit<Viewing, "id" | "status" | "confirmedAt" | "ownerNote" | "createdAt" | "updatedAt">;

export async function listViewingsForOwner(ownerId: string): Promise<Viewing[]> {
  if (USE_PRISMA) return apiGet<Viewing[]>(`/api/viewings?ownerId=${encodeURIComponent(ownerId)}`);
  return latency(
    viewings.filter((v) => v.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export async function listViewingsForRequester(requesterId: string): Promise<Viewing[]> {
  if (USE_PRISMA) return apiGet<Viewing[]>(`/api/viewings?requesterId=${encodeURIComponent(requesterId)}`);
  return latency(
    viewings.filter((v) => v.requesterId === requesterId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export async function createViewing(input: ViewingInput): Promise<Viewing> {
  if (USE_PRISMA) return apiSend<Viewing>("/api/viewings", "POST", input);
  const now = nowIso();
  const v: Viewing = { ...input, id: uid("vw"), status: "requested", confirmedAt: null, ownerNote: null, createdAt: now, updatedAt: now };
  viewings.unshift(v);
  return latency(v);
}

export async function respondToViewing(
  id: string,
  action: "confirm" | "decline",
  confirmedAt?: string | null,
  ownerNote?: string | null
): Promise<Viewing | undefined> {
  if (USE_PRISMA)
    return apiSend<Viewing>(`/api/viewings/${encodeURIComponent(id)}`, "PATCH", { action, confirmedAt, ownerNote });
  const v = viewings.find((x) => x.id === id);
  if (!v) return latency(undefined);
  if (action === "confirm") {
    v.status = "confirmed";
    v.confirmedAt = confirmedAt ?? v.preferredAt;
    v.ownerNote = ownerNote ?? null;
  } else {
    v.status = "declined";
    v.ownerNote = ownerNote ?? null;
  }
  v.updatedAt = nowIso();
  return latency(v);
}

export async function cancelViewing(id: string): Promise<Viewing | undefined> {
  if (USE_PRISMA)
    return apiSend<Viewing>(`/api/viewings/${encodeURIComponent(id)}`, "PATCH", { action: "cancel" });
  const v = viewings.find((x) => x.id === id);
  if (!v) return latency(undefined);
  v.status = "cancelled";
  v.updatedAt = nowIso();
  return latency(v);
}

// ─── Broker verification (mock; profiles/admin live in this layer) ──
export async function getVerificationRequest(userId: string): Promise<VerificationRequest | undefined> {
  return latency(
    verificationRequests
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  );
}

export async function listVerificationRequests(): Promise<VerificationRequest[]> {
  return latency(
    [...verificationRequests].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
  );
}

export async function submitVerification(
  userId: string,
  input: { company: string; licenseNo: string; message: string }
): Promise<VerificationRequest> {
  const u = profiles.find((p) => p.id === userId);
  const idx = verificationRequests.findIndex((r) => r.userId === userId && r.status === "pending");
  if (idx >= 0) verificationRequests.splice(idx, 1);
  const req: VerificationRequest = {
    id: uid("vr"),
    userId,
    userEmail: u?.email ?? "",
    userName: u?.username ?? "",
    company: input.company,
    licenseNo: input.licenseNo,
    message: input.message,
    status: "pending",
    createdAt: nowIso(),
  };
  verificationRequests.unshift(req);
  return latency(req);
}

export async function reviewVerification(
  id: string,
  approve: boolean,
  reviewerEmail: string
): Promise<VerificationRequest | undefined> {
  const req = verificationRequests.find((r) => r.id === id);
  if (!req) return latency(undefined);
  req.status = approve ? "approved" : "rejected";
  req.reviewedAt = nowIso();
  req.reviewedBy = reviewerEmail;
  if (approve) {
    const u = profiles.find((p) => p.id === req.userId);
    if (u) {
      u.verified = true;
      u.company = req.company;
      u.licenseNo = req.licenseNo;
    }
  }
  auditLogs.unshift({
    id: uid("log"),
    adminId: "u-admin",
    adminEmail: reviewerEmail,
    action: approve ? "Verified broker" : "Rejected verification",
    target: req.userEmail,
    detail: `${req.company} · ${req.licenseNo}`,
    createdAt: nowIso(),
  });
  return latency(req);
}

// ─── Agent reviews & ratings ────────────────────────────────────
type ReviewSubmit = {
  brokerId: string; brokerEmail: string; reviewerId: string; reviewerName: string; reviewerEmail: string;
  communication: number; knowledge: number; honesty: number; comment: string;
};

export async function getBrokerReviews(brokerId: string, viewerId?: string): Promise<BrokerReviewsBundle> {
  if (USE_PRISMA) {
    const q = viewerId
      ? `?brokerId=${encodeURIComponent(brokerId)}&viewerId=${encodeURIComponent(viewerId)}`
      : `?brokerId=${encodeURIComponent(brokerId)}`;
    return apiGet<BrokerReviewsBundle>(`/api/reviews${q}`);
  }
  const list = reviews
    .filter((r) => r.brokerId === brokerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = list.length;
  const average = count ? Math.round((list.reduce((s, r) => s + r.overall, 0) / count) * 10) / 10 : 0;
  const myReview = viewerId ? list.find((r) => r.reviewerId === viewerId) ?? null : null;
  const canReview =
    !!viewerId &&
    viewerId !== brokerId &&
    viewings.some((v) => v.requesterId === viewerId && v.ownerId === brokerId && v.status === "confirmed");
  return latency({ average, count, reviews: list, canReview, myReview });
}

export async function submitReview(input: ReviewSubmit): Promise<Review> {
  if (USE_PRISMA) return apiSend<Review>("/api/reviews", "POST", input);
  const overall = Math.round(((input.communication + input.knowledge + input.honesty) / 3) * 10) / 10;
  const existing = reviews.find((r) => r.brokerId === input.brokerId && r.reviewerId === input.reviewerId);
  if (existing) {
    existing.communication = input.communication;
    existing.knowledge = input.knowledge;
    existing.honesty = input.honesty;
    existing.comment = input.comment;
    existing.overall = overall;
    return latency(existing);
  }
  const rev: Review = { id: uid("rev"), overall, createdAt: nowIso(), ...input };
  reviews.unshift(rev);
  return latency(rev);
}

// ─── Lead activities & follow-ups ───────────────────────────────
export async function listLeadActivities(leadId: string): Promise<LeadActivity[]> {
  if (USE_PRISMA) return apiGet<LeadActivity[]>(`/api/leads/${encodeURIComponent(leadId)}/activities`);
  return latency(
    leadActivities.filter((a) => a.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export async function addLeadActivity(input: {
  leadId: string;
  type: LeadActivityType;
  note: string;
  dueAt?: string | null;
}): Promise<LeadActivity> {
  if (USE_PRISMA)
    return apiSend<LeadActivity>(`/api/leads/${encodeURIComponent(input.leadId)}/activities`, "POST", {
      type: input.type,
      note: input.note,
      dueAt: input.dueAt ?? null,
    });
  const a: LeadActivity = {
    id: uid("la"),
    leadId: input.leadId,
    type: input.type,
    note: input.note,
    dueAt: input.dueAt ?? null,
    done: false,
    createdAt: nowIso(),
  };
  leadActivities.unshift(a);
  return latency(a);
}

export async function setLeadActivityDone(id: string, done: boolean): Promise<LeadActivity | undefined> {
  if (USE_PRISMA) return apiSend<LeadActivity>(`/api/lead-activities/${encodeURIComponent(id)}`, "PATCH", { done });
  const a = leadActivities.find((x) => x.id === id);
  if (!a) return latency(undefined);
  a.done = done;
  return latency(a);
}

export async function deleteLeadActivity(id: string): Promise<void> {
  if (USE_PRISMA) {
    await apiSend(`/api/lead-activities/${encodeURIComponent(id)}`, "DELETE");
    return;
  }
  const i = leadActivities.findIndex((x) => x.id === id);
  if (i >= 0) leadActivities.splice(i, 1);
  await latency(null);
}

// ─── Convert an inbound Request into a Leads Board card ─────────
// The Request lives in this layer; the Lead is created in Neon via createLead,
// then the request is tagged with the new lead's id so it isn't re-converted.
export async function convertRequestToLead(
  requestId: string,
  ownerId: string,
  ownerEmail: string
): Promise<Lead | undefined> {
  const req = propertyRequests.find((r) => r.id === requestId);
  if (!req || req.leadId) return undefined;
  const prop = properties.find((p) => p.id === req.propertyId);
  const lead = await createLead({
    ownerId,
    ownerEmail,
    title: `${req.requesterName} — ${req.propertyTitle}`,
    description: req.message || `Converted from a ${req.kind === "ats" ? "an ATS" : "documents"} request via World Chat.`,
    value: prop?.price ?? 0,
    contactName: req.requesterName,
    contactEmail: req.requesterEmail,
    contactPhone: "",
    propertyId: req.propertyId,
    propertyTitle: req.propertyTitle,
    sourceId: "lsrc-worldchat",
    typeId: "lt-buyer",
    stageId: "ls-new",
    status: "open",
    expectedCloseDate: null,
    closedAt: null,
    lostReason: null,
  });
  req.leadId = lead.id;
  return lead;
}

// ─── Broker analytics ───────────────────────────────────────────
export async function getBrokerAnalytics(ownerId: string): Promise<BrokerAnalytics> {
  if (USE_PRISMA) return apiGet<BrokerAnalytics>(`/api/analytics?ownerId=${encodeURIComponent(ownerId)}`);
  const props = properties.filter((p) => p.ownerId === ownerId);
  const listings = props.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    views: p.views ?? 0,
    saves: favorites.filter((f) => f.propertyId === p.id).length,
    viewings: viewings.filter((v) => v.propertyId === p.id).length,
  }));
  const funnel = [...leadStages]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((st) => {
      const ls = leads.filter((l) => l.ownerId === ownerId && l.stageId === st.id);
      return { stageId: st.id, stageName: st.name, count: ls.length, value: ls.reduce((s, l) => s + l.value, 0) };
    });
  return latency({ listings, funnel });
}

export async function incrementPropertyViews(id: string): Promise<void> {
  if (USE_PRISMA) {
    await apiSend(`/api/properties/${encodeURIComponent(id)}/view`, "POST");
    return;
  }
  const p = properties.find((x) => x.id === id);
  if (p) p.views = (p.views ?? 0) + 1;
  await latency(null);
}
