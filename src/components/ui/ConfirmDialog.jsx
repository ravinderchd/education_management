"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "./Modal";

/** "Are you sure?" dialog used before deleting records. */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  pending = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={pending}>
          Cancel
        </button>
        <button className="btn-danger" onClick={onConfirm} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
