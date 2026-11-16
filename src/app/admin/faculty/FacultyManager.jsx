"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, UserSquare2, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useServerAction } from "@/components/ui/useServerAction";
import { Avatar, EmptyState, Field } from "@/components/ui";
import { saveFaculty, deleteFaculty } from "./actions";

export default function FacultyManager({ faculty }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { pending, run } = useServerAction();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faculty.filter(
      (f) =>
        !q ||
        f.profile?.name.toLowerCase().includes(q) ||
        f.profile?.email.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q)
    );
  }, [faculty, query]);

  return (
    <div className="card">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, email or department…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> Add Faculty
        </button>
      </div>

      {filtered.length ? (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th className="hidden md:table-cell">Phone</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={f.profile?.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{f.profile?.name}</p>
                        <p className="truncate text-xs text-slate-500">{f.profile?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{f.department}</td>
                  <td>{f.designation}</td>
                  <td className="hidden md:table-cell">{f.phone || "-"}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="icon-btn" title="Edit" onClick={() => setEditing(f)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="icon-btn hover:!text-red-600" title="Delete" onClick={() => setDeleting(f)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={UserSquare2}
          title={faculty.length ? "No matching faculty" : "No faculty yet"}
          message={faculty.length ? "Try a different search." : "Add your first faculty member."}
        />
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit faculty member" : "Add faculty member"}
        description={editing?.id ? undefined : "A login account is created with the Faculty role."}
        size="lg"
      >
        {editing !== null && (
          <form
            key={editing.id ?? "new"}
            onSubmit={(e) => {
              e.preventDefault();
              run(saveFaculty, new FormData(e.currentTarget), { onSuccess: () => setEditing(null) });
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {editing.id && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Full name" className="sm:col-span-2">
              <input name="name" className="input" required defaultValue={editing.profile?.name} placeholder="Dr. Anil Mehta" />
            </Field>
            <Field label="Email (used to log in)">
              <input name="email" type="email" className="input" required defaultValue={editing.profile?.email} />
            </Field>
            <Field label={editing.id ? "New password (optional)" : "Password"}>
              <input
                name="password"
                type="password"
                className="input"
                required={!editing.id}
                minLength={6}
                placeholder={editing.id ? "Leave blank to keep" : "At least 6 characters"}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Department">
              <input name="department" className="input" required defaultValue={editing.department} placeholder="Computer Science" />
            </Field>
            <Field label="Designation">
              <input name="designation" className="input" required defaultValue={editing.designation} placeholder="Assistant Professor" />
            </Field>
            <Field label="Phone" className="sm:col-span-2">
              <input name="phone" className="input" defaultValue={editing.phone} placeholder="9876543210" />
            </Field>
            <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={pending}>
                Cancel
              </button>
              <button className="btn-primary" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing.id ? "Save changes" : "Add faculty"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        pending={pending}
        title="Delete faculty member?"
        message={
          <>
            This permanently deletes <b>{deleting?.profile?.name}</b> and their login account. Attendance and marks they
            entered are kept.
          </>
        }
        onConfirm={() => run(deleteFaculty, deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
