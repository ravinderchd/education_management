"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  BookOpen,
  Library,
  CalendarCheck,
  FileBarChart,
  Megaphone,
  LogOut,
  GraduationCap,
  UserCircle,
  Menu,
  X,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/format";

// Sidebar menus. `roles` limits an item to certain roles.
const STAFF_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/faculty", label: "Faculty", icon: UserSquare2, roles: ["admin"] },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/subjects", label: "Subjects", icon: Library },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/admin/results", label: "Results", icon: FileBarChart },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

const STUDENT_NAV = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/profile", label: "My Profile", icon: UserCircle },
  { href: "/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/student/attendance", label: "My Attendance", icon: CalendarCheck },
  { href: "/student/results", label: "My Results", icon: FileBarChart },
  { href: "/student/announcements", label: "Announcements", icon: Megaphone },
];

export default function DashboardShell({ profile, children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const nav = (profile.role === "student" ? STUDENT_NAV : STAFF_NAV).filter(
    (item) => !item.roles || item.roles.includes(profile.role)
  );
  const home = nav[0].href;
  const isActive = (href) => (href === home ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen">
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* ---------------- Sidebar ---------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-slate-300 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Link href={home} className="flex items-center gap-2.5 text-white" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">EduManage</span>
          </Link>
          <button className="text-slate-400 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(href) ? "bg-blue-600 text-white shadow-sm" : "hover:bg-navy-800 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          ))}
        </nav>

        <form action={logout} className="border-t border-navy-800 p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-navy-800 hover:text-white">
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </form>
      </aside>

      {/* ---------------- Main area ---------------- */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <button className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block" suppressHydrationWarning>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{profile.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
            </div>
            <Avatar name={profile.name} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
