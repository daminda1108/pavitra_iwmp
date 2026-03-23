# UoP IWMP — Development Log

All sessions logged here in reverse chronological order (newest first).
Each entry covers: what was designed/decided, what was built, and what's next.

---

## Session 4 — 2026-03-23

### Context
Platform shown to overseeing professor and approved. This session reconfigures it specifically for University of Peradeniya as the UoP Integrated Waste Management Platform (IWMP) and adds an information management system.

### Bug fixes (Part 1)
- **AuthContext.signIn race condition (critical)** — `signIn()` now calls `setUser` + `fetchProfile` directly before returning, so `ProtectedRoute` sees auth state immediately on navigation. This fixes the dashboard not loading after login.
- **ListingCard dynamic color class** — replaced `bg-${color}-400` with static `STREAM_DOT` map to prevent Tailwind from purging dynamic class names at build time.
- **AdminGenerators institution fetch** — changed `.limit(1).single()` to `.eq('name', 'University of Peradeniya').maybeSingle()` with fallback, preventing errors when multiple institutions exist.
- **index.html title** — changed from "vite-temp" to "UoP IWMP — Integrated Waste Management".

### UoP rebrand (Part 2)
- **Color system** — `tailwind.config.js` updated: `brand-forest` → UoP Maroon `#800020`, `brand-moss` → deep maroon `#5C0013`, `brand-sage` → UoP Gold `#C5A649`, `brand-cream` → light gold `#F5EED6`, `brand-bark` → dark maroon `#4A0010`. Token names unchanged so all existing classes auto-update.
- **Name/identity** — all "Pavitra" replaced with "UoP IWMP" across Navbar, Login, AdminLayout, Landing, footer. Motto "Vidya Dadati Vinayam" added. GraduationCap icon replaces Leaf.
- **Navbar** — full mobile hamburger menu added (Guidelines + Compliance + all links), two-line logo.
- **Landing** — hero copy updated to UoP context, footer enhanced with Guidelines/Compliance links and motto.

### Information management system (Part 3)
- **`src/pages/Guidelines.jsx`** (`/guidelines`) — comprehensive waste handling SOPs for 6 streams: Chemical/Lab Waste, E-Waste, Organic, Plastic, General, Hazardous Emergency. Each section: accordion with do's/don'ts, required PPE, regulatory references. Pre-listing quick-reference card.
- **`src/pages/Compliance.jsx`** (`/compliance`) — CEA regulations, Basel Convention, UoP institutional policies (all accordions), interactive 10-item pre-listing compliance checklist (checks off and shows green confirmation when complete), useful links.
- **`src/pages/admin/AdminAnnouncements.jsx`** (`/admin/announcements`) — full CRUD: create/edit/delete announcements, pin/unpin, show/hide (is_active). Categories: general, policy, safety, regulation. Modal form.
- **`announcements` DB table** — created in Supabase via Management API with RLS: public read of active announcements, admin write.
- **`AdminReports.jsx`** enhanced — 4th summary card (claim rate), faculty/department breakdown bar chart, CSV export button (downloads all listing data as dated CSV file). Bar chart color updated to UoP Maroon.

### Navigation (Part 4)
- App.jsx: added `/guidelines`, `/compliance`, `/admin/announcements` routes.
- AdminLayout: added Announcements nav item with Megaphone icon (between Materials and Reports).

### Build + deploy
- `npm run build` — passes, zero errors (2.42s, 1005kB bundle with recharts expected).
- Pushed to GitHub `master` → Vercel auto-deploys.

### Current status
All planned items in UOP_REBRAND_PLAN.md completed. Platform is now fully branded as UoP IWMP with:
- Dashboard navigation fixed (critical bug)
- UoP maroon/gold color scheme throughout
- Waste Guidelines and Compliance Hub pages live
- Admin Announcements system (DB + UI)
- Enhanced Reports with faculty breakdown + CSV export
- Full mobile navigation on both public navbar and admin panel

### Deferred to next session
- Announcements display widget on generator/collector dashboards
- Completion flow (two-sided confirmation + WTR PDF generation)
- Collector coordinator UI

---

## Session 3 — 2026-03-15

### Built (Supabase setup)
- `MIGRATION_COMPLETE.sql` created — consolidated all v1.0 + Supplement v1.1 + v1.2 into single runnable migration
- Three SQL bugs fixed iteratively: (1) `auth_user_role()` defined before profiles table → moved after; (2) GIN index on polymorphic `array_to_string()` → simplified to `name` only, alias search via `unnest()` ILIKE in function; (3) `NEW.column` in RLS WITH CHECK → bare column names
- Migration executed via Supabase Management API (split into 40 sections to bypass Cloudflare body size limit)
- All 12 tables, 7 enums, all triggers + RLS policies created
- Seed data: UoP institution, 49 departments, 19 campus locations, 23 material library items
- Storage buckets created: `listing-photos` (public, 5MB), `completion-documents` (private, 10MB)
- `.env` updated with live Supabase URL + anon key

### Built (Phase 2 — Generator Flow)
- `src/pages/Login.jsx` — email/password sign-in with role-aware redirect
- `src/pages/Register.jsx` — invite-gated generator registration (validates token, auto-fills faculty/dept, creates profile + generator rows, marks invite used); collector path shows pilot-phase contact message
- `src/components/listings/ListingCard.jsx` — reusable card (stream, material, status badge, hazard badge, meta, Edit/Cancel/View actions)
- `src/pages/GeneratorDashboard.jsx` — stats strip, tabbed listing grid (active/completed/closed), cancel in-place
- `src/pages/NewListing.jsx` — 4-step wizard: (1) material library search + stream select, (2) quantity + hazard + e-waste extras, (3) location + schedule + photo upload to listing-photos bucket, (4) authorization + claim mode + financial hint + review → POST to listings
- `src/pages/EditListing.jsx` — editable fields (quantity, handling notes, schedule, financial hint, bid deadline); locked fields shown read-only; cancel listing action
- `src/App.jsx` — added `/register/generator` route
- `npm run build` passes — zero errors

### Built (Phase 3 — Board + Collector)
- `src/pages/Board.jsx` — filterable listing board (stream chips, hazard level, text search), grid of `BoardCard` tiles linking to detail
- `src/pages/ListingDetailPage.jsx` — full listing detail (meta, e-waste flags, photos, generator info), claim/bid sidebar: quick_claim (FCFS) or open_bids sealed form with financial direction, price, note, proposed date
- `src/pages/CollectorDashboard.jsx` — stats strip, tabbed claims list (active/completed/declined), claim rows with listing summary + financial terms
- `src/pages/CollectorProfilePage.jsx` — public company profile, CEA license + verification badge, accepted streams, capability badges (Basel, data destruction, CRT, ISO, etc.)
- `npm run build` passes — zero errors

### Built (Phase 4 — Admin Panel)
- `src/pages/admin/AdminOverview.jsx` — stats grid (open/bidding/completed listings, approved/pending collectors, generators), pending approval alert banner, recent 8 listings table
- `src/pages/admin/AdminCollectors.jsx` — full collector management: tabs (all/pending/approved/rejected), expandable rows with contact details, approve/reject modal with reason input, revoke action, link to public profile
- `src/pages/admin/AdminGenerators.jsx` — generators table (name, email, faculty/dept, authorized status, join date) + invite management (list all invites with status, copy link to clipboard) + "Send Invite" modal (email optional, faculty/dept, expiry 3/7/14/30 days)
- `src/pages/admin/AdminListings.jsx` — monitor all listings: status + stream filters, text search, full table with HazardBadge + StatusBadge, external link to board
- `src/pages/admin/AdminReports.jsx` — recharts: monthly listings bar chart (last 6 months), listings-by-stream pie chart, listings-by-status horizontal bar chart; summary cards (total, completion rate, claims)
- `src/pages/admin/AdminMaterials.jsx` — material library management: filterable table by stream/name/CAS, add-material modal (name, stream, hazard, subcategory, CAS), CSV bulk import modal (parse + preview + upsert)
- `src/pages/admin/AdminLayout.jsx` — added Materials nav item (FlaskConical icon)
- `src/App.jsx` — added `/admin/materials` route + AdminMaterials import
- `npm run build` passes — zero errors

### Built (Phase 5 — Polish + Deploy)
- `src/pages/Landing.jsx` — full marketing landing page: hero (gradient, UoP pilot badge, CTA buttons), 4-step "how it works" section, 3 feature cards (CEA compliance, bidding, audit trail), verified collectors showcase (CWM, Green Links Lanka, INSEE Ecocycle with badges), CTA section, footer
- `src/pages/WantedBoard.jsx` — functional "Buyers Seeking" board: public browse (stream filter, card grid with collector info), approved collectors can post wanted listings via modal (stream, min qty, frequency, service area, notes), 90-day expiry
- `supabase/functions/send-email/index.ts` — Deno edge function: wraps Resend API, handles types: `collector_approved`, `collector_rejected`, `new_listing`, `claim_confirmed`; gracefully skips if RESEND_API_KEY not set
- `src/lib/email.js` — thin frontend helper that calls edge function via `supabase.functions.invoke`
- Email wired: AdminCollectors approve/reject → send email to collector; NewListing submit → notify all approved collectors
- `vercel.json` — SPA rewrite rule `/* → /index.html` for Vercel deployment
- `npm run build` passes — zero errors

### Deployment checklist
1. Push to GitHub
2. Connect repo to Vercel (auto-detects Vite)
3. Add env vars in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
4. Deploy Supabase edge function: `supabase functions deploy send-email`
5. Set Supabase secrets: `supabase secrets set RESEND_API_KEY=... FROM_EMAIL=noreply@pavitra.lk APP_URL=https://your-vercel-url`

### Platform complete — all phases done ✓

---

## Session 2 — 2026-03-15

### Decisions made

**Bidding model (finalized)**
- Two claim modes per listing: `quick_claim` (FCFS) and `open_bids` (competitive, sealed)
- Generator sets bid deadline (soft — not enforced as hard cutoff)
- Financial direction declared by collector in their bid; generator sets an optional expectation hint
- Bids are sealed — competitors cannot see each other's offers
- Admin (platform) can monitor all bids/prices but cannot block or approve deals
- Generators make all deal decisions

**Completion flow (finalized)**
- Two-sided: both generator AND collector must confirm before listing moves to `completed`
- WTR PDF generated only after dual confirmation
- Data destruction certificate required if `ewaste_data_bearing = true`
- Destruction certificate required if `hazard_level` is medium or high

**Multi-tenancy (finalized)**
- New `institutions` table — UoP is first client, architecture supports any future client
- `institution_id` FK added to: generators, departments, campus_locations, generator_invites
- Two admin tiers: `admin` (institution-scoped) and `platform_admin` (sees everything)
- Future business model: free pilot → institutional SaaS → transaction fees at scale

**Lab-level independence (finalized)**
- Optional `lab_name` field on generators + listings
- Department Coordinator role (`is_dept_coordinator`) can invite within their own dept
- Coordinator-sent invites auto-lock faculty/department, auto-authorize new generator
- Coordinators get read-only "Department Overview" tab showing all dept listings

### Documents produced
- `PAVITRA_SUPPLEMENT_v1.2.md` — full spec for all above decisions

### Built (Phase 1 Foundation)
- Vite + React 18 project scaffolded
- Tailwind CSS v3 configured with full brand token system (forest, sage, amber, cream, bark, moss)
- All dependencies installed (see package.json)
- Folder structure created: components/{ui,layout,listings,claims,collector,admin,shared}, pages/admin, hooks, lib, context
- `src/lib/utils.js` — cn(), formatDate(), formatDateTime(), timeAgo(), formatCurrency()
- `src/lib/supabase.js` — Supabase client init with env vars
- `src/lib/constants.js` — WASTE_STREAMS, EWASTE_DEVICE_CATEGORIES, EWASTE_BADGES, HAZARD_LEVELS, LISTING_STATUSES, FINANCIAL_HINTS, FINANCIAL_DIRECTIONS, UNITS
- `src/context/AuthContext.jsx` — full auth context (session, profile, signIn, signOut, refreshProfile)
- `src/hooks/useAuth.js` — re-export shortcut
- `src/components/layout/ProtectedRoute.jsx` — role-based route guard with skeleton loader
- `src/components/layout/Navbar.jsx` — sticky navbar with auth-aware links
- `src/components/shared/EmptyState.jsx`
- `src/components/shared/StatusBadge.jsx` — all statuses with icon + color + label
- `src/components/shared/HazardBadge.jsx` — all hazard levels
- `src/App.jsx` — full route tree (public, generator, collector, admin, platform_admin)
- `src/main.jsx`
- All page stubs (Landing, Board, WantedBoard, ListingDetailPage, Login, Register, GeneratorDashboard, NewListing, EditListing, CollectorDashboard, CollectorProfilePage, NotFound, all admin pages)
- AdminLayout with sidebar nav
- `.env.example`, `.env` (placeholder), `.gitignore`
- `npm run build` passes — zero errors

### Designed (not yet built — added after Phase 1 scaffold)

**Material Library (Supplement v1.2 Part 10)**
- Two-tier model: platform-wide library (seeded with common chemicals + e-waste devices) + institution-specific library
- Generators search as they type in wizard; results pre-fill stream, hazard level, handling notes, unit
- CAS numbers on chemicals (required for CEA hazardous waste manifests)
- `usage_count` surfaces most-used materials in search results
- Generator can save new materials to institution library + flag for platform promotion
- Admin material library management page with CSV bulk import
- Schema: `material_library` table, `material_library_id` + `material_name` + `material_name_internal` on listings, `search_materials()` RPC function

### Still TODO (not yet built)
- Supabase project creation + DB schema migration (user must do manually — see below)
- Phase 2: Generator login + register flow, new listing wizard (4 steps), generator dashboard
- Phase 3: Public board, listing detail, collector registration, collector dashboard, claim/bid flow
- Phase 4: Admin panel (all pages)
- Phase 5: Email (Resend), landing page, privacy/terms, mobile pass, deployment

### Supabase setup required before Phase 2
User must:
1. Create Supabase project (region: ap-southeast-1)
2. Run full migration SQL from `PAVITRA_SPEC_v1.md` section 2b
3. Run supplement schema additions from `PAVITRA_SUPPLEMENT_v1.2.md` Parts 1, 2, 3, 4, 9
4. Create storage buckets: `listing-photos` (public), `completion-documents` (private)
5. Copy Supabase URL + anon key into `.env`

---

## Session 1 — 2026-03-15

### What happened
- Initial spec review and design session
- Read `PAVITRA_SPEC_v1.0.md` and `PAVITRA_SUPPLEMENT_EWASTE.md`
- Identified and resolved key design gaps through Q&A

### Decisions made
- Platform scope: e-waste pilot (Faculty of Science, UoP) → full multi-stream → national
- Admin: user + professor (two platform admins for pilot)
- Financial: handled outside platform; platform records declared prices for transparency only
- Hostel/non-academic waste: deferred to Phase 2 expansion
- Real buyers identified: CWM (ewaste.lk), Green Links Lanka (greenlink.lk), INSEE Ecocycle
- Demo flow designed (7 steps, supplement v1.1 Part 4)

### Documents produced
- `PAVITRA_SUPPLEMENT_EWASTE.md` (pre-existing, reviewed)
- Research conducted: Rubicon, RGX, eStewards, RecycleNet, WasteExchange, UK university systems

---
