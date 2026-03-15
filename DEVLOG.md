# Pavitra — Development Log

All sessions logged here in reverse chronological order (newest first).
Each entry covers: what was designed/decided, what was built, and what's next.

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

### Still TODO
- Phase 4: Admin panel (all pages)
- Phase 5: Email (Resend), landing page, privacy/terms, deployment
- Phase 4: Admin panel (all pages)
- Phase 5: Email (Resend), landing page, privacy/terms, mobile pass, deployment

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
