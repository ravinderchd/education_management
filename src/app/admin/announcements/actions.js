"use server";

import { revalidatePath } from "next/cache";
import { requireRole, STAFF } from "@/lib/auth";
import { friendlyDbError } from "@/lib/academics";
import { text, firstError, fail, success } from "@/lib/validation";

export async function createAnnouncement(formData) {
  const { supabase, profile } = await requireRole(STAFF);

  const title = text(formData, "title");
  const description = text(formData, "description");
  const audience = text(formData, "audience");
  const date = text(formData, "date");

  const error = firstError([
    [title.length >= 3, "Please enter a title (at least 3 characters)."],
    [title.length <= 150, "The title is too long (max 150 characters)."],
    [description.length >= 5, "Please enter a description."],
    [["all", "students", "faculty"].includes(audience), "Please choose the target audience."],
    [/^\d{4}-\d{2}-\d{2}$/.test(date), "Please choose a valid date."],
  ]);
  if (error) return fail(error);

  const { error: dbError } = await supabase
    .from("announcements")
    .insert({ title, description, audience, date, created_by: profile.id });
  if (dbError) return fail(friendlyDbError(dbError));

  revalidatePath("/", "layout");
  return success("Announcement published.");
}

/** Admin can delete any announcement; faculty only their own (enforced by RLS too). */
export async function deleteAnnouncement(id) {
  const { supabase } = await requireRole(STAFF);

  const { data, error } = await supabase.from("announcements").delete().eq("id", id).select("id");
  if (error) return fail(friendlyDbError(error));
  if (!data?.length) return fail("You can only delete announcements you created.");

  revalidatePath("/", "layout");
  return success("Announcement deleted.");
}
