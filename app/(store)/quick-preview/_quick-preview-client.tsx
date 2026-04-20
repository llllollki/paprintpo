"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/pricing";
import type { BundleWithItems } from "./page";
import type { CartItem, ArtworkFile } from "@/lib/cart";

// Maps productType slug → mockup image path
const MOCKUP_PATHS: Record<string, string> = {
  business_cards: "/mockups/business_cards.svg",
  flyers: "/mockups/flyers.svg",
  stickers: "/mockups/stickers.svg",
  posters: "/mockups/posters.svg",
  loyalty_cards: "/mockups/loyalty_cards.svg",
  reminder_cards: "/mockups/reminder_cards.svg",
};

const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"] as const;
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// ---------------------------------------------------------------------------
// ProductMockup — single product mockup with artwork overlay
// ---------------------------------------------------------------------------

function ProductMockup({
  productType,
  artworkUrl,
  size = "md",
}: {
  productType: string;
  artworkUrl: string | null;
  size?: "sm" | "md";
}) {
  const mockup = MOCKUP_PATHS[productType] ?? "/mockups/business_cards.svg";
  const dim = size === "sm" ? 80 : 120;

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-lg"
      style={{ width: dim, height: dim, background: "var(--surface)" }}
    >
      <Image
        src={mockup}
        alt={productType.replace(/_/g, " ")}
        fill
        style={{ objectFit: "contain" }}
        sizes={`${dim}px`}
      />
      {artworkUrl && (
        <div
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{ inset: "12%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artworkUrl}
            alt="Your artwork preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.82,
              borderRadius: 4,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BundleCard
// ---------------------------------------------------------------------------

function BundleCard({
  bundle,
  artworkUrl,
  artworkFile,
  isExpanded,
  onToggle,
}: {
  bundle: BundleWithItems;
  artworkUrl: string | null;
  artworkFile: ArtworkFile | null;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { addItem } = useCart();

  function handleAddBundle() {
    const bundleId = bundle.id;
    const bundleName = bundle.name;

    for (const bundleItem of bundle.items) {
      const product = bundleItem.product;
      if (!product) continue;

      const spec = bundleItem.spec;
      const quantity = bundleItem.quantityOverride ?? spec.quantity;

      // Build default options from spec
      const defaultOptions: Record<string, string> = {};
      const defaultLabels: Record<string, string> = {};
      if (spec.finish && spec.finish !== "none") {
        defaultOptions.finish = spec.finish;
        defaultLabels.finish = spec.finish.charAt(0).toUpperCase() + spec.finish.slice(1);
      }
      if (spec.sides) {
        defaultOptions.sides = spec.sides;
        defaultLabels.sides = spec.sides === "double" ? "Double-sided" : "Single-sided";
      }

      // Use the first tier at the spec quantity for pricing
      const applicableTiers = (product.tiers ?? [])
        .filter((t) => quantity >= t.minQty)
        .sort((a, b) => b.minQty - a.minQty);
      const tierApplied = applicableTiers[0] ?? null;
      const unitPriceCents = tierApplied?.unitPrice ?? product.basePrice;
      const lineTotalCents = unitPriceCents * quantity;

      const cartItem: Omit<CartItem, "id"> = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        slug: product.slug,
        selectedOptions: defaultOptions,
        optionLabels: defaultLabels,
        quantity,
        unitPriceCents,
        lineTotalCents,
        minQty: product.tiers?.[0]?.minQty ?? 1,
        basePrice: product.basePrice,
        optionModifiers: [],
        tiers: (product.tiers ?? []).map((t) => ({ minQty: t.minQty, unitPrice: t.unitPrice })),
        artworkFile: artworkFile ?? undefined,
        bundleId,
        bundleName,
      };

      addItem(cartItem);
    }

    // Navigate to cart after adding
    window.location.href = "/cart";
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "white",
        boxShadow: isExpanded ? "var(--shadow-lg)" : "var(--shadow-sm)",
        border: isExpanded ? "2px solid var(--violet)" : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Card header */}
      <button
        className="w-full text-left px-6 pt-6 pb-5 transition-colors hover:bg-violet-50/30"
        onClick={onToggle}
        style={{ display: "block" }}
      >
        {/* Mockup collage */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {bundle.items.map((item) => (
            <ProductMockup
              key={item.id}
              productType={item.spec.productType}
              artworkUrl={artworkUrl}
              size="sm"
            />
          ))}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "var(--violet)" }}>
              Print Bundle
            </p>
            <h3
              className="font-extrabold text-lg leading-tight tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}
            >
              {bundle.name}
            </h3>
            <p className="text-sm mt-1 leading-[1.65]" style={{ color: "var(--ink-soft)" }}>
              {bundle.description}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>
              {formatCents(bundle.price)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>bundle price</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          <span className="text-xs font-medium" style={{ color: "var(--violet)" }}>
            {isExpanded ? "Hide details" : "See details"}
          </span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: "var(--violet)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <div className="px-6 py-5 space-y-5">
            {bundle.items.map((item) => (
              <div key={item.id} className="flex gap-4 items-start">
                <ProductMockup
                  productType={item.spec.productType}
                  artworkUrl={artworkUrl}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                    {item.product?.name ?? item.spec.productType.replace(/_/g, " ")}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs" style={{ color: "var(--ink-soft)" }}>
                    <li>Qty: {item.quantityOverride ?? item.spec.quantity}</li>
                    <li>Size: {item.spec.size}</li>
                    <li>Finish: {item.spec.finish}</li>
                    <li>Sides: {item.spec.sides}</li>
                  </ul>
                  {!item.product && (
                    <p className="mt-1 text-xs" style={{ color: "#d97706" }}>
                      Product coming soon
                    </p>
                  )}
                  {artworkUrl && (
                    <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "#16a34a" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Artwork applied
                    </div>
                  )}
                  {/* Inline image warning if needed */}
                  {artworkUrl && item.spec.dpiRequired > 0 && (
                    <p className="mt-1 text-xs" style={{ color: "var(--ink-soft)", opacity: 0.7 }}>
                      Requires {item.spec.dpiRequired} DPI · {item.spec.bleedMm}mm bleed
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 pb-6">
            {!artworkUrl && (
              <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: "#92400e", background: "#fffbeb" }}>
                Upload your artwork above to preview it on these products.
              </p>
            )}
            <button
              onClick={handleAddBundle}
              disabled={bundle.items.every((i) => !i.product)}
              className="w-full rounded-lg py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--violet)" }}
            >
              Add Bundle to Cart — {formatCents(bundle.price)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

export function QuickPreviewClient({ bundles }: { bundles: BundleWithItems[] }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [artworkFile, setArtworkFile] = useState<ArtworkFile | null>(null);
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setUploadError(null);

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      setUploadError("Only PNG, JPEG, and PDF files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("File must be 50 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      // 1. Get a signed upload URL
      const presignRes = await fetch("/api/uploads/presign-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Could not get upload URL");
      }
      const { signedUrl, storagePath } = await presignRes.json();

      // 2. Upload directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed — please try again.");

      // 3. Create preview session + get signed read URL
      const sessionRes = await fetch("/api/preview-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath }),
      });
      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Could not save preview session");
      }
      const { artworkUrl: url } = await sessionRes.json();

      setArtworkUrl(url);
      setArtworkFile({
        storagePath,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-12">
      {/* Page header */}
      <div className="text-center mb-10">
        <span
          className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full mb-4"
          style={{ color: "var(--violet)", background: "white" }}
        >
          Quick Preview
        </span>
        <h1
          className="font-extrabold tracking-[-0.03em] leading-[1.12]"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "var(--font-head)", color: "var(--ink)" }}
        >
          See Your Artwork on<br />Every Product — Instantly
        </h1>
        <p className="mt-4 text-base leading-[1.75] mx-auto max-w-md" style={{ color: "var(--ink-soft)" }}>
          Upload your logo or design once. Choose a bundle and we&apos;ll handle the rest.
        </p>
      </div>

      {/* Upload area */}
      <div
        className="relative rounded-2xl transition-all mb-10 cursor-pointer"
        style={{
          border: dragOver ? "2px dashed var(--violet)" : "2px dashed rgba(98,70,234,0.3)",
          background: dragOver ? "rgba(98,70,234,0.04)" : "white",
          padding: "2.5rem 2rem",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Upload your artwork"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
            <p className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>Uploading…</p>
          </div>
        ) : artworkUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artworkUrl}
              alt="Uploaded artwork"
              className="rounded-xl object-contain"
              style={{ width: 80, height: 80, border: "1px solid var(--border)", background: "var(--surface)" }}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{artworkFile?.filename}</p>
              </div>
              <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                {artworkFile ? Math.round(artworkFile.sizeBytes / 1024) + " KB" : ""} · Click or drop to replace
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
              style={{ background: "rgba(98,70,234,0.08)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--violet)" }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                Drop your artwork here, or <span style={{ color: "var(--violet)" }}>click to upload</span>
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
                PNG, JPEG, or PDF · Max 50 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-sm px-4 py-3 rounded-xl mb-6" style={{ color: "#b91c1c", background: "#fef2f2" }}>
          {uploadError}
        </p>
      )}

      {/* Bundle cards */}
      {bundles.length === 0 ? (
        <p className="text-center text-sm" style={{ color: "var(--ink-soft)" }}>
          Bundles are being set up — check back soon.
        </p>
      ) : (
        <>
          {artworkUrl && (
            <p className="text-center text-sm mb-6 font-medium" style={{ color: "var(--ink-soft)" }}>
              Your artwork is previewed on each product below — click a bundle to see details.
            </p>
          )}
          {!artworkUrl && (
            <p className="text-center text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
              Upload your artwork above to preview it on any bundle.
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1">
            {bundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                artworkUrl={artworkUrl}
                artworkFile={artworkFile}
                isExpanded={expandedBundleId === bundle.id}
                onToggle={() =>
                  setExpandedBundleId((prev) =>
                    prev === bundle.id ? null : bundle.id
                  )
                }
              />
            ))}
          </div>
        </>
      )}

      {/* Individual products fallback */}
      <div className="mt-12 text-center">
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          Want to configure products individually?{" "}
          <Link href="/products" className="font-semibold hover:underline" style={{ color: "var(--violet)" }}>
            Browse all products
          </Link>
        </p>
      </div>
    </div>
  );
}
