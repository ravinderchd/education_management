"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeFor } from "@/lib/auth";
import { isEmail } from "@/lib/validation";

/**
 * LOGIN
 * 1. validate the form
 * 2. Supabase Auth checks the email + bcrypt-hashed password and stores a JWT session cookie
 * 3. read the user's role from the profiles table and redirect to the right dashboard
 */
export async function login(prevState, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isEmail(email)) return { error: "Please enter a valid email address.", email };
  if (!password) return { error: "Please enter your password.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password.", email };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Your account has no EduManage profile. Contact the administrator.", email };
  }

  redirect(homeFor(profile.role));
}

/** LOGOUT – clears the session cookie. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
