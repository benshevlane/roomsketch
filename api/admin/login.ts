import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setAuthCookie } from "./_auth";
import { supabaseAdmin } from "./_supabase";
import { verifyPassword } from "./_passwords";

// In-memory rate limiting (per serverless instance)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return "unknown";
}

function checkRateLimit(ip: string): { blocked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return { blocked: false };
  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { blocked: false };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.firstAttempt + WINDOW_MS - now) / 1000);
    return { blocked: true, retryAfterSeconds };
  }
  return { blocked: false };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    entry.count++;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    res.setHeader("Retry-After", String(rateCheck.retryAfterSeconds));
    return res.status(429).json({
      error: "Too many login attempts. Please try again later.",
      retryAfterSeconds: rateCheck.retryAfterSeconds,
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const { email, password } = body ?? {};

  if (typeof email !== "string" || email.length === 0) {
    return res.status(400).json({ error: "Email required" });
  }
  if (typeof password !== "string" || password.length === 0) {
    return res.status(400).json({ error: "Password required" });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Database not configured" });
  }

  const { data: admin, error: dbError } = await supabaseAdmin
    .from("admin_users")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (dbError) {
    console.error("Admin login DB error:", dbError.message);
    return res.status(500).json({ error: "Internal error" });
  }

  if (!admin) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Clear rate limit on successful login
  loginAttempts.delete(ip);

  setAuthCookie(res, admin.email);
  return res.json({ ok: true });
}
