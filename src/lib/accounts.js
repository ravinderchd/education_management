import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Login-account helpers used by the Students and Faculty screens.
 * Creating a person = (1) a Supabase Auth user (email + hashed password)
 *                   + (2) a row in profiles (name, email, role).
 * Only call these AFTER checking that the current user is an admin.
 */

export async function createAccount({ name, email, password, role }) {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // admin-created accounts don't need email verification
    user_metadata: { name },
  });
  if (error) {
    const taken = /already|registered|exists/i.test(error.message);
    return { error: taken ? "This email address is already in use." : error.message };
  }

  const userId = data.user.id;
  const { error: profileError } = await admin.from("profiles").insert({ id: userId, name, email, role });
  if (profileError) {
    await admin.auth.admin.deleteUser(userId); // undo – don't leave half-created accounts
    return { error: profileError.message };
  }
  return { userId };
}

export async function updateAccount(userId, { name, email, password }) {
  const admin = createAdminClient();

  const changes = { email, email_confirm: true, user_metadata: { name } };
  if (password) changes.password = password;

  const { error } = await admin.auth.admin.updateUserById(userId, changes);
  if (error) {
    const taken = /already|registered|exists/i.test(error.message);
    return { error: taken ? "This email address is already in use." : error.message };
  }

  const { error: profileError } = await admin.from("profiles").update({ name, email }).eq("id", userId);
  if (profileError) return { error: profileError.message };
  return {};
}

/** Deleting the auth user cascades to profiles → students/faculty → attendance/results. */
export async function deleteAccount(userId) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  return error ? { error: error.message } : {};
}

/** Rolls back a just-created account when a later insert fails. */
export async function removeAccountQuietly(userId) {
  await createAdminClient().auth.admin.deleteUser(userId);
}
