"use client";

import { useTransition } from "react";
import { useToast } from "./Toast";

/**
 * Calls a Server Action, shows a success / error toast and tracks "pending".
 * Every Server Action in this project returns { ok, message } or { ok: false, error }.
 *
 *   const { pending, run } = useServerAction();
 *   run(createCourse, formData, { onSuccess: () => setOpen(false) });
 */
export function useServerAction() {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function run(action, input, { onSuccess } = {}) {
    startTransition(async () => {
      try {
        const result = await action(input);
        if (result?.ok) {
          if (result.message) toast.success(result.message);
          onSuccess?.(result);
        } else {
          toast.error(result?.error || "Something went wrong.");
        }
      } catch (err) {
        // redirect() inside an action is thrown as a special error – let Next.js handle it
        if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
        toast.error("Network or server error. Please try again.");
      }
    });
  }

  return { pending, run };
}
