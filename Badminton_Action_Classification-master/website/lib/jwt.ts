import jwt from "jsonwebtoken";
import crypto from "crypto";

export type MagicTokenPayload = {
  sub: string;
  email: string;
  purpose: "verify" | "2fa";
  jti: string;
};

// In local dev, we fall back to a hardcoded secret. In production, this must be set.
const SECRET = process.env.AUTH_MAGIC_SECRET || (process.env.NODE_ENV === "development" ? "dev-magic-secret-key-123" : "");

if (!SECRET) {
  throw new Error("AUTH_MAGIC_SECRET is required in production");
}

export function signMagicToken({ userId, email, purpose }: { userId: string; email: string; purpose: "verify" | "2fa" }): string {
  const payload = {
    sub: userId,
    email: email.toLowerCase(),
    purpose,
    jti: crypto.randomUUID(),
  };

  return jwt.sign(payload, SECRET, {
    expiresIn: "15m",
    issuer: "skeletoncourt",
    audience: "magic-link",
    algorithm: "HS256",
  });
}

export function verifyMagicToken(token: string): MagicTokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET, {
      algorithms: ["HS256"],
      issuer: "skeletoncourt",
      audience: "magic-link",
    }) as jwt.JwtPayload;

    if (!decoded.sub || !decoded.email || !decoded.purpose || !decoded.jti) {
      return null;
    }

    if (decoded.purpose !== "verify" && decoded.purpose !== "2fa") {
      return null;
    }

    return {
      sub: decoded.sub,
      email: decoded.email,
      purpose: decoded.purpose as "verify" | "2fa",
      jti: decoded.jti,
    };
  } catch (error) {
    console.error("[AUTH] JWT Verification failed:", error);
    return null;
  }
}
