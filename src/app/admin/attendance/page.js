import { CalendarCheck } from "lucide-react";
import { requireRole, STAFF } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";
import ClassFilters from "@/components/academic/ClassFilters";
import { summarizeAttendance } from "@/lib/academics";
import { todayISO } from "@/lib/format";
import AttendanceSheet from "./AttendanceSheet";

export const metadata = { title: "Attendance" };

export default async function AttendancePage({ searchParams }) {
  const sp = await searchParams;
  const { supabase } = await requireRole(STAFF);

  const today = todayISO();
  const values = {
    course: sp.course ?? "",
    semester: sp.semester ?? "",
    subject: sp.subject ?? "",
    date: /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date : today,
  };

  const [{ data: courses }, { data: subjects }] = await Promise.all([
    supabase.from("courses").select("id, course_name, duration_years").order("course_name"),
    supabase.from("subjects").select("id, subject_name, subject_code, course_id, semester").order("subject_name"),
  ]);

  const subject = (subjects || []).find(
    (s) => String(s.id) === values.subject && String(s.course_id) === values.course && String(s.semester) === values.semester
  );

  let sheet = null;
  if (subject) {
    // Students in this course + semester, the attendance already saved for this date,
    // and every attendance row for the subject (to show each student's running %).
    const [{ data: students }, { data: allRecords }] = await Promise.all([
      supabase
        .from("students")
        .select("id, roll_number, profile:profiles(name)")
        .eq("course_id", subject.course_id)
        .eq("semester", subject.semester)
        .order("roll_number"),
      supabase.from("attendance").select("student_id, date, status").eq("subject_id", subject.id),
    ]);

    const todays = (allRecords || []).filter((r) => r.date === values.date);
    const statusByStudent = Object.fromEntries(todays.map((r) => [r.student_id, r.status]));
    const summary = summarizeAttendance(allRecords || [], "student_id");
    const classesHeld = new Set((allRecords || []).map((r) => r.date)).size;

    sheet = {
      subject,
      alreadySaved: todays.length > 0,
      classesHeld,
      students: (students || []).map((s) => ({
        id: s.id,
        name: s.profile?.name,
        roll: s.roll_number,
        status: statusByStudent[s.id] ?? "present",
        summary: summary[s.id] ?? { present: 0, total: 0, percentage: 0 },
      })),
    };
  }

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark daily attendance – percentages are calculated automatically" />
      <ClassFilters courses={courses || []} subjects={subjects || []} values={values} showDate maxDate={today} />

      {sheet ? (
        <AttendanceSheet key={`${sheet.subject.id}-${values.date}`} sheet={sheet} date={values.date} />
      ) : (
        <div className="card">
          <EmptyState
            icon={CalendarCheck}
            title="Select a class"
            message="Choose a course, semester, subject and date to load the student list."
          />
        </div>
      )}
    </>
  );
}
