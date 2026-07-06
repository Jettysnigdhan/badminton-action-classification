"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "@/lib/auth";

const NAV = [
  { label: "Dashboard", href: "/app/dashboard", icon: "grid" },
  { label: "Videos", href: "/app/videos", icon: "film" },
  { label: "Classifications", href: "/app/classifications", icon: "target" },
  { label: "Reports", href: "/app/reports", icon: "doc" },
  { label: "Team", href: "/app/team", icon: "users" },
  { label: "Settings", href: "/app/settings", icon: "gear" },
];

function NavIcon({ name }: { name: string }) {
  const c = {
    width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "grid": return <svg {...c}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "film": return <svg {...c}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>;
    case "target": return <svg {...c}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>;
    case "doc": return <svg {...c}><path d="M5 3h9l5 5v13a0 0 0 0 1 0 0H5z"/><path d="M14 3v5h5M8 13h8M8 17h6"/></svg>;
    case "users": return <svg {...c}><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/></svg>;
    default: return <svg {...c}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6 9.4l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 4.6V4.5a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 19.4 7a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 11.4"/></svg>;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setEmail(d.user?.email ?? null))
      .catch(() => {});
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const active = NAV.find((n) => pathname.startsWith(n.href));

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-overlay/60"
      >
        <BrandMark className="h-8 w-8" />
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
          SkeletonCourt
        </span>
      </Link>

      <p className="mt-7 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
        Workspace
      </p>
      <nav className="mt-2 flex-1 space-y-0.5">
        {NAV.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive ? "text-ink" : "text-muted hover:bg-overlay/60 hover:text-ink"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="app-nav-active"
                  className="absolute inset-0 rounded-xl border border-line/10 bg-elevated shadow-[inset_0_1px_0_0_rgb(var(--edge)/var(--edge-alpha))]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                >
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_-1px_rgb(var(--accent)/0.7)]" />
                </motion.span>
              )}
              <span
                className={`relative z-10 flex items-center gap-3 ${
                  isActive
                    ? "[&_svg]:text-accent"
                    : "[&_svg]:text-faint group-hover:[&_svg]:text-muted"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="panel overflow-hidden rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <p className="text-xs font-semibold text-ink">Free during research preview</p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          Unlimited classifications — no card required.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100svh] bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line/[0.08] bg-surface p-4 lg:flex">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-midnight/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="panel-raised fixed inset-y-0 left-0 z-50 flex w-64 flex-col rounded-none border-y-0 border-l-0 p-4 lg:hidden"
            >
              {SidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="glass-canvas sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/[0.08] px-4 md:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line/10 text-muted transition-colors hover:bg-overlay/60 hover:text-ink lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>

          <h1 className="font-display text-[17px] font-semibold tracking-tight text-ink">
            {active?.label ?? "Dashboard"}
          </h1>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/app/videos"
              className="group hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas shadow-[0_8px_24px_-12px_rgb(var(--shadow-color)/0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgb(var(--shadow-color)/0.8)] active:translate-y-0 sm:inline-flex"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              New analysis
            </Link>
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-label="Account menu"
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo to-cyan text-sm font-semibold text-white shadow-[0_0_0_1px_rgb(var(--line)/0.12),0_6px_16px_-6px_rgb(0_212_255/0.5)] ring-2 ring-transparent transition-all duration-200 hover:ring-accent/30"
              >
                {(email ?? "U").slice(0, 1).toUpperCase()}
              </button>
              <AnimatePresence>
                {menu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="panel-raised absolute right-0 z-20 mt-2.5 w-60 rounded-2xl p-1.5"
                    >
                      <div className="px-2.5 py-2">
                        <p className="truncate text-sm font-semibold text-ink">{email ?? "Member"}</p>
                        <p className="text-xs text-faint">Free preview</p>
                      </div>
                      <div className="my-1 h-px bg-line/10" />
                      <Link href="/app/settings" onClick={() => setMenu(false)} className="block rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-overlay/70 hover:text-ink">
                        Settings
                      </Link>
                      <Link href="/" onClick={() => setMenu(false)} className="block rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-overlay/70 hover:text-ink">
                        Back to website
                      </Link>
                      <div className="my-1 h-px bg-line/10" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="block w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-error/10"
                      >
                        Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-8 md:py-9">{children}</main>
      </div>
    </div>
  );
}
