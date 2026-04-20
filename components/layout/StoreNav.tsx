"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function StoreNav() {
  const { itemCount } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-40 h-[68px] flex items-center px-6 bg-white"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between gap-5">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 h-10 overflow-hidden" aria-label="Paprintpo — Home">
            <Image
              src="/logo.png"
              alt="Paprintpo"
              width={180}
              height={40}
              className="h-10 w-auto object-contain object-left"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/quick-preview"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--ink-soft)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--violet)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-soft)")}
            >
              Quick Preview
            </Link>
            <Link
              href="/products"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--ink-soft)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--violet)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-soft)")}
            >
              Products
            </Link>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ color: "var(--violet)", background: "var(--surface)" }}
              aria-label={`Cart, ${itemCount} line item${itemCount !== 1 ? "s" : ""}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Cart
              {itemCount > 0 && (
                <span
                  className="text-xs font-bold rounded-full px-1.5 py-0.5 leading-none"
                  style={{ background: "var(--violet)", color: "white" }}
                >
                  {itemCount}
                </span>
              )}
            </button>

            <Link
              href="/auth/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ background: "var(--violet)", color: "white" }}
            >
              Sign In
            </Link>
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative p-2"
              style={{ color: "var(--violet)" }}
              aria-label="Open cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {itemCount > 0 && (
                <span
                  className="absolute top-0 right-0 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  style={{ background: "var(--violet)", color: "white" }}
                >
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex flex-col gap-[5px] p-2"
              aria-label="Toggle menu"
            >
              <span className="block w-[22px] h-[2px] rounded-sm" style={{ background: "var(--ink)" }} />
              <span className="block w-[22px] h-[2px] rounded-sm" style={{ background: "var(--ink)" }} />
              <span className="block w-[22px] h-[2px] rounded-sm" style={{ background: "var(--ink)" }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="fixed top-[68px] left-0 right-0 z-30 flex flex-col gap-0.5 px-6 pt-4 pb-6 bg-white shadow-lg"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link
            href="/quick-preview"
            onClick={() => setMobileOpen(false)}
            className="py-2.5 text-base font-medium border-b"
            style={{ borderColor: "var(--border)", color: "var(--violet)" }}
          >
            Quick Preview
          </Link>
          <Link
            href="/products"
            onClick={() => setMobileOpen(false)}
            className="py-2.5 text-base font-medium border-b"
            style={{ borderColor: "var(--border)", color: "var(--ink)" }}
          >
            Products
          </Link>
          <Link
            href="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="mt-3 flex justify-center py-3 rounded-lg text-sm font-bold text-white"
            style={{ background: "var(--violet)" }}
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Spacer for fixed nav */}
      <div className="h-[68px]" />

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
