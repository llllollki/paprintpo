import Link from "next/link";
import Image from "next/image";

// MVP product categories — only categories with seeded products are surfaced here.
// Flyers, Banners, Brochures, Posters removed from nav per 2026-04-28 pivot.
// Routes (e.g. /products/flyers) remain functional via direct URL.
// Add new categories (labels, QR cards, etc.) once their products exist in the DB.
const CATEGORIES = [
  { slug: "business-cards", label: "Business Cards", emoji: "💼", color: "from-[#e8f4ff] to-[#c9e2ff]" },
  { slug: "stickers",       label: "Stickers",       emoji: "🏷️", color: "from-[#e0fff7] to-[#a0f0d8]" },
];

const BUNDLES = [
  {
    slug: "launch-kit",
    name: "Launch Kit",
    tagline: "New business essentials",
    description: "Business cards, logo stickers, QR/contact cards, and thank-you cards — everything you need to make your brand visible from day one.",
    items: ["Business Cards (250)", "Die-Cut Stickers (100)", "QR / Contact Cards (250)", "Thank-You Cards (250)"],
    price: "$169",
    color: "from-[#e8f4ff] to-[#d4c9f8]",
    accent: "var(--violet)",
  },
  {
    slug: "ecommerce-starter-kit",
    name: "Ecommerce Starter Kit",
    tagline: "For Shopify & Etsy sellers",
    description: "Roll labels, mailer stickers, thank-you inserts, and return cards — coordinated branded packaging that turns orders into repeat customers.",
    items: ["Roll Labels (100)", "Mailer Stickers (100)", "Thank-You Inserts (250)", "Return / QR Cards (250)"],
    price: "$149",
    color: "from-[#e0fff7] to-[#a0f0d8]",
    accent: "#0d7a5c",
  },
  {
    slug: "local-service-kit",
    name: "Local Service Kit",
    tagline: "For local businesses",
    description: "Business cards, appointment cards, and loyalty cards — keep customers coming back and leave every visit memorable.",
    items: ["Business Cards (250)", "Appointment Cards (250)", "Loyalty Cards (250)"],
    price: "$129",
    color: "from-[#fff3e0] to-[#ffd599]",
    accent: "#c97d10",
  },
  {
    slug: "market-booth-kit",
    name: "Market Booth Kit",
    tagline: "For makers & market vendors",
    description: "Price and menu cards, logo stickers, and loyalty cards — everything you need to run a professional market booth.",
    items: ["Price / Menu Cards (250)", "Logo Stickers (100)", "Loyalty Cards (250)"],
    price: "$149",
    color: "from-[#f3e8ff] to-[#d8b4fe]",
    accent: "#6d28d9",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          minHeight: "88vh",
          background: "linear-gradient(135deg, #1a0f5e 0%, #4a1fa8 42%, #7c3aed 72%, #a855f7 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute" style={{ width: 480, height: 480, background: "rgba(168,85,247,0.28)", top: -80, right: "18%", borderRadius: "50%", filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute" style={{ width: 300, height: 300, background: "rgba(0,201,167,0.14)", bottom: -40, right: "4%", borderRadius: "50%", filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute" style={{ width: 220, height: 220, background: "rgba(245,166,35,0.15)", top: "35%", left: "4%", borderRadius: "50%", filter: "blur(80px)" }} />

        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          {/* Content */}
          <div className="text-white">
            <p
              className="inline-flex items-center gap-2 mb-5 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--amber-lt, #ffd07b)" }}
            >
              <span className="inline-block w-6 h-0.5 rounded" style={{ background: "var(--amber-lt, #ffd07b)" }} />
              Branded Print Kits for Small Business
            </p>

            <h1
              className="font-extrabold leading-[1.08] tracking-[-0.03em] mb-5"
              style={{ fontSize: "clamp(2.4rem, 4.8vw, 3.6rem)", fontFamily: "var(--font-head)" }}
            >
              Print That <em className="not-italic" style={{ color: "var(--amber-lt, #ffd07b)" }}>Makes an</em>{" "}
              Impression
            </h1>

            <p className="text-base mb-9 leading-[1.78]" style={{ color: "rgba(255,255,255,0.76)", maxWidth: 440 }}>
              Business cards, stickers, labels, and more — your brand on everything,
              delivered fast. Upload your artwork once and preview your whole kit instantly.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/quick-preview"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: "var(--violet)", boxShadow: "0 4px 18px rgba(98,70,234,0.4)" }}
              >
                Preview Your Artwork
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1.5px solid rgba(255,255,255,0.32)", backdropFilter: "blur(4px)" }}
              >
                Shop All Products
              </Link>
            </div>

            <div
              className="flex flex-wrap items-center gap-5 mt-11 pt-7"
              style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
            >
              {["Fast turnaround", "Free proofing", "Quality guarantee"].map((t) => (
                <span key={t} className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.68)" }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--teal, #00c9a7)" }} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* CSS-only print mockup */}
          <div className="hidden md:block relative" style={{ height: 440 }}>
            {/* Business card */}
            <div className="absolute rounded-2xl shadow-2xl overflow-hidden flex flex-col p-4 gap-2" style={{ width: 195, height: 115, background: "linear-gradient(135deg, #fff 0%, #e8e4f8 100%)", top: 55, left: 0, transform: "rotate(-6deg)" }}>
              <div className="rounded-full" style={{ width: 26, height: 26, background: "var(--violet)" }} />
              <div className="rounded" style={{ height: 7, background: "var(--violet)", width: "58%" }} />
              <div className="rounded" style={{ height: 7, background: "var(--violet-lt, #a68cf8)", width: "38%" }} />
            </div>
            {/* Flyer */}
            <div className="absolute rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-end p-4 gap-1.5" style={{ width: 155, height: 215, background: "linear-gradient(160deg, #f5a623 0%, #ff6b6b 100%)", top: 18, left: 126, transform: "rotate(3deg)" }}>
              <div className="w-full rounded" style={{ height: 5, background: "rgba(255,255,255,0.6)" }} />
              <div className="rounded" style={{ height: 5, background: "rgba(255,255,255,0.38)", width: "68%" }} />
            </div>
            {/* Sticker */}
            <div className="absolute flex items-center justify-center" style={{ width: 122, height: 122, background: "linear-gradient(135deg, #00c9a7 0%, #00a8e8 100%)", borderRadius: "50%", bottom: 80, left: 16 }}>
              <div className="flex items-center justify-center text-center text-[10px] font-bold uppercase tracking-[0.1em] text-white/90" style={{ width: 86, height: 86, borderRadius: "50%", border: "3px dashed rgba(255,255,255,0.48)", lineHeight: 1.4 }}>
                Custom<br/>Stickers
              </div>
            </div>
            {/* Banner */}
            <div className="absolute rounded-2xl shadow-2xl flex flex-col p-4 gap-2" style={{ width: 240, height: 132, background: "linear-gradient(135deg, #1a0f5e 0%, #6246ea 100%)", bottom: 36, right: 0, transform: "rotate(2deg)" }}>
              <div className="rounded" style={{ height: 9, background: "rgba(255,255,255,0.8)", width: "68%" }} />
              <div className="rounded" style={{ height: 6, background: "rgba(255,255,255,0.38)", width: "88%" }} />
            </div>
            {/* Badge */}
            <div className="absolute flex items-center justify-center text-center text-[9px] font-black uppercase tracking-[0.06em]" style={{ width: 76, height: 76, background: "var(--amber)", borderRadius: "50%", top: 0, right: 56, color: "var(--ink)", lineHeight: 1.35, boxShadow: "0 4px 14px rgba(245,166,35,0.42)" }}>
              Fast<br/>Delivery
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK PREVIEW CTA ────────────────────────── */}
      <section className="py-16" style={{ background: "white" }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <div
            className="rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12"
            style={{ background: "linear-gradient(135deg, #f0edf8 0%, #e8f4ff 100%)", border: "1px solid rgba(98,70,234,0.1)" }}
          >
            <div className="flex-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full mb-4" style={{ color: "var(--violet)", background: "white" }}>
                New — Quick Preview
              </span>
              <h2
                className="font-extrabold tracking-[-0.025em] leading-[1.15] mb-3"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontFamily: "var(--font-head)", color: "var(--ink)" }}
              >
                See Your Logo on Everything — Before You Order
              </h2>
              <p className="text-sm leading-[1.78] mb-6" style={{ color: "var(--ink-soft)" }}>
                Upload your logo or artwork once and instantly preview it across an entire branded kit — business cards, stickers, labels, and more. No design skills needed.
              </p>
              <Link
                href="/quick-preview"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: "var(--violet)", boxShadow: "0 4px 14px rgba(98,70,234,0.3)" }}
              >
                Try Quick Preview
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="flex-shrink-0 flex gap-3">
              {["💼", "🏷️", "📦"].map((emoji, i) => (
                <div
                  key={i}
                  className="w-16 h-20 rounded-xl flex items-center justify-center text-2xl shadow-md"
                  style={{ background: "white", transform: i === 1 ? "translateY(-8px)" : "none" }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BUNDLES ──────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--off-white)" }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full mb-4" style={{ color: "var(--violet)", background: "white" }}>
              Print Bundles
            </span>
            <h2
              className="font-extrabold tracking-[-0.025em] leading-[1.15]"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontFamily: "var(--font-head)" }}
            >
              Everything You Need in One Kit
            </h2>
            <p className="mt-3.5 text-base leading-[1.78] mx-auto max-w-lg" style={{ color: "var(--ink-soft)" }}>
              Curated bundles for small businesses — coordinated materials at a bundle price, with your artwork applied to every piece.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BUNDLES.map((bundle) => (
              <div
                key={bundle.slug}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: "var(--shadow-sm)", border: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className={`h-36 flex items-center justify-center bg-gradient-to-br ${bundle.color} px-6`}>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-center" style={{ color: bundle.accent, opacity: 0.7 }}>
                    {bundle.tagline}
                  </p>
                </div>
                <div className="px-5 py-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--violet)" }}>
                    Bundle
                  </p>
                  <h3 className="text-[17px] font-bold tracking-[-0.02em] mb-2" style={{ fontFamily: "var(--font-head)" }}>
                    {bundle.name}
                  </h3>
                  <p className="text-[13px] leading-[1.65] mb-3" style={{ color: "var(--ink-soft)" }}>
                    {bundle.description}
                  </p>
                  <ul className="text-xs space-y-0.5 mb-4" style={{ color: "var(--ink-soft)" }}>
                    {bundle.items.map((item) => (
                      <li key={item} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: bundle.accent, opacity: 0.5 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>{bundle.price}</span>
                    <Link
                      href="/quick-preview"
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold transition-colors hover:gap-2.5"
                      style={{ color: "var(--violet)" }}
                    >
                      Preview kit
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/quick-preview"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ color: "var(--violet)", border: "2px solid var(--violet)" }}
            >
              Upload Artwork &amp; Choose a Bundle
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────── */}
      <section className="py-24" style={{ background: "white" }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-12">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full mb-4"
              style={{ color: "var(--violet)", background: "var(--surface)" }}
            >
              Our Products
            </span>
            <h2
              className="font-extrabold tracking-[-0.025em] leading-[1.15]"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontFamily: "var(--font-head)" }}
            >
              Shop by Category
            </h2>
            <p className="mt-3.5 text-base leading-[1.78] mx-auto max-w-lg" style={{ color: "var(--ink-soft)" }}>
              Business cards, stickers, labels, and more — configure your order in minutes, or start with a ready-made kit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products/${cat.slug}`}
                className="group bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-sm)", border: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className={`h-40 flex items-center justify-center bg-gradient-to-br ${cat.color}`}>
                  <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center text-4xl" style={{ boxShadow: "var(--shadow-md)" }}>
                    {cat.emoji}
                  </div>
                </div>
                <div className="px-5 py-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--violet)" }}>
                    Custom Printing
                  </p>
                  <h3 className="text-[17px] font-bold tracking-[-0.02em] mb-2" style={{ fontFamily: "var(--font-head)" }}>
                    {cat.label}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold transition-colors group-hover:gap-2.5" style={{ color: "var(--violet)" }}>
                    Shop now
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ color: "var(--violet)", border: "2px solid var(--violet)" }}
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────── */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f5a623 0%, #ff6b6b 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 22px)" }}
        />
        <div className="relative max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2.5" style={{ color: "rgba(15,14,23,0.5)" }}>
              Ready to print?
            </p>
            <h2 className="font-extrabold tracking-[-0.03em] leading-[1.18]" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontFamily: "var(--font-head)", color: "var(--ink)" }}>
              Get Your Order Started Today
            </h2>
            <p className="mt-2.5 text-[15px] leading-[1.68]" style={{ color: "rgba(15,14,23,0.6)" }}>
              Upload your artwork, pick a kit, and we&apos;ll handle the rest.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: "var(--ink)", color: "white" }}
            >
              Start Ordering
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5 bg-white"
              style={{ color: "var(--ink)" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ background: "var(--ink)", color: "rgba(255,255,255,0.55)" }}>
        <div className="max-w-[1100px] mx-auto px-6 pt-11 pb-8">
          <div className="flex flex-wrap justify-between gap-10 pb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ maxWidth: 280 }}>
              <div className="inline-flex items-center rounded-xl px-3 py-1.5 mb-3.5" style={{ background: "white", maxWidth: 200 }}>
                <Image src="/logo.png" alt="Paprintpo" width={150} height={30} className="h-[30px] w-auto object-contain" />
              </div>
              <p className="text-[13px] leading-[1.75]">
                Branded print kits for small businesses — coordinated materials, fast delivery, easy reorders.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white mb-3.5">Products</p>
              <ul className="flex flex-col gap-2.5">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/products/${c.slug}`} className="text-[14px] hover:text-white transition-colors">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white mb-3.5">Account</p>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/auth/login" className="text-[14px] hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/products" className="text-[14px] hover:text-white transition-colors">Browse Products</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-wrap items-center justify-between gap-2.5">
            <p className="text-[13px]">© {new Date().getFullYear()} Paprintpo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
