"use server";

import { revalidatePath } from "next/cache";
import { requireRole, ADMIN } from "@/lib/auth";
import { friendlyDbError, semestersFor } from "@/lib/academics";
import { text, int, firstError, fail, success } from "@/lib/validation";

export async function saveSubject(formData) {
  const { supabase } = await requireRole(ADMIN);

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const subject_name = text(formData, "subject_name");
  const subject_code = text(formData, "subject_code").toUpperCase();
  const course_id = int(formData, "course_id");
  const semester = int(formData, "semester");
  const max_marks = int(formData, "max_marks");

  const error = firstError([
    [subject_name.length >= 2, "Please enter the subject name."],
    [course_id > 0, "Please select a course."],
    [semester > 0, "Please select a semester."],
    [max_marks > 0 && max_marks <= 1000, "Maximum marks must be between 1 and 1000."],
  ]);
  if (error) return fail(error);

  const { data: course } = await supabase.from("courses").select("duration_years").eq("id", course_id).single();
  if (!course) return fail("Please select a valid course.");
  if (semester > semestersFor(course)) return fail(`This course only has ${semestersFor(course)} semesters.`);

  const row = { subject_name, subject_code, course_id, semester, max_marks };
  const { error: dbError } = id
    ? await supabase.from("subjects").update(row).eq("id", id)
    : await supabase.from("subjects").insert(row);
  if (dbError) {
    if (dbError.code === "23505") return fail("This subject already exists in that course and semester.");
    return fail(friendlyDbError(dbError));
  }

  revalidatePath("/admin", "layout");
  return success(id ? "Subject updated." : "Subject added.");
}

/** Deleting a subject also deletes its attendance and results. */
export async function deleteSubject(id) {
  const { supabase } = await requireRole(ADMIN);
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return fail(friendlyDbError(error));
  revalidatePath("/admin", "layout");
  return success("Subject deleted.");
}
