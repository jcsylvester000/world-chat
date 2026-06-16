import type {
  AiRequest,
  Invoice,
  SupportTicket,
  AppNotification,
  AppSetting,
  AuditLog,
  FriendRequest,
  PropertyRequest,
  RequestMessage,
  ChatGroup,
  DirectMessage,
  DirectThread,
  Message,
  Payment,
  Profile,
  Property,
  WorldMessage,
} from "@/lib/types";

// ─── In-memory mock database ────────────────────────────────────
// Seed data used while there is no Postgres backend. The data-service
// layer (lib/data/services.ts) reads/writes these arrays. Swap that
// layer for Prisma later and delete this file.

// Real photos via Lorem Picsum (deterministic by seed). Uploaded
// photos are stored as base64 data URLs in the same `photos` field.
const pic = (seed: string) => `https://picsum.photos/seed/${seed}/1024/640`;

export const profiles: Profile[] = [
  {
    id: "u-admin", email: "admin@worldchat.dev", username: "admin",
    plan: "premium", isAdmin: true,
    defaultShowPrice: true, defaultShowAttachments: true,
    code: "WC-ADMIN1", chatVisibility: "everyone", allowFriendRequests: true, active: true,
    planInterval: "annual", planRenewsAt: "2027-06-30T15:59:59.000Z",
    lastActiveAt: "2026-06-15T08:00:00.000Z",
  },
  {
    id: "u-maria", email: "maria@worldchat.dev", username: "maria",
    plan: "premium", isAdmin: false,
    defaultShowPrice: true, defaultShowAttachments: true,
    code: "WC-MARIA2", chatVisibility: "everyone", allowFriendRequests: true, active: true,
    planInterval: "monthly", planRenewsAt: "2026-06-30T15:59:59.000Z",
    lastActiveAt: "2026-06-14T20:00:00.000Z",
  },
  {
    id: "u-james", email: "james@worldchat.dev", username: "james",
    plan: "basic", isAdmin: false,
    defaultShowPrice: true, defaultShowAttachments: false,
    code: "WC-JAMES3", chatVisibility: "invite_only", allowFriendRequests: true, active: true,
    planInterval: null, planRenewsAt: null,
    lastActiveAt: "2026-06-11T00:00:00.000Z",
  },
  {
    id: "u-lena", email: "lena@worldchat.dev", username: "lena",
    plan: "basic", isAdmin: false,
    defaultShowPrice: false, defaultShowAttachments: true,
    code: "WC-LENA04", chatVisibility: "hidden", allowFriendRequests: false, active: true,
    planInterval: null, planRenewsAt: null,
    lastActiveAt: "2026-05-10T00:00:00.000Z",
  },
];

export const properties: Property[] = [
  {
    id: "p-1",
    ownerId: "u-maria",
    ownerEmail: "maria@worldchat.dev",
    title: "Prime Makati Office Floor",
    description:
      "Full floor of grade-A office space in the Makati CBD. Move-in ready, fitted with HVAC and backup power. Sweeping skyline views and 24/7 building security.",
    price: 85_000_000,
    location: "Makati, Metro Manila",
    latitude: 14.5547,
    longitude: 121.0244,
    type: "Office",
    tags: ["CleanTitle", "CompanyOwned", "LookingToSell", "HasATS"],
    createdAt: "2026-05-28T09:30:00.000Z",
    photos: [pic("makati-office"), pic("makati-office-2"), pic("makati-lobby")],
    attachments: [
      {
        id: "a-1",
        propertyId: "p-1",
        url: "https://www.africau.edu/images/default/sample.pdf",
        filename: "makati-office-brochure.pdf",
      },
    ],
    showPrice: true,
    showAttachments: true,
    ats: { url: "https://www.africau.edu/images/default/sample.pdf", filename: "makati-authority-to-sell.pdf" },
    atsVisibility: "document", requiresLOI: false,
  },
  {
    id: "p-2",
    ownerId: "u-james",
    ownerEmail: "james@worldchat.dev",
    title: "Laguna Logistics Warehouse",
    description:
      "10,000 sqm warehouse with high clearance and dock levelers, 45 min from the port. Heavy power capacity and wide truck apron.",
    price: 120_000_000,
    location: "Calamba, Laguna",
    latitude: 14.2117,
    longitude: 121.1653,
    type: "Warehouse",
    tags: ["AsIs", "IndividualOwner", "LookingForBuyer", "HasATS"],
    createdAt: "2026-06-01T14:10:00.000Z",
    photos: [pic("laguna-warehouse"), pic("warehouse-interior")],
    attachments: [],
    showPrice: true,
    showAttachments: false,
    ats: { url: "https://www.africau.edu/images/default/sample.pdf", filename: "laguna-ats.pdf" },
    atsVisibility: "on_request", requiresLOI: true,
  },
  {
    id: "p-3",
    ownerId: "u-maria",
    ownerEmail: "maria@worldchat.dev",
    title: "Tagaytay Agricultural Lot",
    description:
      "2.5 hectares of titled agricultural land with cool climate and ridge views. Ideal for agri-tourism or a private estate.",
    price: 45_000_000,
    location: "Tagaytay, Cavite",
    latitude: 14.1153,
    longitude: 120.962,
    type: "Agricultural",
    tags: ["CleanTitle", "JoinVentures", "HasATS"],
    createdAt: "2026-06-05T08:00:00.000Z",
    photos: [pic("tagaytay-lot"), pic("tagaytay-view")],
    attachments: [
      {
        id: "a-2",
        propertyId: "p-3",
        url: "https://www.africau.edu/images/default/sample.pdf",
        filename: "tagaytay-lot-title.pdf",
      },
    ],
    showPrice: true,
    showAttachments: true,
    ats: { url: "https://www.africau.edu/images/default/sample.pdf", filename: "tagaytay-ats.pdf" },
    atsVisibility: "on_request", requiresLOI: true,
  },
  {
    id: "p-4",
    ownerId: "u-lena",
    ownerEmail: "lena@worldchat.dev",
    title: "BGC Mixed-Use Corner",
    description:
      "Corner lot zoned for mixed-use development in Bonifacio Global City. Excellent foot traffic and transit access.",
    price: 250_000_000,
    location: "Taguig, Metro Manila",
    latitude: 14.5509,
    longitude: 121.0513,
    type: "Mixed Use",
    tags: ["CompanyOwned", "LookingToSell", "CleanTitle"],
    createdAt: "2026-06-08T11:45:00.000Z",
    photos: [pic("bgc-corner"), pic("bgc-skyline")],
    attachments: [],
    showPrice: false,
    showAttachments: true,
    ats: null, atsVisibility: "hidden", requiresLOI: false,
  },
  {
    id: "p-5",
    ownerId: "u-james",
    ownerEmail: "james@worldchat.dev",
    title: "EDSA Gas Station",
    description:
      "Operating gas station along EDSA with convenience store and long-term fuel supply contract. Strong daily volume.",
    price: 95_000_000,
    location: "Quezon City, Metro Manila",
    latitude: 14.6357,
    longitude: 121.0353,
    type: "Gas Station",
    tags: ["IndividualOwner", "LookingForBuyer"],
    createdAt: "2026-06-10T16:20:00.000Z",
    photos: [pic("edsa-gas")],
    attachments: [],
    showPrice: true,
    showAttachments: true,
    ats: { url: "https://www.africau.edu/images/default/sample.pdf", filename: "edsa-ats.pdf" },
    atsVisibility: "hidden", requiresLOI: false,
  },
  {
    id: "p-6",
    ownerId: "u-lena",
    ownerEmail: "lena@worldchat.dev",
    title: "Ortigas Retail Strip",
    description:
      "Ground-floor retail strip with five units fully leased to F&B tenants. Stable yield and professional management.",
    price: 60_000_000,
    location: "Pasig, Metro Manila",
    latitude: 14.5866,
    longitude: 121.0619,
    type: "Retail",
    tags: ["CompanyOwned", "JoinVentures", "LookingToSell"],
    createdAt: "2026-06-12T10:05:00.000Z",
    photos: [pic("ortigas-retail"), pic("retail-units")],
    attachments: [],
    showPrice: true,
    showAttachments: true,
    ats: null, atsVisibility: "hidden", requiresLOI: false,
  },
];

export const chatGroups: ChatGroup[] = [
  { id: "g-1", name: "Metro Manila Deals", createdByEmail: "maria@worldchat.dev" },
  { id: "g-2", name: "Warehouse Investors", createdByEmail: "james@worldchat.dev" },
];

// group_id -> member user ids
export const groupMembers: Record<string, string[]> = {
  "g-1": ["u-maria", "u-james", "u-lena"],
  "g-2": ["u-james", "u-admin"],
};

export const messages: Message[] = [
  {
    id: "m-1",
    groupId: "g-1",
    userId: "u-maria",
    userEmail: "maria@worldchat.dev",
    content: "Just listed the Makati office floor — serious buyers only please.",
    contentType: "text",
    createdAt: "2026-06-12T09:31:00.000Z",
  },
  {
    id: "m-2",
    groupId: "g-1",
    userId: "u-lena",
    userEmail: "lena@worldchat.dev",
    content: "Interested. Can you share the brochure here?",
    contentType: "text",
    createdAt: "2026-06-12T09:33:00.000Z",
  },
  {
    id: "m-3",
    groupId: "g-2",
    userId: "u-james",
    userEmail: "james@worldchat.dev",
    content: "Laguna warehouse viewing this Friday, who's in?",
    contentType: "text",
    createdAt: "2026-06-13T13:00:00.000Z",
  },
];

export const worldMessages: WorldMessage[] = [
  {
    id: "w-1",
    userId: "u-james",
    userEmail: "james@worldchat.dev",
    content: "Good morning everyone! Any new industrial listings this week?",
    contentType: "text",
    createdAt: "2026-06-14T01:00:00.000Z",
  },
  {
    id: "w-2",
    userId: "u-maria",
    userEmail: "maria@worldchat.dev",
    content: "Posted a Tagaytay agri lot — check the dashboard map.",
    contentType: "text",
    createdAt: "2026-06-14T01:05:00.000Z",
  },
];

// ─── Direct (1:1) messages ──────────────────────────────────────
export const directThreads: DirectThread[] = [
  {
    id: "dt-1",
    participantIds: ["u-maria", "u-james"],
    participantEmails: ["maria@worldchat.dev", "james@worldchat.dev"],
    createdAt: "2026-06-13T10:00:00.000Z",
  },
];

export const directMessages: DirectMessage[] = [
  {
    id: "dm-1",
    threadId: "dt-1",
    senderId: "u-james",
    senderEmail: "james@worldchat.dev",
    content: "Hi Maria, is the Makati floor still available?",
    contentType: "text",
    createdAt: "2026-06-13T10:01:00.000Z",
  },
  {
    id: "dm-2",
    threadId: "dt-1",
    senderId: "u-maria",
    senderEmail: "maria@worldchat.dev",
    content: "Yes! Happy to set up a viewing this week.",
    contentType: "text",
    createdAt: "2026-06-13T10:04:00.000Z",
  },
];

export const payments: Payment[] = [
  {
    id: "pay-1",
    userId: "u-james",
    plan: "premium",
    interval: "annual",
    reference: "GCASH-882134",
    attachmentUrl: "https://picsum.photos/seed/proof-james/700/900",
    status: "pending",
    createdAt: "2026-06-13T07:00:00.000Z",
    periodStart: "2026-06-01T00:00:00.000Z",
    periodEnd: "2027-05-31T15:59:59.000Z",
  },
  {
    id: "pay-2",
    userId: "u-lena",
    plan: "premium",
    interval: "monthly",
    reference: "GCASH-771902",
    attachmentUrl: "https://picsum.photos/seed/proof-lena/700/900",
    status: "pending",
    createdAt: "2026-06-14T05:30:00.000Z",
    periodStart: "2026-06-01T00:00:00.000Z",
    periodEnd: "2026-06-30T15:59:59.000Z",
  },
  {
    id: "pay-3",
    userId: "u-maria",
    plan: "premium",
    interval: "monthly",
    reference: "GCASH-640881",
    attachmentUrl: "https://picsum.photos/seed/proof-maria/700/900",
    status: "approved",
    createdAt: "2026-05-29T03:00:00.000Z",
    periodStart: "2026-05-01T00:00:00.000Z",
    periodEnd: "2026-05-31T15:59:59.000Z",
    reviewedAt: "2026-05-30T02:00:00.000Z",
    reviewedBy: "admin@worldchat.dev",
    invoiceId: "inv-1",
  },
];

// Invoices issued when an admin approves a manual payment.
export const invoices: Invoice[] = [
  {
    id: "inv-1",
    number: "INV-2026-0001",
    userId: "u-maria",
    userEmail: "maria@worldchat.dev",
    plan: "premium",
    interval: "monthly",
    amount: 600,
    periodStart: "2026-05-01T00:00:00.000Z",
    periodEnd: "2026-05-31T15:59:59.000Z",
    dueDate: "2026-05-31T15:59:59.000Z",
    status: "paid",
    paymentId: "pay-3",
    proofUrl: "https://picsum.photos/seed/proof-maria/700/900",
    reference: "GCASH-640881",
    issuedAt: "2026-05-30T02:00:00.000Z",
    issuedBy: "admin@worldchat.dev",
  },
];

export const settings: AppSetting[] = [
  {
    key: "payment_qr_url",
    value:
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=worldchat-payment",
  },
  { key: "price_premium_monthly", value: "600" },
  { key: "price_premium_annual", value: "5760" },
];

// ─── Property requests (leads) + per-request chat + notifications
export const propertyRequests: PropertyRequest[] = [
  {
    id: "pr-1",
    propertyId: "p-2",
    propertyTitle: "Laguna Logistics Warehouse",
    kind: "ats",
    requesterId: "u-maria",
    requesterName: "Maria Santos",
    requesterEmail: "maria@worldchat.dev",
    requesterCode: "WC-MARIA2",
    ownerId: "u-james",
    ownerEmail: "james@worldchat.dev",
    message: "We're a serious buyer ready to proceed. Letter of Intent attached.",
    loiFilename: "maria-letter-of-intent.pdf",
    status: "pending",
    createdAt: "2026-06-14T08:00:00.000Z",
  },
  {
    id: "pr-2",
    propertyId: "p-3",
    propertyTitle: "Tagaytay Agricultural Lot",
    kind: "ats",
    requesterId: "u-james",
    requesterName: "James Reyes",
    requesterEmail: "james@worldchat.dev",
    requesterCode: "WC-JAMES3",
    ownerId: "u-maria",
    ownerEmail: "maria@worldchat.dev",
    message: "Serious buyer for an agri-tourism project — our Letter of Intent is attached.",
    loiFilename: "james-reyes-LOI.pdf",
    status: "pending",
    createdAt: "2026-06-15T02:00:00.000Z",
  },
];

export const requestMessages: RequestMessage[] = [
  {
    id: "rm-3",
    requestId: "pr-2",
    senderId: "u-james",
    senderEmail: "james@worldchat.dev",
    content: "Hi Maria, we love the Tagaytay lot. LOI attached — happy to discuss terms.",
    contentType: "text",
    createdAt: "2026-06-15T02:01:00.000Z",
  },
  {
    id: "rm-1",
    requestId: "pr-1",
    senderId: "u-maria",
    senderEmail: "maria@worldchat.dev",
    content: "Hi James, we'd love to review the ATS. Our LOI is attached.",
    contentType: "text",
    createdAt: "2026-06-14T08:01:00.000Z",
  },
  {
    id: "rm-2",
    requestId: "pr-1",
    senderId: "u-james",
    senderEmail: "james@worldchat.dev",
    content: "Thanks Maria — reviewing your LOI now, will get back shortly.",
    contentType: "text",
    createdAt: "2026-06-14T08:30:00.000Z",
  },
];

export const notifications: AppNotification[] = [
  {
    id: "ntf-1",
    userId: "u-james",
    type: "request_new",
    title: "New ATS request",
    body: "Maria Santos requested the ATS for Laguna Logistics Warehouse (LOI attached).",
    link: "/my-listings?tab=requests&open=pr-1",
    requestId: "pr-1",
    requestKind: "ats",
    read: false,
    createdAt: "2026-06-14T08:00:00.000Z",
  },
  {
    id: "ntf-2",
    userId: "u-maria",
    type: "friend_request",
    title: "New friend request",
    body: "james wants to connect with you.",
    link: "/people",
    requestId: "fr-1",
    read: false,
    createdAt: "2026-06-14T09:00:00.000Z",
  },
  {
    id: "ntf-3",
    userId: "u-maria",
    type: "request_new",
    title: "New ATS request",
    body: "James Reyes requested the ATS for Tagaytay Agricultural Lot (LOI attached).",
    link: "/my-listings?tab=requests&open=pr-2",
    requestId: "pr-2",
    requestKind: "ats",
    read: false,
    createdAt: "2026-06-15T02:00:00.000Z",
  },
];


// ─── Friend / contact requests ──────────────────────────────────
export const friendRequests: FriendRequest[] = [
  {
    id: "fr-1",
    fromId: "u-james",
    fromEmail: "james@worldchat.dev",
    toId: "u-maria",
    toEmail: "maria@worldchat.dev",
    status: "pending",
    createdAt: "2026-06-14T09:00:00.000Z",
  },
  {
    id: "fr-2",
    fromId: "u-admin",
    fromEmail: "admin@worldchat.dev",
    toId: "u-maria",
    toEmail: "maria@worldchat.dev",
    status: "accepted",
    createdAt: "2026-06-10T09:00:00.000Z",
  },
];

// ─── Admin audit logs ───────────────────────────────────────────
export const auditLogs: AuditLog[] = [
  {
    id: "log-1",
    adminId: "u-admin",
    adminEmail: "admin@worldchat.dev",
    action: "Approved payment",
    target: "maria@worldchat.dev",
    detail: "Premium (monthly) activated · ref GCASH-640881",
    createdAt: "2026-06-09T10:00:00.000Z",
  },
];

// ── Support tickets (Basic users get ticket-only support) ─────
export const supportTickets: SupportTicket[] = [
  {
    id: "tkt-1",
    number: "TKT-1001",
    userId: "u-james",
    userEmail: "james@worldchat.dev",
    plan: "basic",
    priority: false,
    category: "Listing",
    subject: "My photo won't upload",
    message: "When I add a property the photo preview stays blank. Using Chrome on Windows.",
    status: "open",
    createdAt: "2026-06-14T02:30:00.000Z",
    updatedAt: "2026-06-14T02:30:00.000Z",
    replies: [],
  },
  {
    id: "tkt-2",
    number: "TKT-1000",
    userId: "u-lena",
    userEmail: "lena@worldchat.dev",
    plan: "basic",
    priority: false,
    category: "Account",
    subject: "How do I change my display name?",
    message: "I want to update the name shown on my listings.",
    status: "resolved",
    createdAt: "2026-06-12T06:00:00.000Z",
    updatedAt: "2026-06-12T08:15:00.000Z",
    replies: [
      {
        id: "trp-1",
        ticketId: "tkt-2",
        fromEmail: "admin@worldchat.dev",
        isAdmin: true,
        body: "Hi Lena — open Account Settings from the top-right menu and edit your Display name, then Save. Marking this resolved!",
        createdAt: "2026-06-12T08:15:00.000Z",
      },
    ],
  },
];

// ── AI Tool requests (paid, admin-processed) ──────────────────
const SAMPLE_DOC = "https://www.africau.edu/images/default/sample.pdf";
export const aiRequests: AiRequest[] = [
  {
    id: "air-1",
    number: "AIR-1001",
    userId: "u-james",
    userEmail: "james@worldchat.dev",
    type: "analysis",
    price: 100,
    description: "Please assess the title status, zoning, and resale potential of this lot.",
    documents: [{ filename: "tagaytay-lot-title.pdf", url: SAMPLE_DOC }],
    proofUrl: "https://picsum.photos/seed/ai-proof-james/700/900",
    status: "pending",
    resultDocuments: [],
    createdAt: "2026-06-14T03:00:00.000Z",
    updatedAt: "2026-06-14T03:00:00.000Z",
  },
  {
    id: "air-2",
    number: "AIR-1000",
    userId: "u-maria",
    userEmail: "maria@worldchat.dev",
    type: "comparison",
    price: 300,
    description: "Compare price per sqm, location access, and clean-title status across these two warehouses.",
    documents: [
      { filename: "warehouse-A-specs.pdf", url: SAMPLE_DOC },
      { filename: "warehouse-B-specs.pdf", url: SAMPLE_DOC },
    ],
    proofUrl: "https://picsum.photos/seed/ai-proof-maria/700/900",
    status: "completed",
    adminNotes: "Side-by-side comparison attached. Warehouse B has stronger access but a pending title note.",
    resultDocuments: [{ filename: "WorldChat-Comparison-Report.pdf", url: SAMPLE_DOC }],
    reviewedBy: "admin@worldchat.dev",
    createdAt: "2026-06-12T01:00:00.000Z",
    updatedAt: "2026-06-13T05:00:00.000Z",
  },
];
