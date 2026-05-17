import type { Overview } from "../../../types/stats";

interface StatsCardsProps {
  stats: Overview;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl border border-white/40">
        <p className="text-sm font-black uppercase italic opacity-70 mb-1">Total Revenus</p>
        <p className="text-3xl font-black text-green-600">
          +{stats.income.toLocaleString()} €
        </p>
      </div>

      <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl border border-white/40">
        <p className="text-sm font-black uppercase italic opacity-70 mb-1">Total Dépenses</p>
        <p className="text-3xl font-black text-red-600">
          -{stats.expenses.toLocaleString()} €
        </p>
      </div>

      <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl border border-white/40">
        <p className="text-sm font-black uppercase italic opacity-70 mb-1">Balance Nette</p>
        <p className={`text-3xl font-black ${stats.balance >= 0 ? "text-[#002b49]" : "text-red-600"}`}>
          {stats.balance.toLocaleString()} €
        </p>
      </div>

    </div>
  );
}
