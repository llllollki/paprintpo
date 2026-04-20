import Image from "next/image";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header
        className="sticky top-0 z-40 h-14 flex items-center px-5 bg-white"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between w-full max-w-[1100px] mx-auto">
          <Link href="/" className="flex items-center rounded-lg px-2 py-1" style={{ background: "var(--surface)" }}>
            <Image src="/logo.png" alt="Paprintpo" width={120} height={28} className="h-7 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: "var(--violet)" }}
            >
              Orders
            </Link>
          </nav>
          <span
            className="text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full"
            style={{ background: "var(--surface)", color: "var(--violet)" }}
          >
            Admin
          </span>
        </div>
      </header>
      {children}
    </>
  );
}
