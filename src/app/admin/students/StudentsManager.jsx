"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Eye, Users, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useServerAction } from "@/components/ui/useServerAction";
import { Avatar, EmptyState, Field } from "@/components/ui";
import { semestersFor } from "@/lib/academics";
import { saveStudent, deleteStudent } from "./actions";

export default function StudentsManager({ students, courses, canEdit }) {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...student} = edit
  const [deleting, setDeleting] = useState(null);
  const { pending, run } = useServerAction();

  // Search by name, roll number or email + filter by course
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchesText =
        !q ||
        s.profile?.name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.profile?.email.toLowerCase().includes(q);
      const matchesCourse = !courseFilter || String(s.course_id) === courseFilter;
      return matchesText && matchesCourse;
    });
  }, [students, query, courseFilter]);

  return (
    <div className="card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, roll number or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input md:w-48" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course_name}
            </option>
          ))}
        </select>
        {canEdit && (
          <button className="btn-primary" onClick={() => setEditing({})} disabled={!courses.length}>
            <Plus className="h-4 w-4" /> Add Student
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length ? (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No.</th>
                <th>Course</th>
                <th>Semester</th>
                <th className="hidden lg:table-cell">Phone</th>
                <th className="hidden xl:table-cell">Department</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.profile?.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{s.profile?.name}</p>
                        <p className="truncate text-xs text-slate-500">{s.profile?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{s.roll_number}</td>
                  <td>{s.course?.course_name}</td>
                  <td>{s.semester}</td>
                  <td className="hidden lg:table-cell">{s.phone || "-"}</td>
                  <td className="hidden xl:table-cell">{s.department || "-"}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/students/${s.id}`} className="icon-btn" title="View details">
                        <Eye className="h-4 w-4" />
                      </Link>
                      {canEdit && (
                        <>
                          <button className="icon-btn" title="Edit" onClick={() => setEditing(s)}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button className="icon-btn hover:!text-red-600" title="Delete" onClick={() => setDeleting(s)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={students.length ? "No matching students" : "No students yet"}
          message={
            students.length
              ? "Try a different search or course filter."
              : courses.length
                ? "Add your first student to get started."
                : "Create a course first, then add students to it."
          }
        />
      )}

      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        Showing {filtered.length} of {students.length} students
      </div>

      {/* Add / edit form */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit student" : "Add student"}
        description={editing?.id ? "Update the student's details." : "A login account is created for the student."}
        size="lg"
      >
        {editing !== null && (
          <StudentForm
            key={editing.id ?? "new"}
            student={editing}
            courses={courses}
            pending={pending}
            onCancel={() => setEditing(null)}
            onSubmit={(fd) => run(saveStudent, fd, { onSuccess: () => setEditing(null) })}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        pending={pending}
        title="Delete student?"
        message={
          <>
            This permanently deletes <b>{deleting?.profile?.name}</b> ({deleting?.roll_number}), their login account and
            all of their attendance and results.
          </>
        }
        onConfirm={() => run(deleteStudent, deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

function StudentForm({ student, courses, pending, onSubmit, onCancel }) {
  const isEdit = !!student.id;
  const [courseId, setCourseId] = useState(String(student.course_id ?? ""));
  const course = courses.find((c) => String(c.id) === courseId);
  const semesters = Array.from({ length: semestersFor(course) }, (_, i) => i + 1);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {isEdit && <input type="hidden" name="id" value={student.id} />}

      <Field label="Full name" className="sm:col-span-2">
        <input name="name" className="input" required defaultValue={student.profile?.name} placeholder="Rahul Sharma" />
      </Field>
      <Field label="Student ID / Roll number">
        <input name="roll_number" className="input uppercase" required defaultValue={student.roll_number} placeholder="STU001" />
      </Field>
      <Field label="Phone">
        <input name="phone" className="input" defaultValue={student.phone} placeholder="9876543210" />
      </Field>
      <Field label="Email (used to log in)">
        <input name="email" type="email" className="input" required defaultValue={student.profile?.email} placeholder="rahul@gmail.com" />
      </Field>
      <Field label={isEdit ? "New password (optional)" : "Password"}>
        <input
          name="password"
          type="password"
          className="input"
          required={!isEdit}
          minLength={6}
          placeholder={isEdit ? "Leave blank to keep" : "At least 6 characters"}
          autoComplete="new-password"
        />
      </Field>
      <Field label="Course">
        <select name="course_id" className="input" required value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course_name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Semester">
        <select name="semester" className="input" required defaultValue={student.semester ?? ""} disabled={!course}>
          <option value="">Select semester</option>
          {semesters.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Department" className="sm:col-span-2">
        <input name="department" className="input" defaultValue={student.department} placeholder="Computer Science" />
      </Field>

      <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
        <button className="btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Add student"}
        </button>
      </div>
    </form>
  );
}
