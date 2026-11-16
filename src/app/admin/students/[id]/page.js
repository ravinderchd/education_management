import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, BookOpen, Building2, Hash, CalendarCheck, FileBarChart } from "lucide-react";
import { requireRole, STAFF } from "@/lib/auth";
import { Avatar, Section, StatCard } from "@/components/ui";
import AttendanceSummary from "@/components/academic/AttendanceSummary";
import ResultsTable from "@/components/academic/ResultsTable";
import { overallAttendance, summarizeResults } from "@/lib/academics";

export const metadata = { title: "Student details" };

export default async function StudentDetails({ params }) {
  const { id } = await params;
  const { supabase } = await requireRole(STAFF);

  const { data: student } = await supabase
    .from("students")
    .select("*, profile:profiles(name, email), course:courses(id, course_name, duration_years)")
    .eq("id", id)
    .maybeSingle();
  if (!student) notFound();

  const [{ data: subjects }, { data: attendance }, { data: results }, { data: rules }] = await Promise.all([
    supabase.from("subjects").select("id, subject_name, subject_code, semester").eq("course_id", student.course_id).order("semester").order("subject_name"),
    supabase.from("attendance").select("subject_id, status").eq("student_id", student.id),
    supabase
      .from("results")
      .select("id, marks, total_marks, grade, published, subject:subjects(subject_name, subject_code, semester)")
      .eq("student_id", student.id),
    supabase.from("grading_rules").select("grade, min_percentage"),
  ]);

  const att = overallAttendance(attendance || []);
  const res = summarizeResults(results || [], rules || []);

  return (
    <>
      <Link href="/admin/students" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <div className="card mb-6 flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <Avatar name={student.profile.name} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{student.profile.name}</h1>
          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
            <Info icon={Hash} text={student.roll_number} />
            <Info icon={Mail} text={student.profile.email} />
            <Info icon={Phone} text={student.phone || "-"} />
            <Info icon={BookOpen} text={`${student.course.course_name} · Semester ${student.semester}`} />
            <Info icon={Building2} text={student.department || "-"} />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={CalendarCheck} label="Overall attendance" value={`${att.percentage}%`} hint={`${att.present} of ${att.total} classes`} tone={att.total && att.percentage < 75 ? "red" : "green"} />
        <StatCard icon={FileBarChart} label="Overall result" value={results?.length ? `${res.percentage}%` : "-"} hint={results?.length ? `Grade ${res.grade} · ${res.obtained}/${res.maximum} marks` : "No marks entered"} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Attendance by subject" bodyClassName="">
          <AttendanceSummary subjects={subjects || []} records={attendance || []} />
        </Section>
        <Section title="Examination results" bodyClassName="">
          <ResultsTable results={results || []} rules={rules || []} showStatus />
        </Section>
      </div>
    </>
  );
}

function Info({ icon: Icon, text }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" /> {text}
    </span>
  );
}
