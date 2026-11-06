import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is missing from the environment");
  }
  return secret;
}

function sign(username: string) {
  const hmac = createHmac("sha256", getSecret()).update(username).digest("hex");
  return `${username}.${hmac}`;
}

function verify(value: string) {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const username = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = createHmac("sha256", getSecret()).update(username).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return username;
}

export async function getSessionUser() {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return verify(value);
}

export async function setSessionUser(username: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(username), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
