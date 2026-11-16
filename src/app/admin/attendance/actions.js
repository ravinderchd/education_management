"use server";

import { revalidatePath } from "next/cache";
import { requireRole, STAFF } from "@/lib/auth";
import { friendlyDbError } from "@/lib/academics";
import { fail, success } from "@/lib/validation";

/**
 * Save attendance for one subject on one date.
 * input: { subjectId, date: "YYYY-MM-DD", records: [{ studentId, status: "present" | "absent" }] }
 *
 * Uses UPSERT on (student_id, subject_id, date): saving the same class again
 * updates the existing rows instead of creating duplicates.
 */
export async function saveAttendance({ subjectId, date, records }) {
  const { supabase, profile } = await requireRole(STAFF);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return fail("Please select a valid date.");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (date > tomorrow) return fail("Attendance can't be marked for a future date.");
  if (!Array.isArray(records) || !records.length) return fail("There are no students to save.");
  if (records.some((r) => !["present", "absent"].includes(r.status))) return fail("Each student must be Present or Absent.");

  // Only students enrolled in this subject's course + semester may be marked
  const { data: subject } = await supabase.from("subjects").select("course_id, semester").eq("id", subjectId).single();
  if (!subject) return fail("Subject not found.");

  const { data: enrolled } = await supabase
    .from("students")
    .select("id")
    .eq("course_id", subject.course_id)
    .eq("semester", subject.semester);
  const allowed = new Set((enrolled || []).map((s) => s.id));
  if (records.some((r) => !allowed.has(r.studentId))) return fail("Some students are not enrolled in this subject.");

  const rows = records.map((r) => ({
    student_id: r.studentId,
    subject_id: subjectId,
    date,
    status: r.status,
    marked_by: profile.id,
  }));

  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,subject_id,date" });
  if (error) return fail(friendlyDbError(error));

  revalidatePath("/admin", "layout");
  const present = records.filter((r) => r.status === "present").length;
  return success(`Attendance saved: ${present} present, ${records.length - present} absent.`);
}
