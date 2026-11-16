import { requireRole, STAFF } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import StudentsManager from "./StudentsManager";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const { supabase, profile } = await requireRole(STAFF);

  const [{ data: students, error }, { data: courses }] = await Promise.all([
    supabase
      .from("students")
      .select("id, roll_number, semester, phone, department, course_id, user_id, profile:profiles(name, email), course:courses(course_name)")
      .order("roll_number"),
    supabase.from("courses").select("id, course_name, duration_years").order("course_name"),
  ]);
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Students" subtitle="Manage student records, enrolment and contact details" />
      <StudentsManager students={students} courses={courses || []} canEdit={profile.role === "admin"} />
    </>
  );
}
