"use client";

import { AlertTriangle } from "lucide-react";

/** Shown by error.js when a page throws (e.g. Supabase is unreachable). */
export default function ErrorView({ error, reset }) {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500">
        {error?.message || "The page could not be loaded. Check your connection and try again."}
      </p>
      <button className="btn-primary mt-6" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
