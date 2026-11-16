"use server";

import { revalidatePath } from "next/cache";
import { requireRole, STAFF, ADMIN } from "@/lib/auth";
import { calculateGrade, friendlyDbError, marksPercentage } from "@/lib/academics";
import { fail, success } from "@/lib/validation";

/**
 * Save marks for one subject.
 * input: { subjectId, publish: boolean, entries: [{ studentId, marks: "85" }] }
 * Empty marks are skipped. The grade is calculated here on the server from the
 * grading_rules table, so it can't be faked by the browser.
 */
export async function saveResults({ subjectId, publish, entries }) {
  const { supabase, profile } = await requireRole(STAFF);

  const { data: subject } = await supabase
    .from("subjects")
    .select("course_id, semester, max_marks")
    .eq("id", subjectId)
    .single();
  if (!subject) return fail("Subject not found.");

  const filled = (entries || []).filter((e) => String(e.marks ?? "").trim() !== "");
  if (!filled.length) return fail("Enter marks for at least one student.");

  for (const e of filled) {
    const m = Number(e.marks);
    if (Number.isNaN(m)) return fail("Marks must be numbers.");
    if (m < 0) return fail("Marks can't be negative.");
    if (m > subject.max_marks) return fail(`Marks can't exceed the maximum of ${subject.max_marks}.`);
  }

  // Only students of this course + semester
  const { data: enrolled } = await supabase
    .from("students")
    .select("id")
    .eq("course_id", subject.course_id)
    .eq("semester", subject.semester);
  const allowed = new Set((enrolled || []).map((s) => s.id));
  if (filled.some((e) => !allowed.has(e.studentId))) return fail("Some students are not enrolled in this subject.");

  const { data: rules } = await supabase.from("grading_rules").select("grade, min_percentage");

  const rows = filled.map((e) => {
    const marks = Number(e.marks);
    return {
      student_id: e.studentId,
      subject_id: subjectId,
      marks,
      total_marks: subject.max_marks,
      grade: calculateGrade(marksPercentage(marks, subject.max_marks), rules || []),
      published: !!publish,
      entered_by: profile.id,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("results").upsert(rows, { onConflict: "student_id,subject_id" });
  if (error) return fail(friendlyDbError(error));

  revalidatePath("/admin", "layout");
  return success(
    publish ? `Marks saved and published for ${rows.length} student(s).` : `Marks saved as draft for ${rows.length} student(s).`
  );
}

/**
 * Replace the grading rules (admin only) and re-grade every existing result.
 * rules: [{ grade: "A+", min_percentage: 90 }, ...]
 */
export async function saveGradingRules(rules) {
  const { supabase } = await requireRole(ADMIN);

  const clean = (rules || []).map((r) => ({
    grade: String(r.grade ?? "").trim().toUpperCase(),
    min_percentage: Number(r.min_percentage),
  }));

  if (!clean.length) return fail("Add at least one grade.");
  if (clean.some((r) => !r.grade || r.grade.length > 3)) return fail("Each grade needs a short name such as A+ or B.");
  if (clean.some((r) => Number.isNaN(r.min_percentage) || r.min_percentage < 0 || r.min_percentage > 100))
    return fail("Minimum percentages must be between 0 and 100.");
  if (new Set(clean.map((r) => r.grade)).size !== clean.length) return fail("Each grade name must be unique.");
  if (new Set(clean.map((r) => r.min_percentage)).size !== clean.length) return fail("Each minimum percentage must be unique.");
  if (!clean.some((r) => r.min_percentage === 0)) return fail("One grade must start at 0% (usually F).");

  const { error: delError } = await supabase.from("grading_rules").delete().gte("id", 0);
  if (delError) return fail(friendlyDbError(delError));
  const { error: insError } = await supabase.from("grading_rules").insert(clean);
  if (insError) return fail(friendlyDbError(insError));

  // Re-grade existing results with the new rules
  const { data: results } = await supabase.from("results").select("id, marks, total_marks");
  const idsByGrade = {};
  for (const r of results || []) {
    const g = calculateGrade(marksPercentage(r.marks, r.total_marks), clean);
    (idsByGrade[g] ??= []).push(r.id);
  }
  for (const [grade, ids] of Object.entries(idsByGrade)) {
    await supabase.from("results").update({ grade }).in("id", ids);
  }

  revalidatePath("/", "layout");
  return success("Grading rules saved and all grades recalculated.");
}
