import { useState, useCallback } from "react";
import {
  fetchTransactions,
  deleteTransactionApi,
  updateTransactionApi,
} from "../services/transactionApi";
import type { Transaction } from "../types/transaction";

export function useTransactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTransactions();
      return res.data;
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des transactions");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteTransactionApi(id);
      return true;
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la suppression");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (t: Transaction) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateTransactionApi(t);
      return updated;
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la mise à jour");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    load,
    remove,
    update,
    loading,
    error,
  };
}
