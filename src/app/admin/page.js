import Link from "next/link";
import { Users, UserSquare2, BookOpen, Library, ArrowRight, CalendarCheck } from "lucide-react";
import { requireRole, STAFF } from "@/lib/auth";
import { PageHeader, StatCard, Section, EmptyState, Avatar } from "@/components/ui";
import BarChartCard from "@/components/charts/BarChartCard";
import AnnouncementItem from "@/components/AnnouncementItem";
import { overallAttendance, attendancePercentage } from "@/lib/academics";
import { formatDate, daysAgoISO } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const { supabase, profile } = await requireRole(STAFF);

  const since = daysAgoISO(30);
  const count = (table) => supabase.from(table).select("*", { count: "exact", head: true });

  // Run all queries at the same time
  const [students, faculty, courses, subjects, recent, courseStats, attendance, announcements] = await Promise.all([
    count("students"),
    count("faculty"),
    count("courses"),
    count("subjects"),
    supabase
      .from("students")
      .select("id, roll_number, semester, created_at, profile:profiles(name, email), course:courses(course_name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("courses").select("course_name, students(count)").order("course_name"),
    supabase.from("attendance").select("date, status").gte("date", since),
    supabase
      .from("announcements")
      .select("*, author:profiles(name)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  // Students per course → chart data
  const courseChart = (courseStats.data || []).map((c) => ({
    label: c.course_name,
    value: c.students?.[0]?.count ?? 0,
  }));

  // Attendance % for the last 7 days that had classes
  const byDate = {};
  for (const row of attendance.data || []) {
    byDate[row.date] ??= { present: 0, total: 0 };
    byDate[row.date].total++;
    if (row.status === "present") byDate[row.date].present++;
  }
  const attendanceChart = Object.keys(byDate)
    .sort()
    .slice(-7)
    .map((d) => ({
      label: new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      value: attendancePercentage(byDate[d].present, byDate[d].total),
    }));
  const overall = overallAttendance(attendance.data || []);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${profile.name.split(" ")[0]}`}
        subtitle="Here's an overview of your institution"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value={students.count ?? 0} tone="blue" />
        <StatCard icon={UserSquare2} label="Total Faculty" value={faculty.count ?? 0} tone="green" />
        <StatCard icon={BookOpen} label="Total Courses" value={courses.count ?? 0} tone="amber" />
        <StatCard icon={Library} label="Total Subjects" value={subjects.count ?? 0} tone="violet" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Students per course">
          {courseChart.length ? (
            <BarChartCard data={courseChart} valueLabel="Students" />
          ) : (
            <EmptyState title="No courses yet" />
          )}
        </Section>

        <Section
          title="Attendance overview"
          action={
            <span className="text-sm text-slate-500">
              Last 30 days: <b className="text-slate-900">{overall.percentage}%</b>
            </span>
          }
        >
          {attendanceChart.length ? (
            <BarChartCard data={attendanceChart} valueLabel="Present" suffix="%" maxValue={100} />
          ) : (
            <EmptyState icon={CalendarCheck} title="No attendance recorded" message="Attendance from the last 30 days will appear here." />
          )}
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Section
          className="xl:col-span-3"
          bodyClassName=""
          title="Recent student registrations"
          action={<ViewAll href="/admin/students" />}
        >
          {recent.data?.length ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No.</th>
                    <th>Course</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.data.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/admin/students/${s.id}`} className="flex items-center gap-3">
                          <Avatar name={s.profile?.name} size="sm" />
                          <div>
                            <p className="font-medium text-slate-900">{s.profile?.name}</p>
                            <p className="text-xs text-slate-500">{s.profile?.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td>{s.roll_number}</td>
                      <td>
                        {s.course?.course_name} · Sem {s.semester}
                      </td>
                      <td className="whitespace-nowrap">{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Users} title="No students yet" />
          )}
        </Section>

        <Section className="xl:col-span-2" title="Recent announcements" action={<ViewAll href="/admin/announcements" />}>
          {announcements.data?.length ? (
            <div className="space-y-5">
              {announcements.data.map((a) => (
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

function ViewAll({ href }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
      View all <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
