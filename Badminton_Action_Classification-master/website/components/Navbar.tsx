"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SITE } from "@/lib/data";
import { ROUTES } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { TryNowButton } from "./cta/TryNowButton";
import { BrandMark } from "./BrandMark";

// Marketing nav. In-page anchors keep the single-page showcase intact;
// Pricing and Contact are dedicated public routes.
const NAV = [
  { label: "Research", href: "/#paper" },
  { label: "Technology", href: "/#architecture" },
  { label: "Demo", href: "/#demo" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto mt-3 flex max-w-content items-center justify-between gap-4 rounded-full px-4 py-2.5 transition-all duration-300 sm:mx-4 md:mx-auto md:px-5 ${
          scrolled ? "glass border shadow-card" : "border border-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <BrandMark className="h-8 w-8" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            {SITE.name}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={ROUTES.login}
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-ink md:inline-flex"
          >
            Sign in
          </Link>
          <div className="hidden sm:block">
            <TryNowButton size="sm" pulse={false} />
          </div>

          {/* Mobile menu trigger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full border text-ink lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mt-2 rounded-3xl border bg-surface p-4 shadow-card-hover lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-elevated"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t pt-3">
              <Link
                href={ROUTES.login}
                onClick={() => setOpen(false)}
                className="rounded-full border px-4 py-2.5 text-center text-sm font-medium text-ink"
              >
                Sign in
              </Link>
              <div className="flex justify-center" onClick={() => setOpen(false)}>
                <TryNowButton size="md" className="w-full" magnetic={false} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
