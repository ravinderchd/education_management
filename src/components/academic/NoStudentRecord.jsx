import { UserX } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function NoStudentRecord() {
  return (
    <div className="card">
      <EmptyState
        icon={UserX}
        title="Student record not found"
        message="Your login works, but no student record is linked to it yet. Please contact the administrator."
      />
    </div>
  );
}
