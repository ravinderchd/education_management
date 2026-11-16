import { Megaphone } from "lucide-react";
import { getMyStudent } from "@/lib/student";
import { PageHeader, Section, EmptyState } from "@/components/ui";
import AnnouncementItem from "@/components/AnnouncementItem";

export const metadata = { title: "Announcements" };

// Students can read announcements but not create or delete them.
export default async function StudentAnnouncements() {
  const { supabase } = await getMyStudent();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Announcements" subtitle="Notices from your college" />
      <Section>
        {announcements?.length ? (
          <div className="divide-y divide-slate-100">
            {announcements.map((a) => (
              <div key={a.id} className="py-4 first:pt-0 last:pb-0">
                <AnnouncementItem announcement={a} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Megaphone} title="No announcements yet" />
        )}
      </Section>
    </>
  );
}
