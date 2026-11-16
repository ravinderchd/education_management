import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";

// "/" just forwards the visitor to the right place.
export default async function Home() {
  const session = await getSession();
  redirect(session ? homeFor(session.profile.role) : "/login");
}
