"use client";

import { useRef, useState } from "react";
import { Send, Trash2, Loader2, Megaphone } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useServerAction } from "@/components/ui/useServerAction";
import { EmptyState, Field, Section } from "@/components/ui";
import AnnouncementItem from "@/components/AnnouncementItem";
import { createAnnouncement, deleteAnnouncement } from "./actions";

export default function AnnouncementsManager({ announcements, profile, today }) {
  const formRef = useRef(null);
  const [deleting, setDeleting] = useState(null);
  const { pending, run } = useServerAction();

  const canDelete = (a) => profile.role === "admin" || a.created_by === profile.id;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <Section title="Create announcement" className="h-fit">
        <form
          ref={formRef}
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(createAnnouncement, new FormData(e.currentTarget), { onSuccess: () => formRef.current?.reset() });
          }}
        >
          <Field label="Title">
            <input name="title" className="input" required maxLength={150} placeholder="Examination timetable announced" />
          </Field>
          <Field label="Description">
            <textarea name="description" rows={5} className="input" required placeholder="Write the details of the notice…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input name="date" type="date" className="input" required defaultValue={today} />
            </Field>
            <Field label="Audience">
              <select name="audience" className="input" defaultValue="all">
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="faculty">Faculty only</option>
              </select>
            </Field>
          </div>
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish announcement
          </button>
        </form>
      </Section>

      <Section title={`Published announcements (${announcements.length})`}>
        {announcements.length ? (
          <div className="divide-y divide-slate-100">
            {announcements.map((a) => (
              <div key={a.id} className="py-4 first:pt-0 last:pb-0">
                <AnnouncementItem
                  announcement={a}
                  action={
                    canDelete(a) && (
                      <button className="icon-btn -mt-1 hover:!text-red-600" title="Delete" onClick={() => setDeleting(a)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Megaphone} title="No announcements yet" message="Announcements you publish appear here." />
        )}
      </Section>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        pending={pending}
        title="Delete announcement?"
        message={<>Delete <b>{deleting?.title}</b>? Students will no longer see it.</>}
        onConfirm={() => run(deleteAnnouncement, deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
