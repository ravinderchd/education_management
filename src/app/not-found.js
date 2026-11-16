import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
        <GraduationCap className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you are looking for doesn&apos;t exist or was removed.</p>
      <Link href="/" className="btn-primary mt-6">
        Go to dashboard
      </Link>
    </div>
  );
}
