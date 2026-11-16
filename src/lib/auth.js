import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Where each role lands after logging in. */
export function homeFor(role) {
  return role === "student" ? "/student" : "/admin";
}

/**
 * Returns { user, profile, supabase } for the logged-in user, or null.
 * `cache` makes sure we only ask Supabase once per request.
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { user, profile, supabase };
});

/**
 * Use at the top of a page, layout or Server Action.
 * Redirects to /login when not logged in, and to the user's own home page
 * when their role is not allowed here (e.g. a student opening /admin).
 */
export async function requireRole(allowedRoles) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!allowedRoles.includes(session.profile.role)) redirect(homeFor(session.profile.role));
  return session;
}

/** Roles shortcut lists */
export const STAFF = ["admin", "faculty"];
export const ADMIN = ["admin"];
export const STUDENT = ["student"];
