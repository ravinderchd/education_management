"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { semestersFor } from "@/lib/academics";

/**
 * Course → Semester → Subject (→ Date) selectors used on the Attendance and Results pages.
 * The choice is stored in the URL (?course=1&semester=4&subject=3&date=2026-11-16),
 * so the server page can load the matching students.
 */
export default function ClassFilters({ courses, subjects, values, showDate = false, maxDate }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const course = courses.find((c) => String(c.id) === values.course);
  const subjectOptions = subjects.filter(
    (s) => String(s.course_id) === values.course && String(s.semester) === values.semester
  );

  function update(changes) {
    const next = { ...values, ...changes };
    // changing a "parent" filter clears the ones below it
    if ("course" in changes) {
      next.semester = "";
      next.subject = "";
    }
    if ("semester" in changes) next.subject = "";
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    startTransition(() => router.push(`${pathname}?${params}`));
  }

  return (
    <div className="card mb-6 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label>
        <span className="label">Course</span>
        <select className="input" value={values.course} onChange={(e) => update({ course: e.target.value })}>
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course_name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Semester</span>
        <select className="input" value={values.semester} disabled={!course} onChange={(e) => update({ semester: e.target.value })}>
          <option value="">Select semester</option>
          {Array.from({ length: semestersFor(course) }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Semester {i + 1}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Subject</span>
        <select className="input" value={values.subject} disabled={!values.semester} onChange={(e) => update({ subject: e.target.value })}>
          <option value="">{values.semester && !subjectOptions.length ? "No subjects in this semester" : "Select subject"}</option>
          {subjectOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.subject_name}
            </option>
          ))}
        </select>
      </label>
      {showDate && (
        <label>
          <span className="label flex items-center gap-2">
            Date {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
          </span>
          <input
            type="date"
            className="input"
            value={values.date}
            max={maxDate}
            onChange={(e) => e.target.value && update({ date: e.target.value })}
          />
        </label>
      )}
      {!showDate && pending && (
        <div className="flex items-end pb-3 text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" /> Loading…
        </div>
      )}
    </div>
  );
}
