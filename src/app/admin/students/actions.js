"use server";

import { revalidatePath } from "next/cache";
import { requireRole, ADMIN } from "@/lib/auth";
import { createAccount, updateAccount, deleteAccount, removeAccountQuietly } from "@/lib/accounts";
import { friendlyDbError, semestersFor } from "@/lib/academics";
import { text, int, isEmail, isPhone, firstError, fail, success } from "@/lib/validation";

/** Add a new student (id empty) or update an existing one (id set). Admin only. */
export async function saveStudent(formData) {
  const { supabase } = await requireRole(ADMIN);

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roll_number = text(formData, "roll_number").toUpperCase();
  const phone = text(formData, "phone");
  const department = text(formData, "department");
  const course_id = int(formData, "course_id");
  const semester = int(formData, "semester");

  const error = firstError([
    [name.length >= 2, "Please enter the student's full name."],
    [isEmail(email), "Please enter a valid email address."],
    [roll_number.length > 0, "Please enter a roll number / student ID."],
    [isPhone(phone), "Please enter a valid phone number."],
    [course_id > 0, "Please select a course."],
    [semester > 0, "Please select a semester."],
    [id || password.length >= 6, "Password must be at least 6 characters."],
    [!password || password.length >= 6, "New password must be at least 6 characters."],
  ]);
  if (error) return fail(error);

  // The semester must exist in the chosen course (e.g. BCA = 3 years = 6 semesters)
  const { data: course } = await supabase.from("courses").select("duration_years").eq("id", course_id).single();
  if (!course) return fail("Please select a valid course.");
  if (semester > semestersFor(course)) return fail(`This course only has ${semestersFor(course)} semesters.`);

  // Business rule: roll numbers must be unique (the database also enforces this)
  let dupQuery = supabase.from("students").select("id").eq("roll_number", roll_number);
  if (id) dupQuery = dupQuery.neq("id", id);
  const { data: duplicate } = await dupQuery.maybeSingle();
  if (duplicate) return fail("A student with this roll number already exists.");

  const studentRow = { roll_number, phone, department, course_id, semester };

  if (!id) {
    // ---- ADD ----
    const account = await createAccount({ name, email, password, role: "student" });
    if (account.error) return fail(account.error);

    const { error: insertError } = await supabase.from("students").insert({ ...studentRow, user_id: account.userId });
    if (insertError) {
      await removeAccountQuietly(account.userId);
      return fail(friendlyDbError(insertError));
    }
  } else {
    // ---- EDIT ----
    const { data: existing } = await supabase.from("students").select("user_id").eq("id", id).single();
    if (!existing) return fail("Student not found.");

    const account = await updateAccount(existing.user_id, { name, email, password });
    if (account.error) return fail(account.error);

    const { error: updateError } = await supabase.from("students").update(studentRow).eq("id", id);
    if (updateError) return fail(friendlyDbError(updateError));
  }

  revalidatePath("/admin", "layout");
  return success(id ? "Student updated successfully." : "Student added successfully.");
}

/** Delete a student, their login account and all their attendance/results. Admin only. */
export async function deleteStudent(id) {
  const { supabase } = await requireRole(ADMIN);

  const { data: student } = await supabase.from("students").select("user_id").eq("id", id).single();
  if (!student) return fail("Student not found.");

  const result = await deleteAccount(student.user_id);
  if (result.error) return fail(result.error);

  revalidatePath("/admin", "layout");
  return success("Student deleted.");
}
