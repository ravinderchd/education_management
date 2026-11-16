import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Supabase client with the SERVICE ROLE key. It bypasses Row Level Security,
 * so it is used ONLY on the server and ONLY for creating / updating / deleting
 * login accounts (Supabase Auth users) – after we have checked the caller is an admin.
 * The key never reaches the browser ("server-only" import makes that a build error).
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.local – it is needed to create login accounts.");
  }
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
