import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAllTransactions,
  type Transaction,
} from "../../services/transactionApi";
import { fetchBudgets, updateBudget, deleteBudget } from "../../services/budgetApi";
import type { Budget } from "../../types/budget";
import { useAlerts } from "../../hooks/useAlerts";
import { useStats } from "../../hooks/useStats";
import { useDashboardFilters } from "../../hooks/useDashboardFilters";

import Footer from "../../components/Footer/footer";
import { AnimatedOrbBackground } from "../../components/AnimatedOrbBackground/AnimatedOrbBackground";
import AlertPopup from "../../components/Alert/AlertPopup";
import { StatsCards } from "./components/StatsCards";
import { MonthlyChart } from "./components/MonthlyChart";
import { TransactionFilters } from "./components/TransactionFilters";
import { TransactionTable } from "./components/TransactionTable";
import BudgetHistory from "../../components/Budget/BudgetHistory";
import BudgetEditModal from "../../components/Budget/BudgetEditModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";


export default function DashboardPage() {
  const { currentAlert, handleCloseAlert, loadAlerts } = useAlerts();
  const { overview, monthly, loadStats } = useStats();
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
    // Budget dont la modale est ouverte (null = aucune modale)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);


  const {
    search,
    setSearch,
    filterType,
    setFilterType,
    selectedMonth,
    setSelectedMonth,
    selectedCategories,
    toggleCategory,
    resetCategories,
    filteredTransactions,
    displayMonthlyData,
    displayOverview,
  } = useDashboardFilters(transactions, monthly, overview);

  const loadData = useCallback(async () => {
    const [trans, budg] = await Promise.all([
      fetchAllTransactions(),
      fetchBudgets(),
    ]);
    setTransactions(trans);
    setBudgets(budg);
    await Promise.all([loadStats(), loadAlerts()]);
  }, [loadStats, loadAlerts]);
  
  // En cas d'erreur, l'exception remonte jusqu'à la modale, qui affiche le message
  const handleSaveBudget = async (limit: number) => {
    if (!editingBudget) return;
    await updateBudget(editingBudget.id, { limit_amount: limit });
    setEditingBudget(null);
    await loadData(); // tableau, stats et alertes à jour (l'API a recalculé l'alerte)
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;
    await deleteBudget(deletingBudget.id);
    setDeletingBudget(null);
    await loadData();
  };


  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
    });
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]">
      <AnimatedOrbBackground />

      <img
        src="/WEBP/Desktop/Lapince-Hero-Background-Desktop.webp"
        fetchPriority="high"
        className="absolute bottom-0 left-0 w-[55vw] opacity-60 object-contain origin-bottom-left z-0 pointer-events-none select-none hidden md:block"
        aria-hidden="true"
        alt=""
      />
      <div className="absolute bottom-0 right-[5%] z-10 pointer-events-none hidden lg:block">
        <img
          src="/WEBP/Desktop/Lapince-Hand-Desktop.webp"
          className="w-[24vw] h-auto object-contain"
          alt=""
        />
      </div>

      <img
        src="/WEBP/Mobile/Lapince-Hero-Background-Mobile.webp"
        fetchPriority="high"
        className="absolute bottom-0 left-0 w-screen opacity-70 z-0 pointer-events-none block md:hidden"
        alt=""
      />
      <div
        className="absolute inset-0 bg-white/30 z-20 pointer-events-none"
        aria-hidden="true"
      />

      <img
        src="/WEBP/Mobile/Lapince-Logo-Mobile.webp"
        className="absolute top-3 left-4 w-20 z-50 md:hidden"
        alt="Logo"
      />
      <img
        src="/WEBP/Desktop/Lapince-Logo-Desktop.webp"
        className="absolute top-3 left-10 w-16 lg:w-24 z-50 transition-all hidden md:block"
        alt="Logo"
      />
      {/* Header fixe mobile — hors du masque */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[45] flex flex-col items-center pt-28 pb-4 pointer-events-none">
        <h1 className="text-[50px] font-black uppercase leading-none tracking-tighter">
          Tableau de bord
        </h1>
        <p className="text-base font-bold mt-1 opacity-80">
          Analyse de vos flux financiers
        </p>
      </div>

      <div
        className="relative z-40 flex flex-col h-full overflow-y-auto scrollbar-hide
  [mask-image:linear-gradient(to_bottom,transparent_0px,transparent_200px,black_240px)]
  [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,transparent_200px,black_240px)]
  md:[mask-image:none] md:[-webkit-mask-image:none]"
        style={{ paddingBottom: footerHeight + 40 }}
      >
        <div className="md:hidden h-[250px] shrink-0" />
        <header className="hidden md:flex flex-col items-center pt-10 pb-8 shrink-0">
          <h1 className="md:text-[50px] lg:text-[60px] font-black uppercase leading-none tracking-tighter">
            Tableau de bord
          </h1>
          <p className="text-base font-bold mt-1 opacity-80">
            Analyse de vos flux financiers
          </p>
        </header>

        <div className="max-w-6xl mx-auto w-full px-6 space-y-8">
          {displayOverview && <StatsCards stats={displayOverview} />}
          {displayMonthlyData.length > 0 && (
            <MonthlyChart data={displayMonthlyData} />
          )}
          {budgets.length > 0 && (
            <BudgetHistory
              budgets={budgets}
              onEdit={setEditingBudget}
              onDelete={setDeletingBudget}
            />
          )}


          <section className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/40 mb-10">
            <TransactionFilters
              search={search}
              onSearchChange={setSearch}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              selectedCategories={selectedCategories}
              onCategoryToggle={toggleCategory}
              onResetCategories={resetCategories}
              transactions={transactions}
            />
            <TransactionTable transactions={filteredTransactions} />
          </section>
        </div>
      </div>

            {editingBudget && (
        <BudgetEditModal
          budget={editingBudget}
          onSave={handleSaveBudget}
          onCancel={() => setEditingBudget(null)}
        />
      )}

      {deletingBudget && (
        <ConfirmModal
          title={`Supprimer le budget ${deletingBudget.category.name} ?`}
          message="Son alerte éventuelle sera supprimée. Tes transactions ne sont pas touchées."
          confirmLabel="Supprimer"
          onConfirm={handleDeleteBudget}
          onCancel={() => setDeletingBudget(null)}
        />
      )}
      
      {currentAlert && (
        <AlertPopup
          key={currentAlert.id}
          alert={currentAlert}
          onClose={handleCloseAlert}
        />
      )}

      <footer
        ref={footerRef}
        className="absolute bottom-0 left-0 w-full z-[60]"
      >
        <Footer
          showIcons
          activeIds={["transactions", "mentions-legales", "params"]}
        />
      </footer>
    </main>
  );
}
