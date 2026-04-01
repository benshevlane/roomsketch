import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAdmin } from "./_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const result = isAdmin(req);
  if (result.authenticated) {
    return res.json({ authenticated: true, email: result.email });
  }
  return res.json({ authenticated: false });
}
