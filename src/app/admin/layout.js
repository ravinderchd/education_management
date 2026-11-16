import DashboardShell from "@/components/layout/DashboardShell";
import { requireRole, STAFF } from "@/lib/auth";

// Every page under /admin is for Admin and Faculty only.
// Students who try to open these pages are redirected to /student.
export default async function AdminLayout({ children }) {
  const { profile } = await requireRole(STAFF);
  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
