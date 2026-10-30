import { useState } from "react";
import CategorySelect from "./CategorySelect";
import { useCategories } from "@/hooks/useCategories";
import { createTransaction } from "@/services/transactionApi";

export default function RevenuCard({ onSuccess }: { onSuccess?: () => void }) {
  const categories = useCategories("INCOME");
  const [categorie, setCategorie] = useState("");
  const [transaction, setTransaction] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState("");
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  return (
    <div className="relative flex flex-col items-center">
      {!messageSuccess && (
        <div className="absolute top-1 md:top-4 z-30">
          <CategorySelect
            categories={categories}
            value={categorie}
            onChange={setCategorie}
          />
        </div>
      )}

      <div className="relative w-[250px] h-[250px] md:w-72 md:h-72 rounded-full bg-[#74BAC2] flex flex-col items-center justify-center gap-2 shadow-xl shrink-0 mt-4">
        {messageSuccess ? (
          <p className="text-[#002b49] font-black text-3xl text-center px-4 leading-tight whitespace-pre-line">
            {messageSuccess}
          </p>
        ) : (
          <>
            <p className="text-[#002b49] font-semibold text-base md:text-xl tracking-tight bg-white px-3 md:px-5 py-0.5 md:py-1 rounded-full">
              <span className="font-black">+</span> Revenu
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!transaction || !montant || !date || !categorie) {
                  setMessageError("Champs manquants !");
                  setTimeout(() => setMessageError(null), 3000);
                  return;
                }
                try {
                  await createTransaction({
                    amount: Math.abs(Number(montant)),
                    date: new Date(date).toISOString(),
                    description: transaction,
                    idcategory: Number(categorie),
                  });
                  setTransaction("");
                  setMontant("");
                  setDate("");
                  setCategorie("");
                  setMessageSuccess("✓ Revenu ajouté !");
                  onSuccess?.();
                  setTimeout(() => setMessageSuccess(null), 3000);
                } catch {
                  setMessageError("Erreur lors de l'ajout.");
                  setTimeout(() => setMessageError(null), 3000);
                }
              }}
              className="flex flex-col items-center gap-1.5 w-full px-5 md:px-10"
            >
              <input
                type="text"
                placeholder="Intitulé"
                value={transaction}
                onChange={(e) => setTransaction(e.target.value)}
                className="w-full h-6 md:h-8 rounded-full bg-white/70 text-xs md:text-sm px-3 outline-none placeholder:text-gray-500"
              />
              <div className="w-full flex items-center h-6 md:h-8 rounded-full bg-white/70 px-3 gap-1">
                <input
                  type="number"
                  placeholder="Montant"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="flex-1 bg-transparent text-xs md:text-sm outline-none placeholder:text-gray-500 min-w-0"
                />
                <span className="text-xs md:text-sm text-gray-500 shrink-0">
                  €
                </span>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-6 md:h-8 rounded-full bg-white/70 text-xs md:text-sm px-3 outline-none text-gray-500"
              />
              {messageError && (
                <p className="text-[#002b49] font-bold text-[10px] md:text-xs bg-white/80 px-2 py-0.5 rounded-full text-center">
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
