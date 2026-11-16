import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from "./config";

/**
 * Supabase client for Server Components and Server Actions.
 * It acts AS THE LOGGED-IN USER (session read from cookies), so every query
 * is checked by the Row Level Security policies in supabase/schema.sql.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component – cookies are read-only there.
            // The proxy (src/proxy.js) refreshes the session instead.
          }
        },
      },
    }
  );
}
