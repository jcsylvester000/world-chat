// ─── Domain types ───────────────────────────────────────────────
// Mirror the entities the app stores and map 1:1 to the Prisma models
// in prisma/schema.prisma, so the data-service layer can be swapped
// from mock data to real queries without touching the UI.

export type PropertyType =
  | "Office"
  | "Warehouse"
  | "Agricultural"
  | "Mixed Use"
  | "Gas Station"
  | "Retail";

export type PropertyTag =
  | "AsIs"
  | "CleanTitle"
  | "JoinVentures"
  | "CompanyOwned"
  | "IndividualOwner"
  | "LookingToSell"
  | "LookingForBuyer";

// Auto-applied tag when a property has a (non-hidden) Authority to Sell.
export const HAS_ATS_TAG = "HasATS";

export type Plan = "basic" | "premium";
export type BillingInterval = "monthly" | "annual";

export const MAX_ATTACHMENTS = 4;
export const CHAT_RETENTION_DAYS = 7;

export type ChatVisibility = "everyone" | "invite_only" | "hidden";

export interface Profile {
  id: string;
  email: string;
  username: string;
  plan: Plan;
  isAdmin: boolean;
  defaultShowPrice: boolean;
  defaultShowAttachments: boolean;
  code: string;
  chatVisibility: ChatVisibility;
  allowFriendRequests: boolean;
  active: boolean; // account active (admins can deactivate)
  planInterval: BillingInterval | null; // billing term while on premium
  planRenewsAt: string | null; // ISO date the current premium term renews/expires (= month-end due date for monthly)
  lastActiveAt: string; // ISO of last activity (drives free-listing inactivity expiry)
  // ── Broker verification ──
  verified?: boolean;
  company?: string | null; // verified business name
  licenseNo?: string | null; // PRC / DTI / SEC registration
}

export interface PropertyAttachment {
  id: string;
  propertyId: string;
  url: string;
  filename: string;
}

// Authority to Sell document.
export interface AtsDoc {
  url: string;
  filename: string;
}

// How the ATS is exposed to viewers:
//  - hidden:     not shown or advertised at all
//  - on_request: a note appears; viewers must request (and maybe submit an LOI)
//  - document:   shown as a viewable document in its own section
export type AtsVisibility = "hidden" | "on_request" | "document";

export interface Property {
  id: string;
  ownerId: string;
  ownerEmail: string;
  title: string;
  description: string;
  price: number;
  location: string;
  latitude: number;
  longitude: number;
  type: PropertyType;
  tags: string[];
  createdAt: string;
  photos: string[];
  attachments: PropertyAttachment[];
  showPrice: boolean;
  showAttachments: boolean;
  // Authority to Sell
  ats: AtsDoc | null;
  atsVisibility: AtsVisibility;
  requiresLOI: boolean; // require a Letter of Intent to view the ATS
}

export interface ChatGroup {
  id: string;
  name: string;
  createdByEmail: string;
}

export type MessageContentType = "text" | "image" | "attachment";

export interface Message {
  id: string;
  groupId: string;
  userId: string;
  userEmail: string;
  content: string;
  contentType: MessageContentType;
  filename?: string;
  createdAt: string;
}

export interface WorldMessage {
  id: string;
  userId: string;
  userEmail: string;
  content: string;
  contentType: MessageContentType;
  filename?: string;
  createdAt: string;
}

export interface DirectThread {
  id: string;
  participantIds: [string, string];
  participantEmails: [string, string];
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderEmail: string;
  content: string;
  contentType: MessageContentType;
  filename?: string;
  createdAt: string;
}

// ─── Friend / contact requests ──────────────────────────────────
export type FriendStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  id: string;
  fromId: string;
  fromEmail: string;
  toId: string;
  toEmail: string;
  status: FriendStatus;
  createdAt: string;
}

// ─── Property requests (lead capture: documents or ATS) ─────────
export type RequestStatus = "pending" | "approved" | "denied";
export type RequestKind = "documents" | "ats";

export interface PropertyRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  kind: RequestKind;
  requesterId: string;
  requesterName: string; // lead name (editable, defaults to username)
  requesterEmail: string;
  requesterCode: string; // the requester's ID code
  ownerId: string;
  ownerEmail: string;
  message: string; // intro message / Letter of Intent text
  loiFilename?: string; // LOI attachment the buyer provided
  atsProvidedFilename?: string; // ATS attachment the owner provided back
  status: RequestStatus;
  createdAt: string;
}

// Per-request chat — keeps the conversation scoped to one property +
// one requester, even when many people ask about the same listing.
export interface RequestMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderEmail: string;
  content: string;
  contentType: MessageContentType;
  filename?: string;
  createdAt: string;
}

// ─── Notifications (seen by both parties) ───────────────────────
export type NotificationType =
  | "request_new"
  | "request_approved"
  | "request_denied"
  | "request_message"
  | "friend_request"
  | "friend_accepted"
  | "payment_submitted"
  | "invoice_issued"
  | "billing_warning"
  | "ticket_update"
  | "ai_update"
  | "admin_notice";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  requestId?: string;
  requestKind?: RequestKind;
  read: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  plan: Plan;
  interval: BillingInterval;
  reference: string;
  attachmentUrl: string | null; // proof-of-payment screenshot
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  periodStart?: string; // billing period this payment covers
  periodEnd?: string; // = due date (last day of the month)
  reviewedAt?: string;
  reviewedBy?: string; // admin email who reviewed
  invoiceId?: string; // invoice issued on approval
}

export type InvoiceStatus = "paid" | "void";

export interface Invoice {
  id: string;
  number: string; // human invoice no, e.g. INV-2026-0007
  userId: string;
  userEmail: string;
  plan: Plan;
  interval: BillingInterval;
  amount: number; // PHP
  periodStart: string; // 1st of the month
  periodEnd: string; // last day of the month (due date)
  dueDate: string;
  status: InvoiceStatus;
  paymentId?: string;
  proofUrl?: string | null; // proof screenshot reference
  reference?: string; // payment reference no
  issuedAt: string;
  issuedBy?: string; // admin email
}

// ─── Support tickets (Basic = ticket-only support) ──────────────
export type TicketStatus = "open" | "resolved";
export type TicketCategory = "Login" | "Listing" | "Payment" | "Account" | "Bug" | "Other";

export interface TicketReply {
  id: string;
  ticketId: string;
  fromEmail: string;
  isAdmin: boolean;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  number: string; // e.g. TKT-1042
  userId: string;
  userEmail: string;
  plan: Plan; // plan at submission time
  priority: boolean; // premium tickets are prioritized
  category: TicketCategory;
  subject: string;
  message: string; // initial message
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
}

// ─── AI Tools (paid, admin-processed requests) ──────────────────
export type AiToolType = "analysis" | "comparison";
export type AiRequestStatus = "pending" | "completed" | "rejected";

export interface AiFile {
  filename: string;
  url: string; // downloadable/viewable doc (mock points at a sample)
}

export interface AiRequest {
  id: string;
  number: string; // e.g. AIR-1042
  userId: string;
  userEmail: string;
  type: AiToolType;
  price: number; // PHP charged for this request
  description: string; // what the user wants
  documents: AiFile[]; // property documents the user uploaded
  proofUrl: string | null; // proof-of-payment screenshot
  status: AiRequestStatus;
  adminNotes?: string; // notes (esp. on rejection)
  resultDocuments: AiFile[]; // documents the admin delivered
  reviewedBy?: string; // admin email
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  target: string; // affected user (email)
  detail?: string;
  createdAt: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface ListingFilters {
  searchText: string;
  minPrice: number;
  maxPrice: number;
  selectedTags: string[];
  type: PropertyType | "";
  hasAts: "" | "with" | "without";
}

export interface Paginated<T> {
  items: T[];
  totalCount: number;
}

// ─── Leads Board (sales pipeline; concepts adapted from Krayin CRM) ──
export type LeadStatus = "open" | "won" | "lost";

// A pipeline stage = one Kanban column. Ordered by sortOrder; probability is
// the win likelihood; won/lost flags mark the terminal columns.
export interface LeadStage {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
}

export interface LeadType {
  id: string;
  name: string;
}

export interface Lead {
  id: string;
  ownerId: string;
  ownerEmail: string;
  title: string;
  description: string;
  value: number; // ₱ deal value
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  propertyId: string | null; // linked listing (optional)
  propertyTitle: string | null;
  sourceId: string;
  typeId: string;
  stageId: string;
  status: LeadStatus;
  expectedCloseDate: string | null; // ISO date
  closedAt: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string; // bumps on stage move — drives the "stale" highlight
  nextActionAt?: string | null; // earliest open follow-up due date (computed)
}

// Lookup bundle the board needs to render columns + form dropdowns.
export interface LeadMeta {
  stages: LeadStage[];
  sources: LeadSource[];
  types: LeadType[];
}

// Days a lead can sit untouched in a stage before it's flagged "stale".
export const LEAD_ROTTEN_DAYS = 14;

// ─── Favorites / saved listings ─────────────────────────────────
export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
}

// ─── Saved searches + new-listing alerts ────────────────────────
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: ListingFilters;
  notify: boolean; // alerts on/off
  createdAt: string;
  lastViewedAt: string; // anything newer that matches counts as "new"
}

// Returned to the board UI with the count of new matches since lastViewedAt.
export interface SavedSearchWithCount extends SavedSearch {
  newCount: number;
}

// ─── Schedule a viewing ─────────────────────────────────────────
export type ViewingStatus = "requested" | "confirmed" | "declined" | "cancelled";

export interface Viewing {
  id: string;
  propertyId: string;
  propertyTitle: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  ownerId: string;
  ownerEmail: string;
  preferredAt: string; // ISO — the buyer's requested slot
  message: string;
  status: ViewingStatus;
  confirmedAt: string | null; // owner's confirmed slot (may differ = reschedule)
  ownerNote: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Broker verification ────────────────────────────────────────
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  company: string;
  licenseNo: string;
  message: string;
  status: VerificationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// ─── Agent reviews & ratings ────────────────────────────────────
export interface Review {
  id: string;
  brokerId: string;
  brokerEmail: string;
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  communication: number; // 1-5
  knowledge: number; // 1-5 (local market knowledge)
  honesty: number; // 1-5 (honesty about process)
  overall: number; // average of the three
  comment: string;
  createdAt: string;
}

// Everything the listing detail page needs to render a broker's reviews.
export interface BrokerReviewsBundle {
  average: number; // 0 when no reviews
  count: number;
  reviews: Review[];
  canReview: boolean; // viewer had a confirmed viewing with this broker
  myReview: Review | null;
}

// ─── Lead activities & follow-up reminders ──────────────────────
export type LeadActivityType = "call" | "email" | "meeting" | "note" | "task";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  note: string;
  dueAt: string | null; // set for follow-up tasks
  done: boolean;
  createdAt: string;
}
