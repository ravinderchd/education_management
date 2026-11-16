"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, BookOpen, Library, Users, Clock, Loader2, ArrowRight } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useServerAction } from "@/components/ui/useServerAction";
import { EmptyState, Field } from "@/components/ui";
import { saveCourse, deleteCourse } from "./actions";

const ICON_TONES = ["bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-500", "bg-rose-600", "bg-cyan-600"];

export default function CoursesManager({ courses, canEdit }) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { pending, run } = useServerAction();

  return (
    <>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> Add Course
          </button>
        </div>
      )}

      {courses.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c, i) => (
            <div key={c.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${ICON_TONES[i % ICON_TONES.length]}`}>
                  <BookOpen className="h-6 w-6" />
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button className="icon-btn" title="Edit" onClick={() => setEditing(c)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="icon-btn hover:!text-red-600" title="Delete" onClick={() => setDeleting(c)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{c.course_name}</h3>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{c.description || "No description"}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
                <div>
                  <Clock className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                  <b className="block text-sm text-slate-900">{c.duration_years} yrs</b>
                  {c.duration_years * 2} semesters
                </div>
                <div>
                  <Library className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                  <b className="block text-sm text-slate-900">{c.subjectCount}</b>
                  subjects
                </div>
                <div>
                  <Users className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                  <b className="block text-sm text-slate-900">{c.studentCount}</b>
                  students
                </div>
              </div>

              <Link href={`/admin/subjects?course=${c.id}`} className="btn-secondary mt-4 w-full">
                View subjects <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={BookOpen} title="No courses yet" message="Add a course such as BCA, BBA, B.Tech or MCA." />
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Edit course" : "Add course"}>
        {editing !== null && (
          <form
            key={editing.id ?? "new"}
            onSubmit={(e) => {
              e.preventDefault();
              run(saveCourse, new FormData(e.currentTarget), { onSuccess: () => setEditing(null) });
            }}
            className="space-y-4"
          >
            {editing.id && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Course name">
              <input name="course_name" className="input" required defaultValue={editing.course_name} placeholder="BCA" />
            </Field>
            <Field label="Duration (years)" hint="Each year has 2 semesters.">
              <select name="duration_years" className="input" defaultValue={editing.duration_years ?? 3}>
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>
                    {y} {y === 1 ? "year" : "years"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description (optional)">
              <textarea
                name="description"
                rows={3}
                className="input"
                defaultValue={editing.description}
                placeholder="Bachelor of Computer Applications"
              />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={pending}>
                Cancel
              </button>
              <button className="btn-primary" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing.id ? "Save changes" : "Add course"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        pending={pending}
        title="Delete course?"
        message={
          <>
            Delete <b>{deleting?.course_name}</b> and its {deleting?.subjectCount} subject(s)? Courses with enrolled students
            can&apos;t be deleted.
          </>
        }
        onConfirm={() => run(deleteCourse, deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
