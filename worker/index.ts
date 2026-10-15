/**
 * Cloudflare Worker in front of the static SPA.
 *
 * Its main job is the per-prototype password lock:
 *   - locks.json maps slug -> PBKDF2 hash (written by `npm run lock <slug>`)
 *   - /p/<slug> and /embed/<slug> redirect to /unlock/<slug> without a valid cookie
 *   - POST /api/unlock checks the password and sets a signed cookie
 *
 * Everything else is served from static assets (env.ASSETS).
 */
import locksJson from "../locks.json";

interface Lock {
  salt: string;
  hash: string;
  iterations: number;
}

interface Env {
  ASSETS: Fetcher;
  /** Optional extra secret mixed into cookie signatures: `wrangler secret put COOKIE_SECRET`. */
  COOKIE_SECRET?: string;
}

const locks = locksJson as Record<string, Lock>;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const enc = new TextEncoder();

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hashPassword(password: string, lock: Lock) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(lock.salt), iterations: lock.iterations },
    key,
    256,
  );
  return toHex(bits);
}

/** Cookie value = HMAC(COOKIE_SECRET + password hash, slug). Changing the password invalidates old cookies. */
async function sign(slug: string, lock: Lock, env: Env) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode((env.COOKIE_SECRET ?? "") + lock.hash),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(slug)));
}

const cookieName = (slug: string) => `unlock_${slug}`;

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

async function isUnlocked(request: Request, slug: string, env: Env) {
  const lock = locks[slug];
  if (!lock) return true;
  const cookie = readCookie(request, cookieName(slug));
  return !!cookie && timingSafeEqual(cookie, await sign(slug, lock, env));
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/api/locks") {
      return Response.json(Object.keys(locks));
    }

    if (pathname === "/api/access") {
      const slug = url.searchParams.get("slug") ?? "";
      return Response.json({ locked: slug in locks, unlocked: await isUnlocked(request, slug, env) });
    }

    if (pathname === "/api/unlock" && request.method === "POST") {
      const { slug, password } = await request.json<{ slug?: string; password?: string }>().catch(() => ({}) as never);
      const lock = slug ? locks[slug] : undefined;
      if (!slug || !lock || typeof password !== "string") {
        return Response.json({ ok: false }, { status: 400 });
      }
      if (!timingSafeEqual(await hashPassword(password, lock), lock.hash)) {
        // Small delay to slow down guessing.
        await new Promise((r) => setTimeout(r, 400));
        return Response.json({ ok: false }, { status: 401 });
      }
      const secure = url.protocol === "https:" ? "; Secure" : "";
      return Response.json(
        { ok: true },
        {
          headers: {
            "set-cookie": `${cookieName(slug)}=${await sign(slug, lock, env)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`,
          },
        },
      );
    }

    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const match = pathname.match(/^\/(?:p|embed)\/([^/]+)/);
    if (match) {
      const slug = decodeURIComponent(match[1]);
      if (!(await isUnlocked(request, slug, env))) {
        const next = encodeURIComponent(pathname + url.search);
        return Response.redirect(new URL(`/unlock/${slug}?next=${next}`, url).toString(), 302);
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
