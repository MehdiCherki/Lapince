import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTransactions, type Transaction } from "../../services/transactionApi";
import { fetchBudgets } from "../../services/budgetApi";
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

export default function DashboardPage() {
  const { currentAlert, handleCloseAlert } = useAlerts();
  const { overview, monthly, loadStats } = useStats();
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const {
    search, setSearch,
    filterType, setFilterType,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedCategories,
    toggleCategory,
    resetCategories,
    filteredTransactions,
    displayMonthlyData,
    displayOverview,
  } = useDashboardFilters(transactions, monthly, overview);

  const loadData = useCallback(async () => {
    const [trans, budg] = await Promise.all([fetchTransactions(), fetchBudgets()]);
    setTransactions(trans.data);
    setBudgets(budg);
    await loadStats();
  }, [loadStats]);

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
      <div className="absolute inset-0 bg-white/30 z-20 pointer-events-none" aria-hidden="true" />

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

      <div
        className="relative z-40 flex flex-col h-full overflow-y-auto scrollbar-hide"
        style={{ paddingBottom: footerHeight + 40 }}
      >
        <header className="flex flex-col items-center pt-30 md:pt-10 pb-8 shrink-0">
          <h1 className="text-[35px] md:text-[50px] lg:text-[60px] font-black uppercase leading-none tracking-tighter">
            Tableau de bord
          </h1>
          <p className="text-base font-bold mt-1 opacity-80">
            Analyse de vos flux financiers
          </p>
        </header>

        <div className="max-w-6xl mx-auto w-full px-6 space-y-8">
          {displayOverview && <StatsCards stats={displayOverview} />}
          {displayMonthlyData.length > 0 && <MonthlyChart data={displayMonthlyData} />}
          {budgets.length > 0 && <BudgetHistory budgets={budgets} />}

          <section className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/40 mb-10">
            <TransactionFilters
              search={search}
              onSearchChange={setSearch}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              selectedCategories={selectedCategories}
              onCategoryToggle={toggleCategory}
              onResetCategories={resetCategories}
              transactions={transactions}
            />
            <TransactionTable transactions={filteredTransactions} />
          </section>
        </div>
      </div>

      {currentAlert && (
        <AlertPopup
          key={currentAlert.id}
          alert={currentAlert}
          onClose={handleCloseAlert}
        />
      )}

      <footer ref={footerRef} className="absolute bottom-0 left-0 w-full z-[60]">
        <Footer showIcons activeIds={["transactions", "mentions-legales", "params"]} />
      </footer>
    </main>
  );
}
