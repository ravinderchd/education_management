"use server";

import { revalidatePath } from "next/cache";
import { requireRole, ADMIN } from "@/lib/auth";
import { friendlyDbError } from "@/lib/academics";
import { text, int, firstError, fail, success } from "@/lib/validation";

export async function saveCourse(formData) {
  const { supabase } = await requireRole(ADMIN);

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const course_name = text(formData, "course_name");
  const duration_years = int(formData, "duration_years");
  const description = text(formData, "description");

  const error = firstError([
    [course_name.length >= 2, "Please enter the course name."],
    [duration_years >= 1 && duration_years <= 6, "Duration must be between 1 and 6 years."],
  ]);
  if (error) return fail(error);

  const row = { course_name, duration_years, description };
  const { error: dbError } = id
    ? await supabase.from("courses").update(row).eq("id", id)
    : await supabase.from("courses").insert(row);
  if (dbError) return fail(friendlyDbError(dbError));

  revalidatePath("/admin", "layout");
  return success(id ? "Course updated." : "Course added.");
}

/** Deleting a course also deletes its subjects. Blocked while students are enrolled. */
export async function deleteCourse(id) {
  const { supabase } = await requireRole(ADMIN);

  const { count } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("course_id", id);
  if (count > 0) return fail(`This course has ${count} enrolled student(s). Move or delete them first.`);

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return fail(friendlyDbError(error));

  revalidatePath("/admin", "layout");
  return success("Course deleted.");
}
