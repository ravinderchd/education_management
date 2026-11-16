"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Library, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useServerAction } from "@/components/ui/useServerAction";
import { EmptyState, Field } from "@/components/ui";
import { semestersFor } from "@/lib/academics";
import { saveSubject, deleteSubject } from "./actions";

export default function SubjectsManager({ subjects, courses, initialCourse, canEdit }) {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState(String(initialCourse));
  const [semesterFilter, setSemesterFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { pending, run } = useServerAction();

  const selectedCourse = courses.find((c) => String(c.id) === courseFilter);
  const maxSemester = selectedCourse ? semestersFor(selectedCourse) : Math.max(0, ...courses.map(semestersFor));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjects.filter(
      (s) =>
        (!courseFilter || String(s.course_id) === courseFilter) &&
        (!semesterFilter || String(s.semester) === semesterFilter) &&
        (!q || s.subject_name.toLowerCase().includes(q) || (s.subject_code || "").toLowerCase().includes(q))
    );
  }, [subjects, query, courseFilter, semesterFilter]);

  return (
    <div className="card">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search subjects…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <select
            className="input lg:w-44"
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setSemesterFilter("");
            }}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_name}
              </option>
            ))}
          </select>
          <select className="input lg:w-40" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
            <option value="">All semesters</option>
            {Array.from({ length: maxSemester }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Semester {i + 1}
              </option>
            ))}
          </select>
        </div>
        {canEdit && (
          <button
            className="btn-primary"
            disabled={!courses.length}
            onClick={() => setEditing({ course_id: courseFilter || "", semester: semesterFilter || "" })}
          >
            <Plus className="h-4 w-4" /> Add Subject
          </button>
        )}
      </div>

      {filtered.length ? (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject</th>
                <th>Course</th>
                <th className="text-center">Semester</th>
                <th className="text-center">Max marks</th>
                {canEdit && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="badge bg-blue-50 font-mono text-blue-700">{s.subject_code || "—"}</span>
                  </td>
                  <td className="font-medium text-slate-900">{s.subject_name}</td>
                  <td>{s.course?.course_name}</td>
                  <td className="text-center">{s.semester}</td>
                  <td className="text-center">{s.max_marks}</td>
                  {canEdit && (
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="icon-btn" title="Edit" onClick={() => setEditing(s)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="icon-btn hover:!text-red-600" title="Delete" onClick={() => setDeleting(s)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Library}
          title={subjects.length ? "No matching subjects" : "No subjects yet"}
          message={subjects.length ? "Try another course or semester." : "Add subjects to your courses."}
        />
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Edit subject" : "Add subject"}>
        {editing !== null && (
          <SubjectForm
            key={editing.id ?? "new"}
            subject={editing}
            courses={courses}
            pending={pending}
            onCancel={() => setEditing(null)}
            onSubmit={(fd) => run(saveSubject, fd, { onSuccess: () => setEditing(null) })}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        pending={pending}
        title="Delete subject?"
        message={
          <>
            Delete <b>{deleting?.subject_name}</b>? All attendance and marks recorded for this subject will also be deleted.
          </>
        }
        onConfirm={() => run(deleteSubject, deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

function SubjectForm({ subject, courses, pending, onSubmit, onCancel }) {
  const [courseId, setCourseId] = useState(String(subject.course_id ?? ""));
  const course = courses.find((c) => String(c.id) === courseId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {subject.id && <input type="hidden" name="id" value={subject.id} />}
      <Field label="Subject name" className="sm:col-span-2">
        <input name="subject_name" className="input" required defaultValue={subject.subject_name} placeholder="Database Management Systems" />
      </Field>
      <Field label="Subject code">
        <input name="subject_code" className="input uppercase" defaultValue={subject.subject_code} placeholder="BCA401" />
      </Field>
      <Field label="Maximum marks">
        <input name="max_marks" type="number" min={1} max={1000} className="input" required defaultValue={subject.max_marks ?? 100} />
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
        <select name="semester" className="input" required defaultValue={subject.semester ?? ""} disabled={!course}>
          <option value="">Select semester</option>
          {Array.from({ length: semestersFor(course) }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Semester {i + 1}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
        <button className="btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {subject.id ? "Save changes" : "Add subject"}
        </button>
      </div>
    </form>
  );
}
