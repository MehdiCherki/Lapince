import { useState, useCallback } from "react";
import { fetchOverview, fetchMonthlyStats } from "../services/statsApi";
import type { Overview, MonthlyEntry } from "../types/stats";

export function useStats() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monthly, setMonthly] = useState<MonthlyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ov, mo] = await Promise.all([
        fetchOverview(),
        fetchMonthlyStats(),
      ]);

      setOverview(ov);
      setMonthly(mo);
    } catch {
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    overview,
    monthly,
    loading,
    error,
    loadStats,
  };
}
