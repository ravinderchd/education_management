import Link from "next/link";
import { BookOpen, CalendarCheck, FileBarChart, GraduationCap, ArrowRight, AlertTriangle } from "lucide-react";
import { getMyStudent } from "@/lib/student";
import { PageHeader, StatCard, Section, EmptyState, ProgressBar, GradeBadge, Avatar } from "@/components/ui";
import AnnouncementItem from "@/components/AnnouncementItem";
import NoStudentRecord from "@/components/academic/NoStudentRecord";
import { MIN_ATTENDANCE, overallAttendance, summarizeAttendance, summarizeResults, marksPercentage } from "@/lib/academics";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const { supabase, profile, student } = await getMyStudent();
  const firstName = profile.name.split(" ")[0];

  if (!student) {
    return (
      <>
        <PageHeader title={`Welcome, ${firstName}`} />
        <NoStudentRecord />
      </>
    );
  }

  const [{ data: subjects }, { data: attendance }, { data: results }, { data: rules }, { data: announcements }] =
    await Promise.all([
      supabase
        .from("subjects")
        .select("id, subject_name, subject_code")
        .eq("course_id", student.course_id)
        .eq("semester", student.semester)
        .order("subject_name"),
      supabase.from("attendance").select("subject_id, status").eq("student_id", student.id),
      supabase
        .from("results")
        .select("id, marks, total_marks, grade, subject:subjects(subject_name, semester)")
        .eq("student_id", student.id),
      supabase.from("grading_rules").select("grade, min_percentage"),
      supabase.from("announcements").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(4),
    ]);

  const att = overallAttendance(attendance || []);
  const perSubject = summarizeAttendance(attendance || []);
  const res = summarizeResults(results || [], rules || []);
  const lowSubjects = (subjects || []).filter((s) => perSubject[s.id] && perSubject[s.id].percentage < MIN_ATTENDANCE);

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName} 👋`} subtitle="Here's your academic overview" />

      {lowSubjects.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Your attendance is below {MIN_ATTENDANCE}% in <b>{lowSubjects.map((s) => s.subject_name).join(", ")}</b>. Please
            attend classes regularly.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={GraduationCap} label="Course" value={student.course?.course_name} hint={`Semester ${student.semester}`} tone="blue" />
        <StatCard icon={BookOpen} label="Current subjects" value={subjects?.length ?? 0} tone="violet" />
        <StatCard
          icon={CalendarCheck}
          label="Attendance"
          value={`${att.percentage}%`}
          hint={`${att.present} of ${att.total} classes`}
          tone={att.total && att.percentage < MIN_ATTENDANCE ? "red" : "green"}
        />
        <StatCard
          icon={FileBarChart}
          label="Overall result"
          value={results?.length ? `${res.percentage}%` : "–"}
          hint={results?.length ? `Grade ${res.grade}` : "No published results"}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Profile summary */}
        <Section title="My profile" action={<More href="/student/profile" />}>
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{profile.name}</p>
              <p className="truncate text-sm text-slate-500">{profile.email}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">{student.roll_number}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <Row label="Course" value={`${student.course?.course_name} · Sem ${student.semester}`} />
            <Row label="Department" value={student.department || "-"} />
            <Row label="Phone" value={student.phone || "-"} />
          </dl>
        </Section>

        {/* Attendance by subject */}
        <Section title="Attendance this semester" className="xl:col-span-2" action={<More href="/student/attendance" />}>
          {subjects?.length ? (
            <div className="space-y-4">
              {subjects.map((s) => {
                const a = perSubject[s.id];
                return (
                  <div key={s.id}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-slate-800">{s.subject_name}</span>
                      <span className={a && a.percentage < MIN_ATTENDANCE ? "font-semibold text-red-600" : "text-slate-600"}>
                        {a ? `${a.percentage}% (${a.present}/${a.total})` : "No classes yet"}
                      </span>
                    </div>
                    <ProgressBar value={a?.percentage ?? 0} warnBelow={a ? MIN_ATTENDANCE : undefined} />
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="No subjects in this semester" />
          )}
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Recent results" bodyClassName="" action={<More href="/student/results" />}>
          {results?.length ? (
            <table className="table">
              <tbody>
                {results.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-slate-900">{r.subject?.subject_name}</td>
                    <td className="text-right">
                      {Number(r.marks)}/{Number(r.total_marks)}
                    </td>
                    <td className="text-right text-slate-500">{marksPercentage(r.marks, r.total_marks)}%</td>
                    <td className="text-center">
                      <GradeBadge grade={r.grade} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={FileBarChart} title="No published results yet" />
          )}
        </Section>

        <Section title="Recent announcements" action={<More href="/student/announcements" />}>
          {announcements?.length ? (
            <div className="space-y-5">
              {announcements.map((a) => (
                <AnnouncementItem key={a.id} announcement={a} compact />
              ))}
            </div>
          ) : (
            <EmptyState title="No announcements" />
          )}
        </Section>
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function More({ href }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
      View all <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
