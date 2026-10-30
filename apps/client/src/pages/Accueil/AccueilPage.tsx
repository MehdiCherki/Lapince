import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchTransactions,
  type Transaction,
} from "@/services/transactionApi";

import Footer from "@/components/layout/Footer";
import { AnimatedOrbBackground } from "@/components/ui/AnimatedOrbBackground";
import DepenseCard from "./components/DepenseCard";
import RevenuCard from "./components/RevenuCard";
import BudgetCard from "./components/BudgetCard";
import TransactionSheet from "./components/TransactionSheet";
import AlertPopup from "@/components/alerts/AlertPopup";
import { useAlerts } from "@/hooks/useAlerts";
import { fetchOverview } from "@/services/statsApi";
import type { Overview } from "@/types/stats";
import { useTransactions } from "@/hooks/useTransactions";

export default function AccueilPage() {
  const { currentAlert, handleCloseAlert, loadAlerts } = useAlerts();
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const { remove, update, error: transactionError } = useTransactions();

  type ConfirmData =
    | { action: "delete"; payload: number }
    | { action: "update"; payload: Transaction }
    | null;

  const [confirmData, setConfirmData] = useState<ConfirmData>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const load = useCallback(async () => {
    const [trans, ov] = await Promise.all([
      fetchTransactions(),
      fetchOverview(),
      loadAlerts(),
    ]);
    setTransactions(trans.data);
    setOverview(ov);
  }, [loadAlerts]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
    });
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const transactionsSorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transactions],
  );

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
      <img
        src="/WEBP/Mobile/Lapince-Logo-Mobile.webp"
        className="absolute top-3 left-4 w-20 z-50 md:hidden"
        alt="Logo Mobile"
      />
      <img
        src="/WEBP/Desktop/Lapince-Logo-Desktop.webp"
        className="absolute top-3 left-10 w-16 lg:w-24 z-50 transition-all hidden md:block"
        alt="Logo"
      />

      <div
        className="absolute inset-0 bg-white/30 z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Header fixe mobile — hors du masque, toujours visible */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[45] flex flex-col items-center pt-28 pb-4 pointer-events-none">
        <h1 className="text-[50px] font-black uppercase leading-none tracking-tighter">
          Accueil
        </h1>
        <p className="text-base font-bold mt-1">Mon compte</p>
        <p className="text-sm opacity-60 mt-0.5 capitalize">
          {new Date().toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="mt-4 leading-none">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60 align-bottom">
            Solde *&nbsp;
          </span>
          <span className="text-4xl font-black tracking-tight">
            {" "}
            {overview
              ? overview.balance.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })
              : "…"}
          </span>
        </p>
      </div>

      <div className="relative z-40 flex flex-col h-full overflow-y-auto scrollbar-hide pb-40 [mask-image:linear-gradient(to_bottom,transparent_0px,transparent_280px,black_320px)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,transparent_280px,black_320px)] md:[mask-image:none] md:[-webkit-mask-image:none]">
        <header className="hidden md:flex flex-col items-center pt-10 pb-4 shrink-0">
          <h1 className="md:text-[50px] lg:text-[60px] font-black uppercase leading-none tracking-tighter">
            Accueil
          </h1>
          <p className="text-base font-bold mt-1">Mon compte</p>
          <p className="text-sm opacity-60 mt-0.5 capitalize">
            {new Date().toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="mt-4 leading-none">
            <span className="text-xs font-bold uppercase tracking-widest opacity-60 align-bottom">
              Solde *&nbsp;
            </span>
            <span className="text-4xl font-black tracking-tight">
              {" "}
              {overview
                ? overview.balance.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })
                : "…"}
            </span>
          </p>
        </header>

        <div className="md:hidden h-[320px] shrink-0" />
        <section className="relative md:flex-1 flex items-center justify-center">
          <div className="hidden md:block relative w-full max-w-4xl h-96 mt-[140px]">
            <div className="absolute bottom-60 left-12">
              <RevenuCard onSuccess={load} />
            </div>
            <div className="absolute bottom-60 right-12">
              <DepenseCard onSuccess={load} />
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <BudgetCard onSuccess={load} />
            </div>
          </div>

          <div className="flex md:hidden flex-col items-center gap-2 w-full px-2">
            <div className="flex flex-col min-[450px]:flex-row gap-2 justify-center items-center w-full">
              <RevenuCard onSuccess={load} />
              <DepenseCard onSuccess={load} />
            </div>
            <BudgetCard onSuccess={load} />
          </div>
        </section>
      </div>

      {currentAlert && (
        <AlertPopup
          key={currentAlert.id}
          // key change → React démonte/remonte AlertPopup → l'animation rejoue pour chaque alerte
          alert={currentAlert}
          onClose={handleCloseAlert}
        />
      )}
      {transactionError && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold"
        >
          {transactionError}
        </div>
      )}

      <TransactionSheet
        transactions={transactionsSorted}
        footerHeight={footerHeight}
        onDeleteRequest={(id) =>
          setConfirmData({ action: "delete", payload: id })
        }
        onUpdateRequest={(t) => setEditingTransaction(t)}
      />

      {confirmData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-xl p-6 w-80 text-center shadow-xl">
            <p className="font-bold text-lg mb-4">Êtes-vous sûr ?</p>

            <p className="text-sm opacity-70 mb-6">
              {confirmData.action === "delete"
                ? "Voulez-vous vraiment supprimer cette transaction ?"
                : "Voulez-vous enregistrer les modifications ?"}
            </p>

            <div className="flex justify-between gap-3">
              <button
                className="flex-1 py-2 rounded-lg bg-gray-300 font-bold"
                onClick={() => setConfirmData(null)}
              >
                Annuler
              </button>

              <button
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold"
                onClick={async () => {
                  try {
                    if (confirmData.action === "delete") {
                      await remove(confirmData.payload);
                    } else if (confirmData.action === "update") {
                      await update(confirmData.payload);
                    }
                    await load(); // inclut déjà loadAlerts()
                  } finally {
                    setConfirmData(null);
                  }
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTransaction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-white text-[#002b49] p-6 rounded-2xl w-[90%] max-w-[350px] shadow-xl">
            <h2 className="text-lg font-bold mb-4">Modifier la transaction</h2>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmData({
                  action: "update",
                  payload: editingTransaction,
                });
                setEditingTransaction(null);
              }}
            >
              <input
                type="text"
                defaultValue={editingTransaction.description ?? ""}
                onChange={(e) =>
                  setEditingTransaction((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev,
                  )
                }
                className="w-full px-3 py-2 rounded bg-gray-100"
                placeholder="Description"
              />

              <input
                type="number"
                defaultValue={editingTransaction.amount}
                onChange={(e) =>
                  setEditingTransaction((prev) =>
                    prev ? { ...prev, amount: Number(e.target.value) } : prev,
                  )
                }
                className="w-full px-3 py-2 rounded bg-gray-100"
                placeholder="Montant"
              />

              <button
                type="button"
                onClick={() => {
                  setConfirmData({
                    action: "update",
                    payload: editingTransaction,
                  });
                  setEditingTransaction(null);
                }}
                className="w-full bg-[#002b49] text-white py-2 rounded font-bold"
              >
                Enregistrer
              </button>

              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="w-full bg-gray-300 text-[#002b49] py-2 rounded font-bold mt-2"
              >
                Annuler
              </button>
            </form>
          </div>
        </div>
      )}

      <footer
        ref={footerRef}
        className="absolute bottom-0 left-0 w-full z-[60]"
      >
        <Footer
          showIcons
          activeIds={["dashboard", "mentions-legales", "params"]}
        />
      </footer>
    </main>
  );
}
