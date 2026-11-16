import { FileBarChart } from "lucide-react";
import { requireRole, STAFF } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";
import ClassFilters from "@/components/academic/ClassFilters";
import ResultsSheet from "./ResultsSheet";
import GradingRules from "./GradingRules";

export const metadata = { title: "Results" };

export default async function ResultsPage({ searchParams }) {
  const sp = await searchParams;
  const { supabase, profile } = await requireRole(STAFF);

  const values = { course: sp.course ?? "", semester: sp.semester ?? "", subject: sp.subject ?? "" };

  const [{ data: courses }, { data: subjects }, { data: rules }] = await Promise.all([
    supabase.from("courses").select("id, course_name, duration_years").order("course_name"),
    supabase.from("subjects").select("id, subject_name, subject_code, course_id, semester, max_marks").order("subject_name"),
    supabase.from("grading_rules").select("grade, min_percentage").order("min_percentage", { ascending: false }),
  ]);

  const subject = (subjects || []).find(
    (s) => String(s.id) === values.subject && String(s.course_id) === values.course && String(s.semester) === values.semester
  );

  let sheet = null;
  if (subject) {
    const [{ data: students }, { data: results }] = await Promise.all([
      supabase
        .from("students")
        .select("id, roll_number, profile:profiles(name)")
        .eq("course_id", subject.course_id)
        .eq("semester", subject.semester)
        .order("roll_number"),
      supabase.from("results").select("student_id, marks, published").eq("subject_id", subject.id),
    ]);
    const byStudent = Object.fromEntries((results || []).map((r) => [r.student_id, r]));
    sheet = {
      subject,
      students: (students || []).map((s) => ({
        id: s.id,
        name: s.profile?.name,
        roll: s.roll_number,
        marks: byStudent[s.id] ? String(Number(byStudent[s.id].marks)) : "",
        published: byStudent[s.id]?.published ?? null, // null = no marks yet
      })),
    };
  }

  return (
    <>
      <PageHeader title="Examination & Results" subtitle="Enter marks – percentage and grade are calculated automatically" />
      <ClassFilters courses={courses || []} subjects={subjects || []} values={values} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {sheet ? (
            <ResultsSheet key={sheet.subject.id} sheet={sheet} rules={rules || []} />
          ) : (
            <div className="card">
              <EmptyState icon={FileBarChart} title="Select a subject" message="Choose a course, semester and subject to enter marks." />
            </div>
          )}
        </div>
        <GradingRules rules={rules || []} canEdit={profile.role === "admin"} />
      </div>
    </>
  );
}
