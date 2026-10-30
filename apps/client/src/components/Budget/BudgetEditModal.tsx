import { useEffect, useState } from "react";
import type { Budget } from "@/types/budget";

interface BudgetEditModalProps {
  budget: Budget;
  onSave: (limit: number) => Promise<void>;
  onCancel: () => void;
}

export default function BudgetEditModal({
  budget,
  onSave,
  onCancel,
}: BudgetEditModalProps) {
  // Texte et non nombre : l'utilisateur doit pouvoir vider le champ pendant qu'il tape
  const [limit, setLimit] = useState(String(budget.limit_amount));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Échap ferme la modale (réflexe clavier attendu)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(limit);
    if (!Number.isFinite(value) || value <= 0) {
      setError("La limite doit être un montant positif.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(value);
      // Succès : le parent ferme la modale, rien d'autre à faire ici
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le budget.",
      );
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-edit-title"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]"
    >
      <div className="bg-white text-[#002b49] p-6 rounded-2xl w-[90%] max-w-[350px] shadow-xl">
        <h2 id="budget-edit-title" className="text-lg font-bold">
          Modifier le budget
        </h2>
        <p className="text-sm opacity-70 mb-4">{budget.category.name}</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <label htmlFor="budget-limit" className="block text-sm font-bold">
            Limite (€)
          </label>
          <input
            id="budget-limit"
            type="number"
            min="0.01"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-100"
            autoFocus
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#002b49] text-white py-2 rounded font-bold disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-gray-300 text-[#002b49] py-2 rounded font-bold"
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
}
