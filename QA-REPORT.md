# World Chat — QnA & User-Journey Report

_Generated after consolidating to 5 real accounts and re-seeding Neon. Three review passes; static QnA + live Neon verification + build checks (the dev server can't run in the build sandbox because `node_modules` is Windows-built, so live click-through wasn't possible here — see Caveats)._

## 1. The 5 real accounts (login is email-only; password ignored)

| Name | Email | Plan | Role |
|------|-------|------|------|
| Maria Santos | `maria.santos@primeland.ph` | **Premium** | **Admin** + broker (tests both front-end and Admin side) |
| Rafael Cruz | `rafael@cruzrealty.ph` | **Premium** | Broker |
| Lena Ocampo | `lena.ocampo@gmail.com` | Basic | Seller/buyer |
| Sofia Andrada | `sofia.andrada@gmail.com` | Basic | Seller/buyer |
| Daniel Garcia | `daniel.garcia@gmail.com` | Basic | Buyer |

All five exist **both** in the mock layer (so login + the still-mock Admin/billing features work) **and** on Neon with matching IDs (so the Neon-backed features have valid foreign keys). One Premium account (Maria) is the admin, so a single login exercises both the broker front-end and the Admin side.

## 2. What's on Neon now (re-seeded, verified)

All fake filler was removed and replaced with one coherent 5-user dataset, seeded to Neon and verified by direct query:

- **5 profiles** (2 Premium / 3 Basic, 1 admin), **13 properties** (Maria 6, Rafael 4, Sofia 2, Lena 1) with 6 attachments, real PH commercial listings (Makati/BGC/Ortigas/Cebu/Clark/Calamba/etc.).
- **8 leads** across the 6 pipeline stages, 6 lead activities.
- **6 favorites, 4 saved searches, 4 viewings, 3 broker reviews** (Maria avg 4.85★).
- **Chat:** 3 groups (9 memberships), 5 group messages, 3 World messages, 2 DM threads, 3 direct messages. Reactions + read-state tables start empty (fill as users interact).
- **Neon integrity:** 0 orphaned foreign keys, no Basic account over the 5-listing cap.

## 3. Subscription limits — wired and verified

| Limit | Rule | Where enforced |
|------|------|----------------|
| Message retention | Basic 7 days / Premium 30 days | `chat.ts` repo, filtered on read by viewer plan |
| Group creation | Basic max 3 / Premium unlimited | `chat.ts` repo (server-side, `BASIC_GROUP_CAP`) |
| World posting | Premium-only; Basic reads | `chat.ts` repo + composer hidden for Basic in `ChatPanel` |
| DMs | Basic → contacts only; Premium → anyone | services layer (contacts live in the mock layer) |

**How to test the limits live:** log in as a Basic account (e.g. Daniel) → the World tab shows a "Premium feature" notice instead of a composer; creating a 4th group shows the cap error; DMing a non-contact (Maria/Rafael) is blocked, while DMing Sofia (an accepted contact) works. Log in as Maria/Rafael (Premium) → all of the above are unrestricted.

## 4. QnA passes — findings

**Pass 1 (page-by-page review, front-end + Admin + chat):**
- Front-end (13 pages): all OK. Two items flagged by review were confirmed **false positives** — `saved` early-returns on `!user` before the property card renders, and `my-listings` re-fetches on user change.
- Admin (5 pages): all OK — `requireAdmin` (Maria's `isAdmin`) protects each page; payment/verification/ticket/AI-request actions all resolve against the 5 users with safe fallbacks; self-deactivation is guarded.
- Chat/limits: all four limits confirmed enforced. The DM-contacts check is intentionally in the services layer (contacts are mock data; a naive server check would wrongly block every Basic DM) — documented, not a bug.

**Pass 2 (live Neon read-path verification):** every Neon-backed slice returns the correct seeded data — all-listings (13), my-listings per owner, favorites, saved searches, viewings (owner + requester), leads board (4 each across 6 stages), lead activities, reviews + broker average, property detail with attachments/ATS, DM threads.

**Pass 3 (build + integrity):** `tsc` 0 app errors · ESLint clean · no null bytes · Neon foreign-key integrity 0 orphans · accounts match between mock and Neon.

**Fixes implemented:** removed the only stale hardcoded admin reference (`adminId: "u-admin"` in `services.ts` → now derives from the reviewer). No other code referenced the removed users.

## 5. Caveats

1. **Live click-through wasn't possible in this environment** — the project's `node_modules` is Windows-built, so the Next.js dev server / Prisma / tsx can't execute on the Linux build sandbox. Verification was static code review + direct queries against the real Neon DB + full `tsc`/ESLint. For true browser-driven user-journey testing, deploy the latest push to Netlify and I can drive the live site with the browser tools.
2. **Chat rows foreign-key to `Profile`**, so only Neon-seeded accounts can use Neon-backed chat. The 5 accounts here are seeded; brand-new sign-ups created at runtime (mock auth) would need seeding before they can chat.
3. **Auth is still mock** (email-only, no password) and several slices (Admin, friend requests, property requests, payments, notifications) remain on the mock layer by design — they read the same 5 real users. Migrating those to Neon is a separate future step.

## 6. Re-seeding (repeatable)

```bash
npm run db:push        # apply schema (incl. chat tables/columns) to Neon
npm run db:seed        # profiles, properties, leads, favorites, searches, viewings, reviews, activities
npm run db:seed:chat   # groups, messages, threads, DMs
```
