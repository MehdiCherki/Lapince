import { useState, useMemo, useEffect } from "react";
import type { Transaction } from "@/types/transaction";
import type { CategoryType } from "@/types/category";

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterType: "ALL" | CategoryType;
  onFilterTypeChange: (val: "ALL" | CategoryType) => void;
  selectedMonth: string;
  onMonthChange: (val: string) => void;
  selectedCategories: number[];
  onCategoryToggle: (id: number) => void;
  onResetCategories: () => void;
  transactions: Transaction[];
}

export function TransactionFilters({
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  selectedMonth,
  onMonthChange,
  selectedCategories,
  onCategoryToggle,
  onResetCategories,
  transactions,
}: TransactionFiltersProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const availableCategories = useMemo(() => {
    if (!transactions) return [];
    const cats = new Map<number, Transaction["category"]>();
    transactions.forEach((t) => cats.set(t.category.id, t.category));
    return Array.from(cats.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [transactions]);

  const types = [
    { value: "ALL", label: "Tous" },
    { value: "INCOME", label: "Revenus" },
    { value: "EXPENSE", label: "Dépenses" },
  ] as const;

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    if (!isMenuOpen) return;
    const hanfleClickOutside = () => {
      setIsMenuOpen(false);
    };

    // On utilise un timeout pour éviter de fermer immédiatement après l'ouverture
    const timer = setTimeout(() => {
      document.addEventListener("click", hanfleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", hanfleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="p-4 md:p-6 border-b border-white/20 bg-white/10 space-y-4">
      {/* Header : Titre */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tight">
          Détails des opérations
        </h3>

        {/* Grille de contrôles responsive */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto justify-start md:justify-end">
          {/* Recherche libre : Pleine largeur sur petit mobile, fixe ensuite */}
          <div className="w-full sm:w-48 order-1 sm:order-none">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full sm:w-48 px-5 py-2.5 rounded-full bg-white/50 border border-white/20 text-base font-bold focus:outline-none focus:bg-white/80 transition-all shadow-sm"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filtre par type : Groupe de boutons compact */}
          <div className="flex bg-white/20 p-1 rounded-full border border-white/10">
            {types.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onFilterTypeChange(value)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-black uppercase transition-all ${
                  filterType === value
                    ? "bg-[#002b49] text-white shadow-md"
                    : "text-[#002b49] hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Bouton catégories : Menu déroulant - FIX: flex-none ajouté */}
          <div className="relative flex-none">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`px-3 py-1 rounded-full border text-sm md:text-base font-bold transition-all shadow-sm min-w-[90px] ${
                selectedCategories.length > 0
                  ? "bg-[#8B4D0A] text-white border-[#8B4D0A]"
                  : "bg-[#BF6A12] text-white border-[#BF6A12]"
              }`}
            >
              Catégories{" "}
              {selectedCategories.length > 0 &&
                `(${selectedCategories.length})`}
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()} // Empêche le clic de remonter jusqu'à window
                className="absolute top-full mt-2 right-0 w-64 bg-white border border-gray-200 shadow-2xl rounded-2xl p-2 z-[999] pointer-events-auto"
                style={{
                  position: "absolute",
                  left: "auto",
                  margin: 0,
                }}
              >
                <div className="flex justify-between items-center p-2 border-b border-gray-100 mb-2">
                  <span className="text-[10px] font-black uppercase opacity-50">
                    Filtrer par catégorie
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Empêche la fermeture accidentelle
                      onResetCategories();
                    }}
                    className="text-[10px] text-red-500 font-bold uppercase hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto scrollbar-hide">
                  {availableCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => onCategoryToggle(cat.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#002b49] focus:ring-[#002b49]"
                      />
                      <span className="text-sm font-medium text-[#002b49]">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sélecteur de mois */}
          <input
            type="month"
            className="bg-white/30 px-4 py-2 md:py-2.5 rounded-full border border-white/20 text-xs md:text-sm font-bold text-[#002b49] outline-none cursor-pointer shadow-sm w-full sm:w-auto"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
