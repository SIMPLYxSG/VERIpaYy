import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              confirmVariant === "danger" ? "bg-red-100 text-danger" : "bg-primary/15 text-primary"
            }`}
          >
            {confirmVariant === "danger" ? "⚠️" : "ℹ️"}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-background disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
              confirmVariant === "danger"
                ? "bg-danger hover:bg-red-700 disabled:opacity-50"
                : "bg-primary hover:bg-forest-600 disabled:opacity-50"
            }`}
          >
            {isLoading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
