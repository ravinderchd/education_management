import { BookOpen, Library } from "lucide-react";
import { getMyStudent } from "@/lib/student";
import { PageHeader, Section, EmptyState } from "@/components/ui";
import NoStudentRecord from "@/components/academic/NoStudentRecord";

export const metadata = { title: "My Courses" };

const TONES = ["bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-500", "bg-rose-600", "bg-cyan-600"];

export default async function MyCourses() {
  const { supabase, student } = await getMyStudent();
  if (!student) {
    return (
      <>
        <PageHeader title="My Courses" />
        <NoStudentRecord />
      </>
    );
  }

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, subject_name, subject_code, semester, max_marks")
    .eq("course_id", student.course_id)
    .order("semester")
    .order("subject_name");

  const current = (subjects || []).filter((s) => s.semester === student.semester);
  const bySemester = {};
  for (const s of subjects || []) (bySemester[s.semester] ??= []).push(s);

  return (
    <>
      <PageHeader
        title="My Courses"
        subtitle={`${student.course.course_name} · ${student.course.duration_years} years · currently in semester ${student.semester}`}
      />

      <h2 className="mb-3 font-semibold text-slate-900">Semester {student.semester} subjects</h2>
      {current.length ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {current.map((s, i) => (
            <div key={s.id} className="card p-5 text-center">
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white ${TONES[i % TONES.length]}`}>
                <BookOpen className="h-6 w-6" />
              </div>
              <p className="mt-4 font-semibold text-slate-900">{s.subject_name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {s.subject_code || "—"} · Max marks {s.max_marks}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card mb-8">
          <EmptyState icon={Library} title="No subjects added for this semester yet" />
        </div>
      )}

      <Section title="Full course structure" bodyClassName="">
        {Object.keys(bySemester).length ? (
          <div className="divide-y divide-slate-100">
            {Object.entries(bySemester).map(([sem, list]) => (
              <div key={sem} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:gap-6">
                <div className="w-32 shrink-0">
                  <span
                    className={`badge ${Number(sem) === student.semester ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    Semester {sem}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <span key={s.id} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                      {s.subject_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Library} title="No subjects yet" />
        )}
      </Section>
    </>
  );
}
