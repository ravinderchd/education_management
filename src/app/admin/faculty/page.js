import { requireRole, ADMIN } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import FacultyManager from "./FacultyManager";

export const metadata = { title: "Faculty" };

// Admin only – faculty members are redirected to their dashboard.
export default async function FacultyPage() {
  const { supabase } = await requireRole(ADMIN);

  const { data: faculty, error } = await supabase
    .from("faculty")
    .select("id, department, designation, phone, profile:profiles(name, email)")
    .order("created_at");
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Faculty" subtitle="Manage teaching staff and their login accounts" />
      <FacultyManager faculty={faculty} />
    </>
  );
}
