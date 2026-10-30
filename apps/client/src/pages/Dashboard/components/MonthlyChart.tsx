import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/**
 * Interface pour les données du graphique mensuel.
 * Attend un tableau d'objets avec : nom du mois, total revenus, total dépenses.
 */
interface MonthlyChartProps {
  data: {
    month: string;
    income: number;
    expenses: number;
  }[];
}

/**
 * Composant MonthlyChart : Visualisation graphique des flux financiers.
 * Utilise la bibliothèque Recharts pour un rendu responsive et interactif.
 */
export function MonthlyChart({ data }: MonthlyChartProps) {
  // "2026-01" → "janv." via l'API Intl du navigateur
  function formatMonth(val: string) {
    const [year, month] = val.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleString("fr-FR", {
      month: "short",
    });
  }

  return (
    <section className="bg-white/50 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/50">
      <header className="mb-8 text-center md:text-left">
        <h3 className="text-xl font-black italic uppercase">
          Analyse Mensuelle
        </h3>
        <p className="text-xs font-bold opacity-60">
          Visualisation des Revenus et des Dépenses par mois
        </p>
      </header>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(0,43,73,0.1)"
            />

            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#002b49", fontWeight: "bold", fontSize: 12 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#002b49", fontWeight: "bold", fontSize: 12 }}
            />

            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.2)" }}
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: "15px",
                border: "none",
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            />

            <ReferenceLine y={0} stroke="#002b49" strokeOpacity={0.2} />

            {/* name= sert à l'infobulle : sans ça, elle afficherait "income" et "expenses" en anglais */}
            <Bar
              dataKey="income"
              name="Revenus"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="expenses"
              name="Dépenses"
              fill="#ef4444"
              radius={[0, 0, 6, 6]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
