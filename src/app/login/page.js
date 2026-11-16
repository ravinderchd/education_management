import { redirect } from "next/navigation";
import { GraduationCap, BookOpen, CalendarCheck, FileBarChart } from "lucide-react";
import { getSession, homeFor } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  // Already logged in? Go straight to the dashboard.
  const session = await getSession();
  if (session) redirect(homeFor(session.profile.role));

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left: brand panel (hidden on small screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-navy-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <GraduationCap className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold">EduManage</span>
        </div>

        <div className="relative z-10 max-w-md">
          <GraduationCap className="mb-6 h-20 w-20 text-white/90" strokeWidth={1.5} />
          <h1 className="text-5xl leading-tight font-bold">EduManage</h1>
          <p className="mt-3 text-xl text-blue-100">Manage. Learn. Achieve.</p>
          <ul className="mt-10 space-y-4 text-blue-50">
            {[
              [BookOpen, "Courses, subjects and student records in one place"],
              [CalendarCheck, "Daily attendance with automatic percentages"],
              [FileBarChart, "Marks, grades and results for every semester"],
            ].map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-blue-200">Education Management Software</p>
        {/* decorative circles */}
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-20 -right-10 h-48 w-48 rounded-full bg-white/5" />
      </div>

      {/* Right: login form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="text-xl font-bold text-slate-900">EduManage</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-2 text-slate-500">Sign in to your account</p>

          <LoginForm />

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="mb-2 font-semibold text-slate-700">Demo accounts</p>
            <p>Admin: admin@edumanage.com / Admin@123</p>
            <p>Faculty: faculty@edumanage.com / Faculty@123</p>
            <p>Student: rahul@edumanage.com / Student@123</p>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Accounts are created by the administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
