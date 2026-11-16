import "server-only";
import { cache } from "react";
import { requireRole, STUDENT } from "@/lib/auth";

/**
 * Loads the logged-in student's own record.
 * Row Level Security guarantees a student can only ever read their own data,
 * even if someone tampers with the query.
 */
export const getMyStudent = cache(async () => {
  const { supabase, profile } = await requireRole(STUDENT);

  const { data: student } = await supabase
    .from("students")
    .select("*, course:courses(id, course_name, duration_years, description)")
    .eq("user_id", profile.id)
    .maybeSingle();

  return { supabase, profile, student };
});
