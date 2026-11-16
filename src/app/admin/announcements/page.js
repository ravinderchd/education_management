import { requireRole, STAFF } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/format";
import AnnouncementsManager from "./AnnouncementsManager";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const { supabase, profile } = await requireRole(STAFF);

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*, author:profiles(name)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Announcements" subtitle="Publish notices for students and staff" />
      <AnnouncementsManager announcements={announcements} profile={profile} today={todayISO()} />
    </>
  );
}
