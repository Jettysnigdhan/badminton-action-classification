"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", org: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your name.";
    if (!EMAIL_RE.test(form.email)) e.email = "Enter a valid email.";
    if (form.message.trim().length < 10) e.message = "Tell us a little more (10+ characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setPending(true);
    await new Promise((r) => setTimeout(r, 800));
    setPending(false);
    setDone(true);
  }

  return (
    <div className="rounded-3xl border bg-surface p-6 shadow-card md:p-8">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/10 text-success">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-ink">Message sent</h2>
            <p className="mt-2 text-sm text-muted">Thanks, {form.name.split(" ")[0] || "there"} — we&apos;ll get back to you within two business days.</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={set("name")} error={errors.name} placeholder="Jordan Lee" />
              <Field label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="you@lab.org" />
            </div>
            <Field label="Organization" value={form.org} onChange={set("org")} placeholder="University / Club / Company (optional)" />
            <label className="block">
              <span className="text-sm font-medium text-ink">Message</span>
              <textarea
                value={form.message}
                onChange={set("message")}
                rows={5}
                placeholder="How can we help?"
                aria-invalid={!!errors.message}
                className="mt-1.5 w-full resize-none rounded-xl border bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
              {errors.message && <p className="mt-1.5 text-xs text-red-500">{errors.message}</p>}
            </label>
            <motion.button type="submit" disabled={pending} whileTap={{ scale: 0.98 }} className="flex h-11 w-full items-center justify-center rounded-xl bg-ink text-sm font-semibold text-canvas transition-opacity disabled:opacity-70 sm:w-auto sm:px-8">
              {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" /> : "Send message"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label, value, onChange, error, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="mt-1.5 w-full rounded-xl border bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent"
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </label>
  );
}
