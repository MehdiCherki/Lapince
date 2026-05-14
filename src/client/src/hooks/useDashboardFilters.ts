import { useState, useMemo } from "react";
import type { Transaction } from "../services/transactionApi";
import type { MonthlyEntry, Overview } from "../types/stats";

export function useDashboardFilters(
  transactions: Transaction[],
  monthly: MonthlyEntry[],
  overview: Overview | null,
) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const isFiltered =
    !!search || filterType !== "ALL" || !!startDate || !!endDate || selectedCategories.length > 0;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = filterType === "ALL" || t.category.type === filterType;
      const matchesSearch =
        !search.trim() ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category.name.toLowerCase().includes(search.toLowerCase());
      const transactionDate = new Date(t.date).getTime();
      const matchesStart = !startDate || transactionDate >= new Date(startDate).getTime();
      const matchesEnd = !endDate || transactionDate <= new Date(endDate).getTime();
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(t.category.id);
      return matchesType && matchesSearch && matchesStart && matchesEnd && matchesCategory;
    });
  }, [transactions, search, filterType, startDate, endDate, selectedCategories]);

  const displayMonthlyData = useMemo((): MonthlyEntry[] => {
    if (!isFiltered) return monthly;

    const monthlyMap: Record<string, MonthlyEntry> = {};
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    sorted.forEach((t) => {
      const monthName = new Date(t.date).toLocaleString("fr-FR", { month: "short" });
      if (!monthlyMap[monthName]) {
        monthlyMap[monthName] = { month: monthName, income: 0, expenses: 0 };
      }
      const amount = Math.abs(Number(t.amount || 0));
      if (t.category.type === "INCOME") monthlyMap[monthName].income += amount;
      else monthlyMap[monthName].expenses += amount;
    });

    return Object.values(monthlyMap);
  }, [filteredTransactions, monthly, isFiltered]);

  const displayOverview = useMemo((): Overview | null => {
    if (!isFiltered) return overview;

    const income = filteredTransactions
      .filter((t) => t.category.type === "INCOME")
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const expenses = filteredTransactions
      .filter((t) => t.category.type === "EXPENSE")
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions, overview, isFiltered]);

  return {
    search, setSearch,
    filterType, setFilterType,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedCategories,
    toggleCategory,
    resetCategories: () => setSelectedCategories([]),
    filteredTransactions,
    displayMonthlyData,
    displayOverview,
  };
}
