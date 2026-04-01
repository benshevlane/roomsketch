/**
 * Create an admin user.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <password>
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "../server/auth";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error("Error: Invalid email address.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Error: Password must be at least 8 characters.");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Check for duplicate
  const { data: existing } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existing) {
    console.error(`Error: Admin with email "${email}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const { error } = await supabase.from("admin_users").insert({
    email: email.toLowerCase(),
    password_hash: passwordHash,
  });

  if (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }

  console.log(`Admin user created: ${email.toLowerCase()}`);
}

main();
