import DashboardShell from "@/components/layout/DashboardShell";
import { requireRole, STUDENT } from "@/lib/auth";

// Every page under /student is for students only.
export default async function StudentLayout({ children }) {
  const { profile } = await requireRole(STUDENT);
  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
