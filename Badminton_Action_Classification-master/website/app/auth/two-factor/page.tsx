"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function TwoFactorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("your inbox");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const e = sessionStorage.getItem("sc_2fa_email");
      if (e) setEmail(e);
      const link = sessionStorage.getItem("sc_dev_link");
      if (link) {
        setDevLink(link);
      }
    } catch {
      /* noop */
    }
  }, []);

  async function resend() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/resend", { method: "POST" });
      const data = await res.json();
      if (data.devLink) {
        setDevLink(data.devLink);
        try {
          sessionStorage.setItem("sc_dev_link", data.devLink);
        } catch {}
      }
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-elevated text-accent">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink">
        Two-factor authentication
      </h1>
      <p className="mt-2 text-sm text-muted">
        We sent a magic link to <span className="font-medium text-ink">{email}</span>. Click the link to complete sign-in.
      </p>

      {devLink && (
        <div className="mt-6 rounded-lg bg-elevated p-4 text-left border border-line">
          <p className="inline-flex items-center gap-2 text-xs text-muted mb-2">
            <span className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">dev</span>
            No email server configured
          </p>
          <a
            href={devLink}
            className="block break-all font-mono text-sm font-semibold text-accent hover:underline"
          >
            {devLink}
          </a>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <p className="mt-8 text-sm text-muted">
        You can safely close this window once you click the link.
      </p>

      <p className="mt-5 text-sm text-muted">
        Didn&apos;t get it?{" "}
        <button
          type="button"
          onClick={resend}
          disabled={pending}
          className="font-medium text-ink underline-offset-4 hover:underline disabled:opacity-50"
        >
          {pending ? "Sending..." : "Resend email"}
        </button>
      </p>
    </div>
  );
}
