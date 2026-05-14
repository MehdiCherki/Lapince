import { useState } from "react";
import CategorySelect from "./CategorySelect";
import { useCategories } from "../../hooks/useCategories";
import { createBudget } from "../../services/budgetApi.js";

export default function BudgetCard() {
  const categories = useCategories("EXPENSE");
  const [categorie, setCategorie] = useState("");
  const [montant, setMontant] = useState("");
  const [mois, setMois] = useState("");
  const [messageError, setError] = useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const categoryId = parseInt(categorie);
    const amount = parseFloat(montant);

    if (!categoryId || isNaN(amount) || amount <= 0) {
      setError("Champs manquants !");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      await createBudget({
        limit_amount: amount,
        period: "monthly",
        id_category: categoryId,
      });
      setMontant("");
      setMois("");
      setCategorie("");
      setMessageSuccess("✓ Budget ajouté !");
      setTimeout(() => setMessageSuccess(null), 3000);
    } catch {
      setError("Impossible de créer le budget. Réessaie.");
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {!messageSuccess && (
        <div className="absolute top-1 md:top-4 z-30">
          <CategorySelect categories={categories} value={categorie} onChange={setCategorie} />
        </div>
      )}

      <div className="relative w-[220px] h-[220px] md:w-72 md:h-72 rounded-full bg-[#E06B56] flex flex-col items-center justify-center gap-2 shadow-xl shrink-0 mt-4">
        {messageSuccess ? (
          <p className="text-[#002341] font-black text-3xl text-center px-4 leading-tight whitespace-pre-line">
            {messageSuccess}
          </p>
        ) : (
          <>
            <p className="text-[#002341] font-semibold text-base md:text-xl tracking-tight mb-1 bg-white px-3 md:px-5 py-0.5 md:py-1 rounded-full flex items-center gap-1 md:gap-2">
              <img src="/WEBP/Icones/Lapince-budget.webp" className="w-4 h-4 md:w-5 md:h-5 object-contain" alt="" />
              Budget
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-1.5 w-full px-5 md:px-10">
              <div className="w-full flex items-center h-6 md:h-8 rounded-full bg-white/70 px-3 gap-1">
                <input
                  type="number"
                  placeholder="Montant"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="flex-1 bg-transparent text-xs md:text-sm outline-none placeholder:text-gray-500 min-w-0"
                />
                <span className="text-xs md:text-sm text-gray-500 shrink-0">€</span>
              </div>
              <input
                type="month"
                value={mois}
                onChange={(e) => setMois(e.target.value)}
                className="w-full h-6 md:h-8 rounded-full bg-white/70 text-xs md:text-sm px-3 outline-none text-gray-500"
              />
              {messageError && (
                <p className="text-[#002341] font-bold text-[10px] md:text-xs bg-white/80 px-2 py-0.5 rounded-full text-center">
                  ⚠ {messageError}
                </p>
              )}
              <button
                type="submit"
                className="mt-1 px-6 md:px-8 py-1.5 md:py-2 bg-white/50 hover:bg-white/80 text-[#002b49] text-sm md:text-base font-black uppercase rounded-full transition-all"
              >
                Ajouter
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
