-- =============================================================================
-- Row Level Security Policies
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- The service role key used by the app bypasses RLS automatically, so these
-- policies protect against direct Supabase API access and compromised anon keys.
--
-- Re-runnable: each CREATE POLICY is guarded by DROP POLICY IF EXISTS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- products, product_options, quantity_tiers — public read, no writes via API
-- ---------------------------------------------------------------------------

ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantity_tiers   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active products"    ON products;
DROP POLICY IF EXISTS "Public can read product options"    ON product_options;
DROP POLICY IF EXISTS "Public can read quantity tiers"     ON quantity_tiers;

CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (active = true);

CREATE POLICY "Public can read product options"
  ON product_options FOR SELECT
  USING (true);

CREATE POLICY "Public can read quantity tiers"
  ON quantity_tiers FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- orders — no direct API access until Phase 4 (user_id FK)
-- All order operations go through the service role (Drizzle / server actions).
-- ---------------------------------------------------------------------------

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct API access to orders" ON orders;

-- Deny all non-service-role access. The service role bypasses RLS.
CREATE POLICY "No direct API access to orders"
  ON orders FOR ALL
  USING (false);

-- ---------------------------------------------------------------------------
-- order_items — same as orders
-- ---------------------------------------------------------------------------

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct API access to order_items" ON order_items;

CREATE POLICY "No direct API access to order_items"
  ON order_items FOR ALL
  USING (false);

-- ---------------------------------------------------------------------------
-- order_files — same as orders
-- ---------------------------------------------------------------------------

ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct API access to order_files" ON order_files;

CREATE POLICY "No direct API access to order_files"
  ON order_files FOR ALL
  USING (false);

-- ---------------------------------------------------------------------------
-- fulfillment_quotes, fulfillment_submissions, fulfillment_events — admin only
-- ---------------------------------------------------------------------------

ALTER TABLE fulfillment_quotes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_events      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct API access to fulfillment_quotes"      ON fulfillment_quotes;
DROP POLICY IF EXISTS "No direct API access to fulfillment_submissions" ON fulfillment_submissions;
DROP POLICY IF EXISTS "No direct API access to fulfillment_events"      ON fulfillment_events;

CREATE POLICY "No direct API access to fulfillment_quotes"
  ON fulfillment_quotes FOR ALL USING (false);

CREATE POLICY "No direct API access to fulfillment_submissions"
  ON fulfillment_submissions FOR ALL USING (false);

CREATE POLICY "No direct API access to fulfillment_events"
  ON fulfillment_events FOR ALL USING (false);

-- ---------------------------------------------------------------------------
-- product_vendor_mappings — admin only
-- ---------------------------------------------------------------------------

ALTER TABLE product_vendor_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct API access to product_vendor_mappings" ON product_vendor_mappings;

CREATE POLICY "No direct API access to product_vendor_mappings"
  ON product_vendor_mappings FOR ALL USING (false);

-- ---------------------------------------------------------------------------
-- preview_sessions — scoped to session token cookie for anonymous access
-- Phase 4: replace token check with auth.uid() = user_id once auth is wired.
-- ---------------------------------------------------------------------------

ALTER TABLE preview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Session owner can access own preview_sessions" ON preview_sessions;
DROP POLICY IF EXISTS "No unauthenticated bulk access to preview_sessions" ON preview_sessions;

-- Allow access only where the current_setting matches the stored session token.
-- The server sets app.current_session_token before each query via Drizzle.
-- Direct Supabase API calls (anon key) without the session token are denied.
CREATE POLICY "Session owner can access own preview_sessions"
  ON preview_sessions FOR ALL
  USING (session_token = current_setting('app.current_session_token', true));

-- ---------------------------------------------------------------------------
-- print_specs — authenticated read only (RLS per @spawn: review finding)
-- ---------------------------------------------------------------------------

ALTER TABLE print_specs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read print specs" ON print_specs;

CREATE POLICY "Authenticated users can read print specs"
  ON print_specs FOR SELECT
  USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- bundles — public read, active only (inactive bundles must not leak)
-- ---------------------------------------------------------------------------

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active bundles" ON bundles;

CREATE POLICY "Public can read active bundles"
  ON bundles FOR SELECT
  USING (active = true);

-- ---------------------------------------------------------------------------
-- bundle_items — public read (customers need to see bundle contents)
-- Active filtering happens at query time via the bundles join.
-- ---------------------------------------------------------------------------

ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read bundle items" ON bundle_items;

CREATE POLICY "Public can read bundle items"
  ON bundle_items FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- vendor_product_mappings — server-side only; deny all non-service-role access
-- ---------------------------------------------------------------------------

ALTER TABLE vendor_product_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct API access to vendor_product_mappings" ON vendor_product_mappings;

CREATE POLICY "No direct API access to vendor_product_mappings"
  ON vendor_product_mappings FOR ALL
  USING (false);

-- ---------------------------------------------------------------------------
-- Supabase Storage — artwork bucket
-- Run separately if the bucket already exists.
-- The INSERT below is safe to run even if the bucket exists (ON CONFLICT DO NOTHING).
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork', 'artwork', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Only the service role (server-side code) may read/write artwork files.
-- Phase 4: replace USING (false) with USING (auth.uid() = owner_id) once
-- user_id is added to orders and propagated to storage paths.

DROP POLICY IF EXISTS "No direct API access to artwork storage" ON storage.objects;

CREATE POLICY "No direct API access to artwork storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'artwork' AND false);
