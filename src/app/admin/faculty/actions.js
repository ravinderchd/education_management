"use server";

import { revalidatePath } from "next/cache";
import { requireRole, ADMIN } from "@/lib/auth";
import { createAccount, updateAccount, deleteAccount, removeAccountQuietly } from "@/lib/accounts";
import { friendlyDbError } from "@/lib/academics";
import { text, isEmail, isPhone, firstError, fail, success } from "@/lib/validation";

/** Add (no id) or update (with id) a faculty member. Admin only. */
export async function saveFaculty(formData) {
  const { supabase } = await requireRole(ADMIN);

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const department = text(formData, "department");
  const designation = text(formData, "designation");
  const phone = text(formData, "phone");

  const error = firstError([
    [name.length >= 2, "Please enter the full name."],
    [isEmail(email), "Please enter a valid email address."],
    [department.length > 0, "Please enter the department."],
    [designation.length > 0, "Please enter the designation."],
    [isPhone(phone), "Please enter a valid phone number."],
    [id || password.length >= 6, "Password must be at least 6 characters."],
    [!password || password.length >= 6, "New password must be at least 6 characters."],
  ]);
  if (error) return fail(error);

  const row = { department, designation, phone };

  if (!id) {
    const account = await createAccount({ name, email, password, role: "faculty" });
    if (account.error) return fail(account.error);

    const { error: insertError } = await supabase.from("faculty").insert({ ...row, user_id: account.userId });
    if (insertError) {
      await removeAccountQuietly(account.userId);
      return fail(friendlyDbError(insertError));
    }
  } else {
    const { data: existing } = await supabase.from("faculty").select("user_id").eq("id", id).single();
    if (!existing) return fail("Faculty member not found.");

    const account = await updateAccount(existing.user_id, { name, email, password });
    if (account.error) return fail(account.error);

    const { error: updateError } = await supabase.from("faculty").update(row).eq("id", id);
    if (updateError) return fail(friendlyDbError(updateError));
  }

  revalidatePath("/admin", "layout");
  return success(id ? "Faculty member updated." : "Faculty member added.");
}

export async function deleteFaculty(id) {
  const { supabase } = await requireRole(ADMIN);

  const { data: member } = await supabase.from("faculty").select("user_id").eq("id", id).single();
  if (!member) return fail("Faculty member not found.");

  const result = await deleteAccount(member.user_id);
  if (result.error) return fail(result.error);

  revalidatePath("/admin", "layout");
  return success("Faculty member deleted.");
}
