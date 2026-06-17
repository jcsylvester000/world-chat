# World Chat — Next.js (Frontend)

A commercial real-estate marketplace with a live map, listings, and chat.
Converted from the original Vue 3 + Supabase app to **Next.js**, redesigned with
a modern marketplace UI. Frontend only — all data comes from an in-memory mock
layer, structured so a **PostgreSQL + Prisma** backend can be connected later.

---

## Stack

| Concern   | Choice                                                   |
| --------- | -------------------------------------------------------- |
| Framework | Next.js 15 (App Router) + React 19                       |
| Language  | TypeScript (strict)                                      |
| Styling   | Tailwind CSS v4 + Inter font, design tokens in globals   |
| State     | Zustand (auth, property, listings, chat, social, admin, billing) |
| Map       | Leaflet + react-leaflet, OpenStreetMap tiles             |
| Data now  | In-memory mock layer in `src/lib/data`                   |
| Data next | PostgreSQL on NeonTech via Prisma (`prisma/schema.prisma`)|

---

## Running the app

This project runs **in place** — there is a single copy, this folder.

```powershell
cd "<this folder>"
npm install      # first time only
npm run dev      # http://localhost:3000
```

> **Important — no `&` in the path.** Windows breaks `npm` scripts when the
> folder path contains an ampersand (`&`). If any parent folder has one, rename
> it (e.g. change "`&`" to "`and`") so the full path is ampersand-free, then run
> the commands above. Spaces are fine.

### Demo login

Auth is mocked — **any password** works for the seeded accounts:
`admin@worldchat.dev` (admin), `maria@worldchat.dev`, `james@worldchat.dev`,
`lena@worldchat.dev`. Or register a new account.

---

## Features

- **Map dashboard** — Leaflet/OSM map with clickable property markers, hover a
  card to fly to it, plus the chat panel and newest listings.
- **Browse** — filter by search, type, price range and tags; paginated grid.
- **Property detail** (`/listings/[id]`) — photo gallery, description, tags,
  documents, owner card, mini-map, and a "Message owner" button.
- **My Listings** — your properties, add new ones.
- **Create listing** — title, price, description, type, tags, **photo uploads**
  (real previews), document attachments, and per-listing visibility toggles.
- **Account settings** — profile, default visibility, and per-property toggles
  to **show/hide price and attachments**.
- **Messaging** — one-on-one **direct messages** plus **group chat** and the
  public **World Chat**, all with **emoji** and **photo** sharing.
- **Subscription & plans** — Basic (free) vs Premium (₱600/mo or ₱5,760/yr, save 20%). Pick a billing term, pay via QR, submit proof. See the "Subscription, plans & limits" section below.
- **Admin console** (`/admin`, admin-only) — a tabbed back office for
  operators. See the dedicated section below.

### Visibility controls

Each listing has `showPrice` and `showAttachments` flags. When off, the public
sees "Price on request" and documents are hidden; the owner always sees both.
Manage them per-property in **Account settings** (or when creating a listing).
New listings default to your account's default visibility preferences.

### Document access requests & notifications

Listings allow **up to 4 documents**. If an owner hides attachments
(`showAttachments` off), a viewer sees a "Request access" button on the listing.
Requesting notifies the **owner** via the in-app **notification bell**; the owner
can **Approve/Decline** right from the bell, which notifies the **requester** of
the outcome. Approved requesters can then view that listing's documents. Both
parties see the relevant notifications.

### Visibility — global or per listing

In **Account settings** you can flip price and attachment visibility for **all**
your listings at once, or **customize per listing**. New listings inherit your
default-visibility preferences.

### Custom tags

When creating a listing you can pick from suggested tags **or add your own custom
tags**, which appear as chips and are searchable.

### Chat retention (7 days)

World, group, and direct messages older than **7 days** are treated as expired
and hidden. The mock layer prunes them on read; the production backend should
enforce this with a scheduled job or a database TTL (see
`CHAT_RETENTION_DAYS` in `src/lib/types.ts`).

### Authority to Sell (ATS) & Letter of Intent (LOI)

ATS and LOI are always **attachments** (brokers use branded letterhead, so typed
text isn't accepted). A listing's ATS shows three ways: **Document** (viewable
directly), **On request** (note + Request button; green **"Has ATS"** tag), or
**Hidden**. Browse has a **Has ATS / No ATS** filter.

Simple exchange: a buyer clicks **Request ATS**; if an LOI is required they
**attach their LOI** and see *"Please wait — the owner will provide the ATS."* In
**Requests**, the owner opens **View LOI** then clicks **Provide ATS** to attach
it; the buyer can then **View ATS**. A document-viewer modal renders a mock
document for the demo.

### Property requests (lead capture) — `/requests`

A dedicated **Requests** page captures leads for document/ATS access. Each request
records the requester's **Name, ID (code), Message** and which **property** it's
for (plus the LOI if required). It has two tabs:

- **Received** — requests for your listings; **Approve/Decline**, and a built-in
  **per-request chat**.
- **Sent** — your own requests and their status.

Because each request is scoped to one property + one requester, multiple people
asking about the same listing stay in **separate threads**, keeping conversations
organized. Approving grants that requester access to the documents/ATS.

### Unified chat (dashboard = Messages page)

The chat in the dashboard column and the **Messages** page are the **same
component**: three tabs — **Direct** (1:1 DMs), **Groups** (list, create, open,
manage members), and **World** — with emoji + photo. "Message owner/contact"
links open the right DM in either place.

### People, codes & chat privacy

Every user has a shareable **invite code** (e.g. `WC-7F3K9Q`) on the **People**
page, with a copy button. Users choose how discoverable they are:

- **Visible to everyone** — appear in people search, anyone can add you.
- **Invite only** — hidden from search; reachable **only via your code**.
- **Hidden** — you don't appear anywhere and can't be added.

There's also an **Allow friend requests** toggle. People connect by **searching**
(only "everyone" users show up) or by **entering a code**, which sends a friend
request. The recipient gets a notification and **Accept/Decline** options (in the
🔔 bell or on the People page); accepting makes you contacts, and you can start a
private DM from your contacts list. Group member pickers only show discoverable
users and your contacts — invite-only/hidden strangers are never exposed.

### Dashboard listings column

The right column uses **compact rows** (small thumbnails) to fit more, with a
**live search box**, the **upload date** on each listing, and **pagination (20
per page)** showing the most recent first.

### Subscription, plans & limits

Every new account starts on **Basic (free)**. **Premium** is **₱600/month**, or
**₱5,760/year** when billed annually — that's 12 months minus **20%** (₱1,440
saved). All prices live in one place, `src/lib/constants.ts`
(`PREMIUM_PRICE_MONTHLY`, `PREMIUM_PRICE_ANNUAL`, `ANNUAL_DISCOUNT_PCT`).

**The enforced limit is the listing cap:** Basic accounts can hold up to
`BASIC_LISTING_CAP` (**5**) active listings; Premium is unlimited. The cap is
enforced server-side in `createProperty` (it throws past the limit) and surfaced
in the UI — **My listings** shows an `X/5 · Basic` counter, blocks the *Add
property* button at the cap, and prompts an upgrade. The other Premium perks
(priority placement, lead capture, AI) are positioning, not hard gates.

On the **Subscription** page a user sees their current plan (and renewal date if
Premium), a Basic-vs-Premium comparison, a **monthly/annual** toggle with live
pricing and the annual saving, then a QR + reference + proof-of-payment upload
that an admin reviews. Approving the payment **locks in** the plan *and* the
billing term the user paid for, setting a renewal date (`planRenewsAt`).

Admins can also set a subscription directly from the **Users** tab — a single
control offers **Basic**, **Premium · Monthly**, or **Premium · Annual**, and the
row shows the user's current plan, term and renewal date. Every change is
audit-logged.

### Billing, invoices & accounting

Payments are **manual** (QR + proof of payment), so the platform adds the
tracking, notifications, and paperwork around them.

**Billing cycle.** A period runs from the **1st to the last day of the month**,
and payment is **due on the last day of the month**. There is a **5-day grace
period**; an unpaid Premium account past grace is **downgraded to Basic**, and
any listings beyond the 5-listing Basic cap are **permanently removed** (newest 5
kept). **Free → Premium upgrades are billed on the next cycle.** The math lives in
`src/lib/billing.ts`.

**Listing expiry.** Free listings expire **6 months** after posting or after
**2 months of account inactivity** (whichever is first) and are removed; Premium
listings don't expire. Expired free listings are also hidden from the marketplace
immediately. Signing in refreshes a user's activity timestamp.

**Invoices.** Approving a payment issues an `Invoice` and notifies the user, who
can **download a branded PDF** (jsPDF, client-side) from the Subscription page.
Admins see every invoice in the accounting ledger.

**Admin Accounting page** (`/admin/accounting`, linked from the admin console):
- a **demo clock** to fast-forward time (the whole system reads it), so month-end
  billing, the grace window, and expiry can be demonstrated without waiting;
- a **Run month-end billing** action that downgrades unpaid accounts, sends grace
  reminders, and removes expired listings, returning a summary;
- **collected this month / all-time**, **outstanding total**, and pending counts;
- a **dynamic search** box and **50-per-page pagination** on every tab;
- an **Outstanding** tab listing premium accounts that are due / in grace / overdue,
  with per-row checkboxes, a **Select all** toggle, a due-date picker, and a
  **Send reminder** action that notifies the selected users their payment is due by
  that date or the account moves to Basic;
- tabs for **Payments** (proof thumbnails, period, reviewer; approve/reject),
  **Invoices** (download PDF), and **Accounts** (per-user billing state badge).

**Notifications.** Submitting a payment notifies **all admins**; approval sends
the user an **invoice-ready** notice; downgrades, grace warnings, and listing
expiry send **billing warnings**. The 🔔 bell renders them all.

**User side.** The Subscription page shows the current period and due date, a
billing explainer, **payment history with proof screenshots**, and downloadable
**invoices**. A dismissible end-of-month billing explainer also appears on the
dashboard and My Listings, and the rules are written up on the public
**`/terms`** page (linked in the footer) and the Pricing/FAQ pages.

### Admin console (`/admin`)

Admins sign in through the **normal login screen** — the app detects `isAdmin`
on the profile and unlocks the **Admin** nav item; the page itself is guarded by
`<AuthGate requireAdmin>`. Seeded admin: `admin@worldchat.dev`. A stats header
(total users, premium, pending payments, deactivated) sits above three tabs:

- **Payments** — pending subscription payments, each showing the submitted
  **proof-of-purchase image** (click to enlarge), the user, plan, interval and
  reference. **Approve & activate** flips the user to the paid plan; **Reject**
  declines it. Both notify the user.
- **Users** — searchable list. Per user: **upgrade/downgrade** the plan, **Reset
  password** (issues a temporary password, shown once and the user is notified),
  **Message** (sends a DM + notification about a concern, or jumps into the full
  chat), and an **Active** switch to **deactivate/reactivate** the account
  (deactivated users are blocked at login). Admins can't deactivate themselves.
- **Audit log** — every admin action (approvals, plan changes, activations,
  resets, messages) is recorded with who, what, target and timestamp, newest
  first.

**Account deactivation** is enforced in `auth-store.signIn` — a deactivated user
sees *"Your account has been deactivated. Please contact support."* All admin
writes go through `src/lib/data/services.ts` (the single Prisma swap-point) and
append to `auditLogs`; the production backend should persist these to the
`AuditLog` table already modelled in `prisma/schema.prisma`.

### Support tickets (tiered support)

Support is tiered to nudge upgrades. **Basic** (free) members get **ticket-only**
support for simple issues from the **Support** page (`/support`): a small form
(category, subject, short message) plus their ticket list with the full reply
thread. **Premium** members get **priority** support — their tickets are flagged
and prioritized, and the page tells Basic users that serious/direct admin support
requires upgrading.

Admins work tickets from **`/admin/tickets`** (linked in the admin console):
filter by **open / resolved / all**, **search** by user, subject, or number,
open a ticket to read the thread, **reply** (notifies the user), and **mark
resolved / reopen**. Priority (Premium) tickets are badged and sorted first.
Submitting a ticket notifies all admins; replies and status changes notify the
other party through the 🔔 bell. Lists paginate at 50.

### AI Tools (paid, admin-processed)

AI Tools is a **pay-per-request add-on available to every member** (not gated by
plan). There are two tools, defined in `src/lib/constants.ts` (`AI_TOOLS`):

- **Property Analysis** — ₱100, upload **1** property document + a request.
- **Property Comparison** — ₱300, upload **2–4** documents + what to compare.

On `/ai-tools` the user picks a tool, uploads the document(s) and a description,
and **uploads proof of payment** (required) before the **Submit** button is
enabled. Submitting notifies all admins.

Admins work requests on a **full-width** page, **`/admin/ai-requests`** (linked
from the admin console). It's a two-pane console: a filterable/searchable list on
the left, and a work panel on the right showing **who** requested, **when**, the
**request text**, the **documents the user uploaded** (downloadable), and the
**proof of payment** (click to view). The admin **uploads the result documents**,
adds optional **notes**, and marks the request **completed** (delivers the docs),
**rejected** (with notes), or back to **pending**. Each change notifies the user,
who sees the status — and downloads the delivered documents — back on `/ai-tools`.
The `AiRequest` model is in `prisma/schema.prisma` for backend parity.

### Public marketing site

The root `/` is a public **landing page** (no login needed) with a marketing
shell — header nav (**Home, About, Why us, Blog, Pricing**) plus **Log in /
Sign up** (or **Open app** when signed in), and a **footer sitemap**. Pages live
in `src/app/(marketing)/`: landing, `/about`, `/why-us`, `/pricing`, `/blog`
(+ `/blog/[slug]` posts from `src/lib/blog.ts`). Everything is on-theme and
mobile responsive. The authenticated app lives behind it under `(app)`.

### Photos

Uploaded photos are read into base64 data URLs and shown as real images. They
live in memory for the session (reset on refresh). Swap `fileToDataUrl` in
`src/lib/utils.ts` for a real upload to object storage when the backend lands.

---

## Project structure

```
src/
  app/
    (auth)/login, register
    (app)/                      # authenticated shell (NavBar + AuthGate)
      dashboard, all-listings, my-listings,
      listings/[id], account, messages,
      subscription, admin, ai-tools, property-teaser
  components/                   # NavBar, PropertyCard, PropertyMap, chat, modals
    ui/                         # Button, Switch, Avatar, Badge, EmptyState, Spinner
  lib/
    types.ts, constants.ts, utils.ts
    data/ mock-data.ts, services.ts   # ← swap services.ts for Prisma later
    store/ auth / property / listings / chat (Zustand)
prisma/schema.prisma            # target Postgres schema (Profile, Property,
                                #   DirectThread, DirectMessage, …)
```

---

## Performance

A few things make pages load and navigate noticeably faster:

- **Turbopack dev server.** `npm run dev` now runs `next dev --turbopack`, which
  compiles routes far faster than webpack on first visit. If you ever hit a
  Turbopack-specific issue, fall back with `npm run dev:webpack`.
- **For the fastest page loads, run a production build.** The dev server compiles
  each route on demand the first time you open it; a production build is fully
  optimized and minified ahead of time:

  ```powershell
  npm run build
  npm start          # http://localhost:3000, much snappier than dev
  ```

- **Near-instant data.** The mock data layer's simulated latency is set to ~0ms,
  so list/detail fetches resolve immediately (change the `latency()` default in
  `src/lib/data/services.ts` if you want to simulate a slow network).
- **Lazy, async-decoded images.** Property cards, chat photos, map popups, and
  proof thumbnails use `loading="lazy"` + `decoding="async"` so off-screen images
  don't block the initial paint.
- **Connection warm-up.** The root layout preconnects to the external image/tile
  hosts (OpenStreetMap tiles, picsum, unpkg) so they start downloading sooner.
- **Smaller production JS.** `next.config.mjs` strips `console.*` (except
  `error`/`warn`) from production builds, drops the `x-powered-by` header, and the
  heavy libraries (Leaflet map, jsPDF) are already code-split via dynamic imports
  so they only load on the pages that use them.

---

## Prisma + Postgres (Neon) — wiring it up

Prisma is now **scaffolded and wired**, with the **listings (Properties) slice
fully connected end-to-end** through an API layer as the working template. The
rest of the app still runs on the in-memory mock until you migrate each feature
(see the playbook below). Nothing breaks by default — Postgres only kicks in
when you flip the data-source flag.

> **Realtime chat (presence + typing) is also live on Neon.** Two standalone
> tables — `ChatPresence` and `ChatTyping` — back online/offline dots and the
> "… is typing" indicators, delivered by short-interval **polling** (no
> websockets, so it runs on Netlify's serverless functions). Flow:
> `realtime-hooks.ts (poll)` → `src/lib/data/realtime.ts` → `/api/chat/presence`
> + `/api/chat/typing` → `src/server/repos/presence.ts` → Prisma → Neon.
> Heartbeat every 30s marks you online (60s window); typing pings are throttled
> to one per 2s and auto-expire after 6s. The tables are already created on the
> project's Neon DB; to recreate them elsewhere run `npm run db:push` (they're
> in `prisma/schema.prisma`). The chat **messages** themselves are still on the
> mock layer — that's the next migration step, where per-plan subscription
> limits (retention, message caps) will be applied.

### Architecture

Prisma runs **only on the server**, so the client talks to it through Next.js
**Route Handlers**:

```
Zustand store → services.ts → (flag) → fetch /api/properties → server repo → Prisma → Neon
                            └ (default) in-memory mock
```

- `prisma/schema.prisma` — the full data model (validated; `prisma generate` clean).
- `src/lib/db.ts` — the Prisma client singleton (**server-only**; never import in a client component/store).
- `src/server/repos/properties.ts` — Prisma queries for the listings slice, with TS↔DB mappers (price `BigInt`↔`number`, `PropertyType` label↔enum, ATS scalars↔`AtsDoc`).
- `src/app/api/health` + `src/app/api/properties/**` — the Route Handlers (GET/POST/PATCH/DELETE + a `query` endpoint).
- `src/lib/api.ts` — tiny client fetch wrappers + the `USE_PRISMA` flag.
- The listings functions in `src/lib/data/services.ts` **dispatch** to the API when `NEXT_PUBLIC_DATA_SOURCE === "prisma"`, otherwise use the mock — so the stores/components are unchanged.

### 1. Create a Neon database

At [neon.tech](https://neon.tech), create a project, then open **Connection
Details** and copy two strings into a `.env` file (see `.env.example`):

```dotenv
# Pooled (PgBouncer) — app runtime. Keep "Pooled connection" ON in Neon.
DATABASE_URL="postgresql://USER:PASS@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1"
# Direct — used ONLY by migrations. Turn "Pooled connection" OFF to get this host.
DIRECT_URL="postgresql://USER:PASS@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require"
# Flip the app onto Postgres for the migrated slice:
NEXT_PUBLIC_DATA_SOURCE="prisma"
```

### 2. Generate, migrate, seed

```powershell
npm install              # picks up prisma, @prisma/client, tsx
npm run db:generate      # generate the typed client
npm run db:migrate       # create tables on Neon (uses DIRECT_URL)
npm run db:seed          # load the demo profiles + properties into Postgres
```

(`npm run db:studio` opens Prisma Studio to inspect the data; `npm run db:push`
syncs the schema without a migration file for quick prototyping.)

### 3. Run it

```powershell
npm run dev
```

With `NEXT_PUBLIC_DATA_SOURCE=prisma`, the **map, Browse, My Listings, property
detail, and create/edit/delete** all read and write Postgres via `/api`. Hit
`GET /api/health` to confirm the DB connection is live. Set the flag back to
`mock` (or unset it) to return to the zero-setup in-memory demo.

### 4. Migration playbook (do the rest the same way)

Each remaining feature follows the exact pattern proven by the listings slice:

1. **Repo** — add `src/server/repos/<feature>.ts` with Prisma queries mirroring
   the matching `services.ts` signatures (reuse the mapper style for enums/dates).
2. **Routes** — add `src/app/api/<feature>/**` Route Handlers that call the repo.
3. **Dispatch** — add `if (USE_PRISMA) return apiGet/apiSend(...)` to the top of
   those functions in `services.ts`. Stores/components don't change.
4. **Seed** — extend `prisma/seed.ts` with that feature's demo rows.

Suggested order: **profiles/auth → payments/invoices → tickets → AI requests →
property requests → chat (threads/messages/groups)**. A couple of notes for the
real backend: enforce server-side authorization in the repos (the mock trusts
the caller); swap mock auth in `auth-store.ts` for real auth (e.g. NextAuth or an
`/api/auth` route); upload photos/proofs to object storage and store the URL
instead of base64 data URLs; and move the 7-day chat retention to a scheduled job
or DB TTL.

---

## Scripts

```
npm run dev          # dev server (Turbopack)   ·  npm run dev:webpack = fallback
npm run build        # production build
npm start            # serve the production build
npm run lint         # eslint
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev (DIRECT_URL)
npm run db:deploy    # prisma migrate deploy (CI/prod)
npm run db:push      # prisma db push (no migration file)
npm run db:seed      # load demo data into Postgres
npm run db:studio    # Prisma Studio
```

Verified: `tsc --noEmit`, `npm run lint`, `prisma validate`, and `prisma generate`
all pass clean. (The listings repo type-checks against the generated Prisma client.)
