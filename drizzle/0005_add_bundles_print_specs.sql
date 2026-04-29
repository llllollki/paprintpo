-- Migration 0005: add print_specs, bundles, bundle_items, vendor_product_mappings
-- @spawn: review approved with changes applied (bleed_mm, dpi_required added; RLS in rls_policies.sql)

CREATE TABLE IF NOT EXISTS "print_specs" (
  "id"            TEXT        PRIMARY KEY,
  "product_type"  TEXT        NOT NULL,
  "quantity"      INTEGER     NOT NULL,
  "size"          TEXT        NOT NULL,
  "sides"         TEXT        NOT NULL,
  "finish"        TEXT        NOT NULL,
  "paper_stock"   TEXT        NOT NULL,
  "orientation"   TEXT        NOT NULL,
  "bleed_mm"      INTEGER     NOT NULL,
  "dpi_required"  INTEGER     NOT NULL,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "bundles" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug"        TEXT        NOT NULL UNIQUE,
  "name"        TEXT        NOT NULL,
  "description" TEXT,
  "price"       INTEGER     NOT NULL,
  "active"      BOOLEAN     NOT NULL DEFAULT true,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "bundle_items" (
  "id"                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "bundle_id"         UUID        NOT NULL REFERENCES "bundles"("id") ON DELETE CASCADE,
  "print_spec_id"     TEXT        NOT NULL REFERENCES "print_specs"("id"),
  "quantity_override" INTEGER,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "bundle_items_bundle_id_idx" ON "bundle_items" ("bundle_id");

CREATE TABLE IF NOT EXISTS "vendor_product_mappings" (
  "id"                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "print_spec_id"     TEXT        NOT NULL REFERENCES "print_specs"("id"),
  "vendor_id"         TEXT        NOT NULL,
  "vendor_sku"        TEXT        NOT NULL,
  "vendor_product_ref" TEXT,
  "active"            BOOLEAN     NOT NULL DEFAULT true,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("print_spec_id", "vendor_id")
);
