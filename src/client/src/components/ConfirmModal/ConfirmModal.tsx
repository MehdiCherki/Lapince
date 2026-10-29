import { useEffect, useState } from "react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'opération a échoué.");
      setBusy(false);
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]"
    >
      <div className="bg-white text-[#002b49] rounded-xl p-6 w-80 text-center shadow-xl">
        <p id="confirm-title" className="font-bold text-lg mb-4">
          {title}
        </p>
        <p id="confirm-message" className="text-sm opacity-70 mb-6">
          {message}
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-600 mb-4">
            {error}
          </p>
        )}
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg bg-gray-300 font-bold"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
