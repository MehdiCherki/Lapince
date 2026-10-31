import type { Transaction } from "@/types/transaction";
import type { CategoryType } from "@/types/category";
import { transactionLabel } from "@/lib/transaction";
import CategoryIcon from "@/components/ui/CategoryIcon";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function formatAmount(amount: number, type: CategoryType): string {
  const formatted = Math.abs(amount).toFixed(2).replace(".", ",");
  return type === "INCOME" ? `+${formatted}€` : `-${formatted}€`;
}

type TransactionLineProps = {
  transaction: Transaction;
  onUpdateRequest: (t: Transaction) => void;
  onDeleteRequest: (id: number) => void;
};

export default function TransactionLine({
  transaction,
  onUpdateRequest,
  onDeleteRequest,
}: TransactionLineProps) {
  const isRevenu = transaction.category.type === "INCOME";

  return (
    <div className="flex items-center gap-3 py-2 px-4 border-b border-white/10">
      <div
        className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white ${
          isRevenu ? "bg-[#74BAC2]" : "bg-[#BC8787]"
        }`}
      >
        <CategoryIcon name={transaction.category.icon} />
      </div>

      <p className="flex-1 text-sm font-medium truncate min-w-0">
        {transactionLabel(transaction)}
      </p>

      <span className="text-xs text-white/60 shrink-0 w-10 md:w-12 text-right">
        {formatDate(transaction.date)}
      </span>

      <span
        className={`text-sm font-bold shrink-0 w-16 md:w-24 text-right ${
          isRevenu ? "text-[#74BAC2]" : "text-[#BC8787]"
        }`}
      >
        {formatAmount(transaction.amount, transaction.category.type)}
      </span>

      <div className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2 shrink-0">
        <button
          onClick={() => onUpdateRequest(transaction)}
          className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          Modifier
        </button>

        <button
          onClick={() => onDeleteRequest(transaction.id)}
          className="text-sm md:text-[10px] px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-red-500 text-white hover:bg-red-600 transition leading-none"
        >
          <span className="md:hidden">−</span>
          <span className="hidden md:inline">Supprimer</span>
        </button>
      </div>
    </div>
  );
}
