import { requireRole, STAFF } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import CoursesManager from "./CoursesManager";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const { supabase, profile } = await requireRole(STAFF);

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, course_name, duration_years, description, subjects(count), students(count)")
    .order("course_name");
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Courses" subtitle="Programmes offered by the institution" />
      <CoursesManager
        courses={courses.map((c) => ({
          ...c,
          subjectCount: c.subjects?.[0]?.count ?? 0,
          studentCount: c.students?.[0]?.count ?? 0,
        }))}
        canEdit={profile.role === "admin"}
      />
    </>
  );
}
