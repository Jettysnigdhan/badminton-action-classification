"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/auth";

type Mode = "login" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (isSignup && name.trim().length < 2) e.name = "Please enter your name.";
    if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address.";
    if (password.length < 8) e.password = "At least 8 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setPending(true);

    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error ?? "Sign up failed.");
          setPending(false);
          return;
        }
        try {
          sessionStorage.setItem("sc_pending_email", email);
          if (data.devLink) sessionStorage.setItem("sc_dev_link", data.devLink);
        } catch {}
        router.push(ROUTES.verify);
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.status === 403 && data.error === "verify") {
          if (data.devLink) {
            try {
              sessionStorage.setItem("sc_dev_link", data.devLink);
            } catch {}
          }
          router.push(ROUTES.verify);
          return;
        }
        if (res.ok && data.twofa) {
          // Email 2FA: stash hints and go to the code step (no session yet).
          try {
            sessionStorage.setItem("sc_2fa_email", data.email ?? email);
            if (data.devLink) sessionStorage.setItem("sc_dev_link", data.devLink);
          } catch {}
          router.push("/auth/two-factor");
          return;
        }
        if (!res.ok) {
          setFormError(data.error ?? "Sign in failed.");
          setPending(false);
          return;
        }
        router.push(ROUTES.app);
      }
    } catch {
      setFormError("Network error. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup
          ? "Start classifying badminton actions in minutes."
          : "Sign in to your classification workspace."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
        {isSignup && (
          <Field
            label="Full name"
            id="name"
            value={name}
            onChange={setName}
            error={errors.name}
            autoComplete="name"
            placeholder="Jordan Lee"
          />
        )}
        <Field
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
          placeholder="you@lab.org"
        />
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            {!isSignup && (
              <button type="button" className="text-xs text-muted hover:text-ink">
                Forgot?
              </button>
            )}
          </div>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              className="w-full rounded-xl border bg-surface px-3.5 py-2.5 pr-10 text-sm text-ink outline-none transition-colors focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-ink"
            >
              {show ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.2 3.2M6.1 6.1A18 18 0 0 0 2 12s3 8 10 8a10.9 10.9 0 0 0 5.9-1.7" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
        </div>

        {formError && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500" role="alert">
            {formError}
          </p>
        )}


        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.98 }}
          className="relative flex h-11 w-full items-center justify-center rounded-xl bg-ink text-sm font-semibold text-canvas transition-opacity disabled:opacity-70"
        >
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" />
          ) : isSignup ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </motion.button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line/10" /> or <span className="h-px flex-1 bg-line/10" />
      </div>

      <button
        type="button"
        onClick={async () => {
          setPending(true);
          try {
            await fetch("/api/auth/demo", { method: "POST" });
            router.push(ROUTES.app);
          } catch {
            setFormError("Could not start demo workspace.");
            setPending(false);
          }
        }}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border bg-surface text-sm font-medium text-ink transition-colors hover:bg-elevated"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Continue with demo workspace
      </button>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New to SkeletonCourt? "}
        <Link
          href={isSignup ? ROUTES.login : ROUTES.signup}
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="mt-1.5 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent"
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
