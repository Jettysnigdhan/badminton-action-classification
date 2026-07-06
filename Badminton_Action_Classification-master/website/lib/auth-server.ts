import "server-only";
import { cookies } from "next/headers";
import { scryptSync, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getDb, newId } from "./db";
import { redis } from "./redis";

export const SESSION_COOKIE = "sc_session";
export const AUTHED_COOKIE = "sc_authed"; // readable UI hint (not sensitive)
export const PENDING_COOKIE = "sc_pending"; // user awaiting email verification
export const TWOFA_COOKIE = "sc_2fa"; // user mid-login awaiting 2FA code
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days (seconds)
const CODE_TTL = 15 * 60 * 1000; // 15 minutes (ms)



export type User = {
  id: string;
  email: string;
  name: string;
  email_verified: number;
  training_consent: number;
  twofa_enabled: number;
  created_at: number;
};

// ── Passwords (scrypt, no native deps) ──────────────────────────────────────
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const got = scryptSync(pw, salt, 64);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

// ── Users ───────────────────────────────────────────────────────────────────
export function findUserByEmail(email: string) {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as (User & { password_hash: string }) | undefined;
}

export function createUser(email: string, name: string, password: string): User {
  const id = newId("usr");
  const now = Date.now();
  getDb()
    .prepare(
      "INSERT INTO users (id, email, name, password_hash, email_verified, training_consent, created_at) VALUES (?,?,?,?,0,0,?)",
    )
    .run(id, email.toLowerCase(), name, hashPassword(password), now);
  return {
    id,
    email: email.toLowerCase(),
    name,
    email_verified: 0,
    training_consent: 0,
    twofa_enabled: 0,
    created_at: now,
  };
}

export function setEmailVerified(userId: string) {
  getDb().prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(userId);
}

export function setConsent(userId: string, consent: boolean) {
  getDb().prepare("UPDATE users SET training_consent = ? WHERE id = ?").run(consent ? 1 : 0, userId);
}

export function setTwoFactor(userId: string, enabled: boolean) {
  getDb().prepare("UPDATE users SET twofa_enabled = ? WHERE id = ?").run(enabled ? 1 : 0, userId);
}



// ── Sessions ─────────────────────────────────────────────────────────────────
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  getDb()
    .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,?,?)")
    .run(token, userId, now, now + SESSION_TTL * 1000);

  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL,
  });
  jar.set(AUTHED_COOKIE, "1", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: SESSION_TTL });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.delete(SESSION_COOKIE);
  jar.delete(AUTHED_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.email_verified, u.training_consent, u.twofa_enabled, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, Date.now()) as User | undefined;
  return row ?? null;
}

// Pending-verification marker (between signup and verify).
export async function setPending(userId: string) {
  const jar = await cookies();
  jar.set(PENDING_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 30,
  });
}

export async function getPending(): Promise<string | null> {
  return (await cookies()).get(PENDING_COOKIE)?.value ?? null;
}

export async function clearPending() {
  (await cookies()).delete(PENDING_COOKIE);
}

// 2FA marker: set after a correct password when the user has 2FA enabled, held
// until the emailed login code is confirmed (no session is issued before then).
export async function setTwofaPending(userId: string) {
  const jar = await cookies();
  jar.set(TWOFA_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function getTwofaPending(): Promise<string | null> {
  return (await cookies()).get(TWOFA_COOKIE)?.value ?? null;
}

export async function clearTwofaPending() {
  (await cookies()).delete(TWOFA_COOKIE);
}

// ── Account Lockout ────────────────────────────────────────────────────────
export async function checkLockout(email: string): Promise<boolean> {
  try {
    const attempts = await redis.get<number>(`lockout:${email.toLowerCase()}`);
    return attempts !== null && attempts >= 5;
  } catch (error) {
    console.error("[SECURITY] Redis checkLockout error:", error);
    return false;
  }
}

export async function recordFailedLogin(email: string) {
  const lowerEmail = email.toLowerCase();
  const key = `lockout:${lowerEmail}`;
  try {
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(key, 3600); // 1 hour initial tracking window
    } else if (attempts >= 5) {
      await redis.expire(key, 900); // 15 minutes lockout
      console.warn(`[SECURITY] Account locked due to repeated failed logins: ${lowerEmail}`);
    }
  } catch (error) {
    console.error("[SECURITY] Redis recordFailedLogin error:", error);
  }
}

export async function clearFailedLogin(email: string) {
  try {
    await redis.del(`lockout:${email.toLowerCase()}`);
  } catch (error) {
    console.error("[SECURITY] Redis clearFailedLogin error:", error);
  }
}
