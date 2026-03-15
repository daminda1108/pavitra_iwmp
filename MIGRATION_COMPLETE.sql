-- ================================================================
-- PAVITRA — COMPLETE DATABASE MIGRATION
-- v1.0 base + Supplement v1.1 (E-Waste) + Supplement v1.2
-- Run this ONCE in Supabase SQL editor on a fresh project.
-- ================================================================


-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role        AS ENUM ('generator', 'collector', 'admin', 'platform_admin');
CREATE TYPE collector_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
CREATE TYPE listing_status   AS ENUM ('open', 'bidding', 'claimed', 'confirmed', 'completed', 'cancelled', 'expired');
CREATE TYPE claim_status     AS ENUM ('pending', 'confirmed', 'declined');
CREATE TYPE hazard_level     AS ENUM ('non_hazardous', 'low', 'medium', 'high');
CREATE TYPE pickup_type      AS ENUM ('one_time', 'recurring');
CREATE TYPE claim_mode       AS ENUM ('quick_claim', 'open_bids');


-- ============================================
-- INSTITUTIONS  (multi-tenancy — v1.2 Part 1)
-- ============================================
CREATE TABLE institutions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  short_name TEXT,
  logo_url   TEXT,
  country    TEXT DEFAULT 'Sri Lanka',
  city       TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UoP is client #1 — fixed UUID so department seeds reference it safely
INSERT INTO institutions (id, name, short_name, city) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'University of Peradeniya', 'UoP', 'Peradeniya');


-- ============================================
-- PROFILES  (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role       user_role NOT NULL,
  full_name  TEXT NOT NULL,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- HELPER: role check function (avoids recursive RLS on profiles)
-- Must be defined AFTER profiles table exists.
-- ============================================
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================
-- GENERATORS
-- ============================================
CREATE TABLE generators (
  id                  UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  institution_id      UUID REFERENCES institutions(id),
  faculty             TEXT NOT NULL,
  department          TEXT NOT NULL,
  job_title           TEXT,
  lab_name            TEXT,              -- "Analytical Chemistry Lab"  (v1.2 Part 9)
  is_authorized       BOOLEAN DEFAULT FALSE,
  authorized_by       TEXT,
  is_dept_coordinator BOOLEAN DEFAULT FALSE  -- v1.2 Part 9: can invite within own dept
);


-- ============================================
-- COLLECTORS
-- ============================================
CREATE TABLE collectors (
  id                       UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  company_name             TEXT NOT NULL,
  contact_person           TEXT NOT NULL,
  cea_license              TEXT NOT NULL,
  cea_verified             BOOLEAN DEFAULT FALSE,
  accepted_streams         TEXT[] NOT NULL,
  handles_hazardous        BOOLEAN DEFAULT FALSE,
  service_area             TEXT,
  description              TEXT,
  website                  TEXT,
  status                   collector_status DEFAULT 'pending',
  approved_at              TIMESTAMPTZ,
  approved_by              UUID REFERENCES profiles(id),
  rejection_reason         TEXT,
  -- E-waste capability badges  (Supplement v1.1 Part 6)
  basel_certified          BOOLEAN DEFAULT FALSE,
  data_destruction_certified BOOLEAN DEFAULT FALSE,
  crt_capable              BOOLEAN DEFAULT FALSE,
  precious_metal_recovery  BOOLEAN DEFAULT FALSE,
  iso_14001                BOOLEAN DEFAULT FALSE,
  doorstep_pickup          BOOLEAN DEFAULT FALSE,
  issues_destruction_cert  BOOLEAN DEFAULT FALSE
);


-- ============================================
-- DEPARTMENTS MASTER LIST
-- ============================================
CREATE TABLE departments (
  id             SERIAL PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id),
  faculty        TEXT NOT NULL,
  department     TEXT NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE
);

INSERT INTO departments (institution_id, faculty, department) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Agriculture', 'Agricultural Biology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Agriculture', 'Agricultural Economics & Business Management'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Agriculture', 'Agricultural Engineering'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Agriculture', 'Animal Science'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Agriculture', 'Crop Science'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Agriculture', 'Food Science & Technology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Agriculture', 'Soil Science'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts', 'Economics & Statistics'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts', 'English'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts', 'Fine Arts'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts', 'Geography'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts', 'History'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts', 'Philosophy & Psychology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts', 'Sinhala & Mass Communication'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts', 'Sociology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Dental Sciences', 'Basic Sciences'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Dental Sciences', 'Clinical Sciences'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Engineering', 'Chemical & Process Engineering'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Engineering', 'Civil Engineering'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Engineering', 'Computer Engineering'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Engineering', 'Electrical & Electronic Engineering'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Engineering', 'Mechanical Engineering'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Anatomy'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Biochemistry'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Community Medicine'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Medicine'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Microbiology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Obstetrics & Gynaecology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Pathology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Pharmacology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Physiology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine', 'Surgery'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science', 'Botany'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science', 'Chemistry'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science', 'Geology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science', 'Mathematics'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science', 'Molecular Biology & Biotechnology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science', 'Physics'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science', 'Statistics & Computer Science'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science', 'Zoology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Veterinary Medicine', 'Veterinary Clinical Sciences'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Veterinary Medicine', 'Veterinary Pathobiology'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Allied Health Sciences', 'Nursing'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Allied Health Sciences', 'Physiotherapy'),
  ('00000000-0000-0000-0000-000000000001', 'Non-Academic', 'Central Canteen & Catering'),
  ('00000000-0000-0000-0000-000000000001', 'Non-Academic', 'Facilities Management & Maintenance'),
  ('00000000-0000-0000-0000-000000000001', 'Non-Academic', 'Library'),
  ('00000000-0000-0000-0000-000000000001', 'Non-Academic', 'Student Services'),
  ('00000000-0000-0000-0000-000000000001', 'Non-Academic', 'IT Centre');


-- ============================================
-- CAMPUS LOCATIONS
-- ============================================
CREATE TABLE campus_locations (
  id             SERIAL PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id),
  name           TEXT NOT NULL,
  zone           TEXT
);

INSERT INTO campus_locations (institution_id, name, zone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Science Building',    'science zone'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Engineering',          'engineering zone'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Agriculture',          'agriculture zone'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Arts',                 'arts zone'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Medicine',             'medical zone'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Dental Sciences',      'medical zone'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Veterinary Medicine',  'veterinary zone'),
  ('00000000-0000-0000-0000-000000000001', 'Faculty of Allied Health Sciences','medical zone'),
  ('00000000-0000-0000-0000-000000000001', 'Central Canteen',                 'central'),
  ('00000000-0000-0000-0000-000000000001', 'University Library',              'central'),
  ('00000000-0000-0000-0000-000000000001', 'IT Centre',                       'central'),
  ('00000000-0000-0000-0000-000000000001', 'Administration Building',         'central'),
  ('00000000-0000-0000-0000-000000000001', 'Student Union',                   'central'),
  ('00000000-0000-0000-0000-000000000001', 'Sports Complex',                  'residential'),
  ('00000000-0000-0000-0000-000000000001', 'Student Hostels (North)',          'residential'),
  ('00000000-0000-0000-0000-000000000001', 'Student Hostels (South)',          'residential'),
  ('00000000-0000-0000-0000-000000000001', 'Staff Quarters',                  'residential'),
  ('00000000-0000-0000-0000-000000000001', 'Maintenance Yard',                'central'),
  (NULL,                                   'Other',                           NULL);


-- ============================================
-- MATERIAL LIBRARY  (v1.2 Part 10)
-- Two-tier: institution_id IS NULL = platform-wide; UUID = institution-only
-- ============================================
CREATE TABLE material_library (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id         UUID REFERENCES institutions(id) ON DELETE CASCADE,
  waste_stream           TEXT NOT NULL,
  subcategory            TEXT,
  name                   TEXT NOT NULL,
  common_aliases         TEXT[],
  description            TEXT,
  default_hazard_level   hazard_level,
  default_unit           TEXT,
  default_handling_notes TEXT,
  cas_number             TEXT,           -- required for CEA hazardous waste manifests
  ewaste_device_category TEXT,
  ewaste_has_pcb         BOOLEAN,
  ewaste_data_bearing    BOOLEAN,
  internal_code          TEXT,           -- university asset catalog / procurement ref
  suggested_for_platform BOOLEAN DEFAULT FALSE,
  created_by             UUID REFERENCES generators(id),
  usage_count            INTEGER DEFAULT 0,
  is_active              BOOLEAN DEFAULT TRUE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX material_library_stream_idx      ON material_library (waste_stream);
CREATE INDEX material_library_institution_idx ON material_library (institution_id);
CREATE INDEX material_library_search_idx ON material_library
  USING GIN (to_tsvector('english', name));
-- Note: alias matching uses ILIKE in search_materials() — no index needed at this data scale.


-- ============================================
-- LISTINGS
-- ============================================
CREATE TABLE listings (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generator_id          UUID REFERENCES generators(id) ON DELETE CASCADE NOT NULL,

  -- Waste identity
  waste_stream          TEXT NOT NULL,
  subcategory           TEXT,
  hazard_level          hazard_level DEFAULT 'non_hazardous',
  handling_notes        TEXT,

  -- Material library link  (v1.2 Part 10)
  material_library_id   UUID REFERENCES material_library(id),
  material_name         TEXT,         -- public headline shown on card + WTR
  material_name_internal TEXT,        -- internal ref, NOT shown publicly

  -- Lab attribution  (v1.2 Part 9)
  lab_name              TEXT,         -- "Analytical Chemistry Lab"

  -- Quantity
  quantity              NUMERIC NOT NULL,
  unit                  TEXT NOT NULL,

  -- Schedule
  pickup_type           pickup_type NOT NULL,
  frequency             TEXT,
  preferred_days        TEXT[],
  pickup_date           DATE,
  pickup_window         TEXT,

  -- Location
  campus_location       TEXT NOT NULL,

  -- Media
  photos                TEXT[],

  -- Authorization
  authorized_by_name    TEXT NOT NULL,
  authorized_by_title   TEXT NOT NULL,

  -- Claim / bidding mode  (v1.2 Part 2)
  claim_mode            claim_mode DEFAULT 'quick_claim',
  bid_deadline          TIMESTAMPTZ,
  financial_hint        TEXT,         -- 'we_expect_payment' | 'we_will_pay' | 'open'

  -- E-waste fields  (Supplement v1.1 Part 6)
  ewaste_device_categories   TEXT[],
  ewaste_item_count          INTEGER,
  ewaste_has_pcb             BOOLEAN DEFAULT FALSE,
  ewaste_data_bearing        BOOLEAN DEFAULT FALSE,
  ewaste_condition           TEXT,
  ewaste_hazardous_components TEXT[],
  ewaste_asset_list          TEXT,    -- Storage URL for asset list PDF/CSV

  -- Documents
  wtr_document          TEXT,         -- Waste Transfer Record PDF URL (auto-generated on completion)

  -- Status
  status                listing_status DEFAULT 'open',

  -- Audit
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  published_at          TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT high_hazard_requires_notes CHECK (
    hazard_level NOT IN ('medium', 'high') OR handling_notes IS NOT NULL
  )
);


-- ============================================
-- LISTING AUDIT LOG
-- ============================================
CREATE TABLE listing_audit_log (
  id         SERIAL PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES profiles(id),
  old_status listing_status,
  new_status listing_status,
  note       TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_listing_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO listing_audit_log(listing_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_status_audit
AFTER UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION log_listing_status_change();


-- ============================================
-- CLAIMS
-- Note: UNIQUE(listing_id, status) from v1.0 is intentionally NOT here.
-- Replaced below with a partial unique index.
-- ============================================
CREATE TABLE claims (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id    UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  collector_id  UUID REFERENCES collectors(id) ON DELETE CASCADE NOT NULL,

  -- Claim details
  proposed_pickup_date  DATE,
  collector_note        TEXT,

  -- Financial  (v1.2 Part 2)
  financial_direction   TEXT,    -- 'collector_pays_generator' | 'generator_pays_collector' | 'free_collection'
  offered_price         NUMERIC,
  price_currency        TEXT DEFAULT 'LKR',
  price_notes           TEXT,

  -- Status
  status                claim_status DEFAULT 'pending',

  -- Confirmation
  confirmed_at          TIMESTAMPTZ,
  generator_note        TEXT,

  -- Two-sided completion  (v1.2 Part 3)
  generator_confirmed_complete BOOLEAN DEFAULT FALSE,
  generator_confirmed_at       TIMESTAMPTZ,
  collector_confirmed_complete BOOLEAN DEFAULT FALSE,
  collector_confirmed_at       TIMESTAMPTZ,

  -- Completion
  completed_at          TIMESTAMPTZ,
  actual_quantity       NUMERIC,
  actual_quantity_unit  TEXT,
  completion_photo      TEXT,
  transfer_document     TEXT,

  -- Compliance docs  (v1.2 Part 4)
  hazmat_manifest_url       TEXT,   -- required for medium/high hazard on collector confirm
  data_destruction_cert_url TEXT,   -- required if ewaste_data_bearing = true

  -- E-waste destruction cert  (Supplement v1.1)
  destruction_cert_provided  BOOLEAN DEFAULT FALSE,
  destruction_cert_document  TEXT,

  -- Rating (internal only)
  collector_rating      INTEGER CHECK (collector_rating BETWEEN 1 AND 5),
  rating_note           TEXT,

  -- Decline
  declined_at           TIMESTAMPTZ,
  decline_reason        TEXT,

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- One confirmed claim per listing at a time
-- (replaces the broken UNIQUE(listing_id, status) from v1.0)
CREATE UNIQUE INDEX one_confirmed_claim_per_listing
  ON claims (listing_id) WHERE status = 'confirmed';


-- ============================================
-- GENERATOR INVITES
-- ============================================
CREATE TABLE generator_invites (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email                  TEXT NOT NULL UNIQUE,
  institution_id         UUID REFERENCES institutions(id),
  invited_by             UUID REFERENCES profiles(id),
  -- Coordinator-scoped fields  (v1.2 Part 9)
  scoped_to_faculty      TEXT,
  scoped_to_department   TEXT,
  invited_by_coordinator UUID REFERENCES generators(id),
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  expires_at             TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  used                   BOOLEAN DEFAULT FALSE,
  used_at                TIMESTAMPTZ
);


-- ============================================
-- WANTED LISTINGS  (Supplement v1.1 Part 3)
-- ============================================
CREATE TABLE wanted_listings (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id         UUID REFERENCES collectors(id) ON DELETE CASCADE,
  waste_stream         TEXT NOT NULL,
  subcategories        TEXT[],
  device_categories    TEXT[],
  min_quantity         NUMERIC,
  min_quantity_unit    TEXT,
  frequency_preference TEXT,
  service_area         TEXT,
  notes                TEXT,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  expires_at           TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);


-- ============================================
-- TRIGGERS
-- ============================================

-- 1. Two-sided completion: listing moves to 'completed' when both sides confirm
CREATE OR REPLACE FUNCTION dual_completion_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.generator_confirmed_complete = TRUE
     AND NEW.collector_confirmed_complete = TRUE
     AND (OLD.generator_confirmed_complete = FALSE
          OR OLD.collector_confirmed_complete = FALSE) THEN
    UPDATE listings
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.listing_id;
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claims_dual_completion
BEFORE UPDATE ON claims
FOR EACH ROW EXECUTE FUNCTION dual_completion_check();

-- 2. Validate completion documents before collector can confirm  (v1.2 Part 4)
CREATE OR REPLACE FUNCTION validate_completion_documents()
RETURNS TRIGGER AS $$
DECLARE
  listing_rec RECORD;
BEGIN
  IF NEW.collector_confirmed_complete = TRUE
     AND OLD.collector_confirmed_complete = FALSE THEN
    SELECT ewaste_data_bearing, hazard_level
    INTO listing_rec
    FROM listings WHERE id = NEW.listing_id;

    IF listing_rec.ewaste_data_bearing = TRUE
       AND NEW.data_destruction_cert_url IS NULL THEN
      RAISE EXCEPTION 'Data destruction certificate required for data-bearing devices';
    END IF;

    IF listing_rec.hazard_level IN ('medium', 'high')
       AND NEW.hazmat_manifest_url IS NULL THEN
      RAISE EXCEPTION 'Hazmat manifest required for medium/high hazard waste';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claims_validate_completion_docs
BEFORE UPDATE ON claims
FOR EACH ROW EXECUTE FUNCTION validate_completion_documents();

-- 3. Increment material usage_count when listing goes open  (v1.2 Part 10)
CREATE OR REPLACE FUNCTION increment_material_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.material_library_id IS NOT NULL
     AND NEW.status = 'open'
     AND (OLD.status IS NULL OR OLD.status <> 'open') THEN
    UPDATE material_library
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE id = NEW.material_library_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_increments_material_usage
AFTER INSERT OR UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION increment_material_usage();


-- ============================================
-- SEARCH MATERIALS FUNCTION  (v1.2 Part 10)
-- Powers wizard autocomplete: searches platform + institution libraries simultaneously
-- ============================================
CREATE OR REPLACE FUNCTION search_materials(
  search_query    TEXT,
  p_institution_id UUID,
  p_waste_stream  TEXT    DEFAULT NULL,
  result_limit    INTEGER DEFAULT 10
)
RETURNS TABLE (
  id                     UUID,
  name                   TEXT,
  waste_stream           TEXT,
  subcategory            TEXT,
  default_hazard_level   hazard_level,
  default_unit           TEXT,
  default_handling_notes TEXT,
  cas_number             TEXT,
  ewaste_device_category TEXT,
  ewaste_has_pcb         BOOLEAN,
  ewaste_data_bearing    BOOLEAN,
  usage_count            INTEGER,
  source                 TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id, m.name, m.waste_stream, m.subcategory,
    m.default_hazard_level, m.default_unit, m.default_handling_notes,
    m.cas_number, m.ewaste_device_category, m.ewaste_has_pcb,
    m.ewaste_data_bearing, m.usage_count,
    CASE WHEN m.institution_id IS NULL THEN 'platform' ELSE 'institution' END AS source
  FROM material_library m
  WHERE
    m.is_active = TRUE
    AND (m.institution_id IS NULL OR m.institution_id = p_institution_id)
    AND (p_waste_stream IS NULL OR m.waste_stream = p_waste_stream)
    AND (
      to_tsvector('english', m.name) @@ plainto_tsquery('english', search_query)
      OR m.name ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(m.common_aliases) alias
        WHERE alias ILIKE '%' || search_query || '%'
      )
      OR m.cas_number = search_query
    )
  ORDER BY
    CASE WHEN m.institution_id IS NOT NULL THEN 0 ELSE 1 END,
    m.usage_count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (
  auth_user_role() IN ('admin', 'platform_admin')
);

-- INSTITUTIONS
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active institutions" ON institutions
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Platform admin manages institutions" ON institutions FOR ALL USING (
  auth_user_role() = 'platform_admin'
);

-- GENERATORS
ALTER TABLE generators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Generators read/update own record" ON generators FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins manage generators" ON generators FOR ALL USING (
  auth_user_role() IN ('admin', 'platform_admin')
);

-- COLLECTORS
ALTER TABLE collectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collectors read/update own record" ON collectors FOR ALL USING (auth.uid() = id);
CREATE POLICY "Approved collectors visible to authenticated" ON collectors
  FOR SELECT USING (status = 'approved' AND auth.role() = 'authenticated');
CREATE POLICY "Admins manage collectors" ON collectors FOR ALL USING (
  auth_user_role() IN ('admin', 'platform_admin')
);

-- DEPARTMENTS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage departments" ON departments FOR ALL USING (
  auth_user_role() IN ('admin', 'platform_admin')
);

-- CAMPUS LOCATIONS
ALTER TABLE campus_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read locations" ON campus_locations FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage locations" ON campus_locations FOR ALL USING (
  auth_user_role() IN ('admin', 'platform_admin')
);

-- LISTINGS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open and bidding listings visible publicly" ON listings
  FOR SELECT USING (status IN ('open', 'bidding'));
CREATE POLICY "Generators CRUD own listings" ON listings FOR ALL USING (
  auth.uid() = generator_id
);
CREATE POLICY "Authenticated users read all listings" ON listings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Dept coordinators read own dept listings" ON listings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM generators coord
    JOIN generators poster
      ON poster.institution_id = coord.institution_id
      AND poster.faculty = coord.faculty
      AND poster.department = coord.department
    WHERE coord.id = auth.uid()
      AND coord.is_dept_coordinator = TRUE
      AND poster.id = listings.generator_id
  )
);
CREATE POLICY "Admins full access on listings" ON listings FOR ALL USING (
  auth_user_role() IN ('admin', 'platform_admin')
);

-- CLAIMS
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collectors read/create own claims" ON claims FOR ALL USING (
  auth.uid() = collector_id
);
CREATE POLICY "Generators read claims on their listings" ON claims FOR SELECT USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND generator_id = auth.uid())
);
CREATE POLICY "Generators update claims on their listings" ON claims FOR UPDATE USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND generator_id = auth.uid())
);
CREATE POLICY "Admins full access on claims" ON claims FOR ALL USING (
  auth_user_role() IN ('admin', 'platform_admin')
);
-- Only Basel-certified collectors can claim e-waste listings with PCBs
-- Note: in RLS WITH CHECK, use column names directly (not NEW.column)
CREATE POLICY "Certified collectors only for PCB ewaste" ON claims FOR INSERT WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM listings l
    JOIN collectors c ON c.id = collector_id
    WHERE l.id = listing_id
      AND l.waste_stream = 'ewaste'
      AND l.ewaste_has_pcb = TRUE
      AND c.basel_certified = FALSE
  )
);

-- GENERATOR INVITES
ALTER TABLE generator_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all invites" ON generator_invites FOR ALL USING (
  auth_user_role() IN ('admin', 'platform_admin')
);
CREATE POLICY "Coordinators manage own dept invites" ON generator_invites FOR ALL USING (
  invited_by_coordinator IS NOT NULL AND EXISTS (
    SELECT 1 FROM generators
    WHERE id = auth.uid()
      AND is_dept_coordinator = TRUE
      AND id = generator_invites.invited_by_coordinator
  )
);

-- WANTED LISTINGS
ALTER TABLE wanted_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active wanted listings" ON wanted_listings
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Collectors manage own wanted listings" ON wanted_listings FOR ALL USING (
  auth.uid() = collector_id
);
CREATE POLICY "Admin full access on wanted listings" ON wanted_listings FOR ALL USING (
  auth_user_role() IN ('admin', 'platform_admin')
);

-- AUDIT LOG
ALTER TABLE listing_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON listing_audit_log FOR SELECT USING (
  auth_user_role() IN ('admin', 'platform_admin')
);
CREATE POLICY "Generators read own listing logs" ON listing_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND generator_id = auth.uid())
);

-- MATERIAL LIBRARY
ALTER TABLE material_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform materials visible to authenticated" ON material_library
  FOR SELECT USING (
    institution_id IS NULL AND is_active = TRUE AND auth.role() = 'authenticated'
  );
CREATE POLICY "Institution materials visible to own institution" ON material_library
  FOR SELECT USING (
    institution_id IS NOT NULL AND is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM generators g
      WHERE g.id = auth.uid() AND g.institution_id = material_library.institution_id
    )
  );
CREATE POLICY "Generators create institution materials" ON material_library
  FOR INSERT WITH CHECK (
    institution_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM generators g
      WHERE g.id = auth.uid() AND g.institution_id = material_library.institution_id
    )
  );
CREATE POLICY "Platform admin full access on material library" ON material_library FOR ALL USING (
  auth_user_role() = 'platform_admin'
);
CREATE POLICY "Institution admin manages own library" ON material_library FOR ALL USING (
  institution_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p JOIN generators g ON g.id = p.id
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'platform_admin')
      AND g.institution_id = material_library.institution_id
  )
);


-- ============================================
-- MATERIAL LIBRARY SEED DATA  (v1.2 Part 10c)
-- Platform-wide (institution_id IS NULL) — available to all institutions
-- ============================================
INSERT INTO material_library
  (institution_id, waste_stream, subcategory, name, common_aliases,
   default_hazard_level, default_unit, cas_number, default_handling_notes)
VALUES
  -- ACIDS & BASES
  (NULL, 'chemical', 'Acids & bases',
   'Sulphuric Acid H2SO4 — concentrated (>50%)',
   ARRAY['Sulfuric acid', 'H2SO4', 'battery acid'],
   'high', 'litres', '7664-93-9',
   'Corrosive. Store separately from bases and oxidisers. Neutralise before disposal.'),

  (NULL, 'chemical', 'Acids & bases',
   'Hydrochloric Acid HCl — concentrated (>30%)',
   ARRAY['Muriatic acid', 'HCl', 'hydrogen chloride solution'],
   'high', 'litres', '7647-01-0',
   'Corrosive, fuming. Handle in fume hood. Keep away from oxidisers.'),

  (NULL, 'chemical', 'Acids & bases',
   'Sodium Hydroxide NaOH — solid or solution',
   ARRAY['Caustic soda', 'lye', 'NaOH'],
   'medium', 'kg', '1310-73-2',
   'Corrosive base. Neutralise with dilute acid before disposal.'),

  -- ORGANIC SOLVENTS
  (NULL, 'chemical', 'Organic solvents',
   'Acetonitrile — HPLC / analytical grade',
   ARRAY['MeCN', 'methyl cyanide', 'ACN'],
   'medium', 'litres', '75-05-8',
   'Flammable. Toxic vapours. Dispose via licensed chemical waste collector.'),

  (NULL, 'chemical', 'Organic solvents',
   'Methanol — analytical / lab grade',
   ARRAY['Methyl alcohol', 'MeOH', 'wood alcohol'],
   'medium', 'litres', '67-56-1',
   'Highly flammable. Toxic. Do not pour down drain.'),

  (NULL, 'chemical', 'Organic solvents',
   'Chloroform (Trichloromethane)',
   ARRAY['CHCl3', 'trichloromethane'],
   'high', 'litres', '67-66-3',
   'Suspected carcinogen. Volatile. Must be collected in sealed amber bottles.'),

  (NULL, 'chemical', 'Organic solvents',
   'Ethanol — absolute / denatured',
   ARRAY['Ethyl alcohol', 'EtOH', 'alcohol'],
   'low', 'litres', '64-17-5',
   'Flammable. Lower hazard than other organic solvents.'),

  -- INORGANIC REAGENTS
  (NULL, 'chemical', 'Inorganic reagents',
   'Potassium Permanganate KMnO4',
   ARRAY['KMnO4', 'permanganate'],
   'medium', 'kg', '7722-64-7',
   'Strong oxidiser. Keep away from flammable materials.'),

  -- EXPIRED CHEMICALS
  (NULL, 'chemical', 'Expired chemicals',
   'Mixed expired reagents — inorganic',
   ARRAY['old reagents', 'expired inorganic chemicals'],
   'medium', 'kg', NULL,
   'Mixed lot. Provide detailed inventory list to collector at pickup.'),

  (NULL, 'chemical', 'Expired chemicals',
   'Mixed expired reagents — organic',
   ARRAY['old reagents', 'expired organic chemicals'],
   'high', 'kg', NULL,
   'Mixed organic solvents and reagents. Provide detailed inventory. Do not mix oxidisers.'),

  -- BIOLOGICAL
  (NULL, 'chemical', 'Biological waste',
   'Agar plates and microbiological media — autoclaved',
   ARRAY['petri dishes', 'agar', 'culture media'],
   'low', 'bags', NULL,
   'Must be autoclaved before disposal. Bag in autoclave bags.'),

  -- E-WASTE: COMPUTERS
  (NULL, 'ewaste', 'Computers & laptops',
   'Desktop computer — tower unit',
   ARRAY['PC', 'desktop', 'tower PC', 'workstation'],
   'low', 'units', NULL, NULL),

  (NULL, 'ewaste', 'Computers & laptops',
   'Laptop computer',
   ARRAY['notebook', 'laptop'],
   'low', 'units', NULL, NULL),

  -- E-WASTE: LAB EQUIPMENT
  (NULL, 'ewaste', 'Lab equipment & instruments',
   'Centrifuge — benchtop / floor model',
   ARRAY['centrifuge', 'spinner', 'micro centrifuge'],
   'low', 'units', NULL, NULL),

  (NULL, 'ewaste', 'Lab equipment & instruments',
   'Oscilloscope — analogue or digital',
   ARRAY['oscilloscope', 'DSO', 'CRO'],
   'low', 'units', NULL, NULL),

  (NULL, 'ewaste', 'Lab equipment & instruments',
   'UV-Vis Spectrophotometer',
   ARRAY['spectrophotometer', 'UV-vis', 'spec 20'],
   'low', 'units', NULL, NULL),

  -- E-WASTE: MONITORS
  (NULL, 'ewaste', 'Monitors (CRT/LCD)',
   'CRT monitor',
   ARRAY['cathode ray tube', 'CRT screen', 'old monitor'],
   'medium', 'units', NULL,
   'Contains lead and mercury. CRT-capable collector required.'),

  -- E-WASTE: BATTERIES
  (NULL, 'ewaste', 'Batteries',
   'Lead-acid battery — UPS / laboratory',
   ARRAY['lead acid', 'UPS battery', 'VRLA battery'],
   'medium', 'units', NULL,
   'Contains sulfuric acid and lead. Do not puncture or short-circuit.'),

  (NULL, 'ewaste', 'Batteries',
   'Lithium-ion battery pack',
   ARRAY['Li-ion', 'LiPo', 'lithium battery'],
   'medium', 'units', NULL,
   'Fire risk if damaged. Keep terminals covered. Store in cool, dry location.'),

  -- E-WASTE: CABLES
  (NULL, 'ewaste', 'Cables & wiring',
   'Mixed copper data/power cables',
   ARRAY['cables', 'wiring', 'ethernet', 'copper wire'],
   'non_hazardous', 'kg', NULL, NULL),

  -- GENERAL
  (NULL, 'organic', 'Food scraps',
   'Cafeteria food waste — mixed',
   ARRAY['food waste', 'canteen waste', 'kitchen waste'],
   'non_hazardous', 'kg', NULL, NULL),

  (NULL, 'paper', 'Office paper',
   'Mixed office paper — A4',
   ARRAY['paper', 'white paper', 'copy paper'],
   'non_hazardous', 'kg', NULL, NULL),

  (NULL, 'plastic', 'Lab plastic consumables',
   'Mixed lab plastics — pipette tips, tubes, plates',
   ARRAY['lab plastic', 'consumables', 'pipette tips', 'falcon tubes'],
   'low', 'bags', NULL,
   'May contain trace chemical residue. Rinse before disposal where possible.');


-- ================================================================
-- DONE.
-- Next steps:
--   1. Create storage buckets in Supabase dashboard > Storage:
--        "listing-photos"      — Public: YES, 5MB limit, image/jpeg|png|webp
--        "completion-documents"— Public: NO,  10MB limit, image/jpeg|png|pdf
--   2. Copy VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY into .env
--   3. Run npm run dev — should connect cleanly
-- ================================================================
