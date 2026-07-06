import { SettingsClient } from "@/components/app/SettingsClient";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Settings</h2>
        <p className="mt-1 text-sm text-muted">Manage your profile, preferences, and workspace.</p>
      </div>
      <SettingsClient />
    </div>
  );
}
