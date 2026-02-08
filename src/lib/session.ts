import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "family_wealth_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  gate: true;
  memberId: number | null;
  exp: number;
};

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function encodeSession(payload: SessionPayload): string {
  const payloadStr = JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + MAX_AGE });
  const encoded = Buffer.from(payloadStr, "utf-8").toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function decodeSession(value: string): SessionPayload | null {
  const dot = value.indexOf(".");
  if (dot === -1) return null;
  const encoded = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expectedSig = sign(encoded);
  try {
    if (expectedSig.length !== sig.length || !timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const raw = Buffer.from(encoded, "base64url").toString("utf-8");
    const data = JSON.parse(raw) as SessionPayload & { exp: number };
    if (data.gate !== true || typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { gate: true, memberId: data.memberId ?? null, exp: data.exp };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const cookie = c.get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  return decodeSession(cookie);
}

export async function setSession(payload: SessionPayload): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
