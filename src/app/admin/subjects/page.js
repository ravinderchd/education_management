import { requireRole, STAFF } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import SubjectsManager from "./SubjectsManager";

export const metadata = { title: "Subjects" };

export default async function SubjectsPage({ searchParams }) {
  const { course } = await searchParams; // e.g. /admin/subjects?course=1 from the Courses page
  const { supabase, profile } = await requireRole(STAFF);

  const [{ data: subjects, error }, { data: courses }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, subject_name, subject_code, course_id, semester, max_marks, course:courses(course_name)")
      .order("semester")
      .order("subject_name"),
    supabase.from("courses").select("id, course_name, duration_years").order("course_name"),
  ]);
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Subjects" subtitle="Subjects taught in each course and semester" />
      <SubjectsManager
        key={course ?? "all"}
        subjects={subjects}
        courses={courses || []}
        initialCourse={course ?? ""}
        canEdit={profile.role === "admin"}
      />
    </>
  );
}
