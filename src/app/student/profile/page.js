import { Mail, Phone, Hash, BookOpen, Building2, Layers, CalendarDays } from "lucide-react";
import { getMyStudent } from "@/lib/student";
import { PageHeader, Avatar } from "@/components/ui";
import NoStudentRecord from "@/components/academic/NoStudentRecord";
import { formatDate } from "@/lib/format";

export const metadata = { title: "My Profile" };

export default async function MyProfile() {
  const { profile, student } = await getMyStudent();

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your personal and academic details" />
      {!student ? (
        <NoStudentRecord />
      ) : (
        <div className="card overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-blue-600 to-navy-800" />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="rounded-full ring-4 ring-white">
                <Avatar name={profile.name} size="lg" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                <p className="text-sm text-slate-500">Student</p>
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              <Item icon={Hash} label="Student ID / Roll number" value={student.roll_number} />
              <Item icon={Mail} label="Email" value={profile.email} />
              <Item icon={Phone} label="Phone" value={student.phone || "-"} />
              <Item icon={Building2} label="Department" value={student.department || "-"} />
              <Item icon={BookOpen} label="Course" value={student.course?.course_name} />
              <Item icon={Layers} label="Current semester" value={`Semester ${student.semester} of ${student.course?.duration_years * 2}`} />
              <Item icon={CalendarDays} label="Registered on" value={formatDate(student.created_at)} />
            </dl>
            <p className="mt-8 text-xs text-slate-500">To correct any of these details, please contact the administration office.</p>
          </div>
        </div>
      )}
    </>
  );
}

function Item({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="font-medium text-slate-900">{value}</dd>
      </div>
    </div>
  );
}
