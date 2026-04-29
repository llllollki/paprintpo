// Paprintpo canonical print specs — stable internal identifiers that must not
// change even if vendors are swapped. Adapters resolve these to vendor SKUs via
// vendor_product_mappings in the DB.
//
// Format: {product_type}_{variant}_{quantity}
//
// DB: print_specs table mirrors these constants. Requires @spawn: review before
// the migration is written (per CLAUDE.md Schema notes).
// STUB: print_specs table not yet created — this file defines the types and MVP
// constants used by seed scripts and adapter mapping logic.

export interface PrintSpec {
  id: string;                           // stable slug, e.g. "business_card_standard_250"
  productType: string;                  // e.g. "business_cards"
  quantity: number;
  size: string;                         // e.g. "3.5x2in"
  sides: "single" | "double";
  finish: "matte" | "gloss" | "none";
  paperStock: string;                   // e.g. "16pt_coated"
  orientation: "portrait" | "landscape";
  bleedMm: number;
  dpiRequired: number;
}

export const PRINT_SPECS: Record<string, PrintSpec> = {
  business_card_standard_250: {
    id: "business_card_standard_250",
    productType: "business_cards",
    quantity: 250,
    size: "3.5x2in",
    sides: "double",
    finish: "matte",
    paperStock: "16pt_coated",
    orientation: "landscape",
    bleedMm: 3,
    dpiRequired: 300,
  },
  flyer_basic_250: {
    id: "flyer_basic_250",
    productType: "flyers",
    quantity: 250,
    size: "8.5x11in",
    sides: "single",
    finish: "gloss",
    paperStock: "100lb_text",
    orientation: "portrait",
    bleedMm: 3,
    dpiRequired: 300,
  },
  sticker_die_cut_100: {
    id: "sticker_die_cut_100",
    productType: "stickers",
    quantity: 100,
    size: "3x3in",
    sides: "single",
    finish: "gloss",
    paperStock: "vinyl",
    orientation: "portrait",
    bleedMm: 2,
    dpiRequired: 300,
  },
  loyalty_card_250: {
    id: "loyalty_card_250",
    productType: "loyalty_cards",
    quantity: 250,
    size: "3.5x2in",
    sides: "double",
    finish: "matte",
    paperStock: "16pt_coated",
    orientation: "landscape",
    bleedMm: 3,
    dpiRequired: 300,
  },
  reminder_card_250: {
    id: "reminder_card_250",
    productType: "reminder_cards",
    quantity: 250,
    size: "4x6in",
    sides: "single",
    finish: "gloss",
    paperStock: "14pt_coated",
    orientation: "landscape",
    bleedMm: 3,
    dpiRequired: 300,
  },
  poster_standard_1: {
    id: "poster_standard_1",
    productType: "posters",
    quantity: 1,
    size: "18x24in",
    sides: "single",
    finish: "gloss",
    paperStock: "100lb_text",
    orientation: "portrait",
    bleedMm: 3,
    dpiRequired: 150,
  },
};
