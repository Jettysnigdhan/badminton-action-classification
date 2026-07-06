"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      // inline-flex + items-center centres the knob; shrink-0 keeps the 44px
      // track from being squeezed by the flex row (which made the knob overflow).
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-success" : "bg-line/20"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          on ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export function SettingsClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoCalibrate, setAutoCalibrate] = useState(true);
  // Opt-in (defaults to OFF): persisted to the user record on toggle.
  const [shareData, setShareData] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setEmail(d.user.email);
          setName(d.user.name ?? "");
          setShareData(!!d.user.trainingConsent);
          setTwoFactor(!!d.user.twoFactor);
        }
      })
      .catch(() => {});
  }, []);

  function toggleConsent() {
    setShareData((prev) => {
      const next = !prev;
      fetch("/api/settings/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent: next }),
      }).catch(() => {});
      return next;
    });
  }

  function toggleTwoFactor() {
    setTwoFactor((prev) => {
      const next = !prev;
      fetch("/api/settings/twofa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      }).catch(() => {});
      return next;
    });
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-surface p-6 shadow-card">
        <h3 className="font-display text-base font-semibold tracking-tight text-ink">Profile</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <input value={email} readOnly className="mt-1.5 w-full cursor-not-allowed rounded-xl border bg-elevated px-3.5 py-2.5 text-sm text-muted outline-none" />
          </label>
        </div>
        <button type="button" className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-canvas">Save changes</button>
      </section>

      <section className="rounded-2xl border bg-surface p-6 shadow-card">
        <h3 className="font-display text-base font-semibold tracking-tight text-ink">Preferences</h3>
        <div className="mt-4 divide-y">
          <div className="flex items-center justify-between gap-6 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Email alerts</p>
              <p className="text-xs text-muted">Notify me when a classification needs review.</p>
            </div>
            <Toggle label="Email alerts" on={emailAlerts} onClick={() => setEmailAlerts((v) => !v)} />
          </div>
          <div className="flex items-center justify-between gap-6 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Auto-calibration</p>
              <p className="text-xs text-muted">Apply temperature scaling to every prediction.</p>
            </div>
            <Toggle label="Auto-calibration" on={autoCalibrate} onClick={() => setAutoCalibrate((v) => !v)} />
          </div>
          <div className="flex items-center justify-between gap-6 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink">Contribute clips to model training</p>
                <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  Opt-in
                </span>
              </div>
              <p className="text-xs text-muted">
                Share your uploaded clips and extracted skeletons to help improve the
                classifier. Anonymized, never sold, and you can opt out anytime.
              </p>
            </div>
            <Toggle
              label="Contribute clips to model training"
              on={shareData}
              onClick={toggleConsent}
            />
          </div>
        </div>
        {shareData && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-xs text-success">
            <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Thank you — your contributed clips will help expand the dataset and improve
            accuracy for everyone.
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-surface p-6 shadow-card">
        <h3 className="font-display text-base font-semibold tracking-tight text-ink">Security</h3>
        <div className="mt-4">
          <div className="flex items-center justify-between gap-6 py-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink">Two-factor authentication</p>
                <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  Email
                </span>
              </div>
              <p className="text-xs text-muted">
                Require a one-time code sent to {email || "your email"} every time you sign in.
              </p>
            </div>
            <Toggle label="Two-factor authentication" on={twoFactor} onClick={toggleTwoFactor} />
          </div>
          {twoFactor && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-xs text-success">
              <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Two-factor is on. Next time you sign in, we&apos;ll email you a 6-digit code.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-surface p-6 shadow-card">
        <h3 className="font-display text-base font-semibold tracking-tight text-ink">Account</h3>
        <p className="mt-1 text-sm text-muted">Sign out of this workspace on this device.</p>
        <button onClick={handleSignOut} type="button" className="mt-4 rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10">
          Sign out
        </button>
      </section>
    </div>
  );
}
