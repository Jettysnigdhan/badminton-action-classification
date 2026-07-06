// Client-side auth helpers. The real session is an httpOnly cookie the browser
// JS can't read; we mirror a non-sensitive `sc_authed` flag for UI decisions.

export const AUTHED_COOKIE = "sc_authed";

export const ROUTES = {
  login: "/auth/login",
  signup: "/auth/signup",
  verify: "/auth/verify",
  app: "/app/dashboard",
} as const;

export function isAuthenticatedClient(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith(`${AUTHED_COOKIE}=1`));
}

/** Where Try Now should send the user, based on auth state. */
export function tryNowDestination(): string {
  return isAuthenticatedClient() ? ROUTES.app : ROUTES.login;
}

export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  // Belt-and-braces: drop the readable hint immediately.
  document.cookie = `${AUTHED_COOKIE}=; path=/; max-age=0`;
}
