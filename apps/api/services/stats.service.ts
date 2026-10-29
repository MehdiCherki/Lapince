import { prisma } from "../lib/prisma.js";

/**
 * ---------------------------------------------------------
 * Service : Résumé global du tableau de bord
 * Route : GET /stats/overview
 *
 * Objectif :
 *  - Calculer le total des revenus (INCOME)
 *  - Calculer le total des dépenses (EXPENSE)
 *  - Calculer la balance nette (revenus - dépenses)
 *
 * Explication générale :
 *  Ce service récupère toutes les transactions de l'utilisateur,
 *  filtre celles qui sont des revenus, filtre celles qui sont des dépenses,
 *  puis calcule les totaux et la balance.
 * ---------------------------------------------------------
 */
export const getOverview = async (userId: number) => {
  /**
   * On récupère toutes les transactions de l'utilisateur.
   * include: { category: true } permet d'avoir aussi la catégorie associée
   * (INCOME ou EXPENSE).
   */
  const transactions = (await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
  })) as Array<{
    amount: any;
    category: { type: string };
  }>;

  /**
   * .filter(...) → garde uniquement les transactions dont la catégorie est INCOME
   * .reduce(...) → additionne tous les montants
   */
  const income = transactions
    .filter((t) => t.category.type === "INCOME")
    .reduce((sum: number, t) => sum + Number(t.amount), 0);

  /**
   * Même logique que ci-dessus, mais pour les dépenses (EXPENSE)
   */
  const expenses = transactions
    .filter((t) => t.category.type === "EXPENSE")
    .reduce((sum: number, t) => sum + Number(t.amount), 0);

  /**
   * On retourne un objet simple utilisé par le frontend
   */
  return {
    income,
    expenses,
    balance: income - expenses,
  };
};

/**
 * ---------------------------------------------------------
 * Service : Analyse mensuelle
 * Route : GET /stats/monthly
 *
 * Objectif :
 *  - Regrouper les transactions par mois (YYYY-MM)
 *  - Calculer les revenus et dépenses pour chaque mois
 *
 * Explication générale :
 *  On utilise une Map pour créer un tableau dynamique où chaque clé est un mois.
 *  Exemple :
 *    "2026-01" → { income: 500, expenses: 200 }
 * ---------------------------------------------------------
 */
export const getMonthlyStats = async (userId: number) => {
  /**
   * On récupère toutes les transactions avec leur catégorie.
   */
  const transactions = (await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
  })) as Array<{
    amount: any;
    date: Date;
    category: { type: string };
  }>;

  /**
   * Map = structure clé → valeur
   * Ici :
   *   clé = "2026-01"
   *   valeur = { income: 0, expenses: 0 }
   */
  const map = new Map<
    string,
    {
      income: number;
      expenses: number;
    }
  >();

  /**
   * On parcourt toutes les transactions
   */
  for (const t of transactions) {
    /**
     * On extrait le mois au format "YYYY-MM"
     * Exemple : "2026-01"
     */
    const month = t.date.toISOString().slice(0, 7);

    /**
     * Si ce mois n'existe pas encore dans la Map,
     * on l'initialise avec income = 0 et expenses = 0
     */
    if (!map.has(month)) {
      map.set(month, { income: 0, expenses: 0 });
    }

    /**
     * On récupère l'objet correspondant au mois
     */
    const entry = map.get(month)!;

    /**
     * On ajoute le montant dans income ou expenses selon le type
     */
    if (t.category.type === "INCOME") {
      entry.income += Number(t.amount);
    } else if (t.category.type === "EXPENSE") {
      entry.expenses += Number(t.amount);
    }
  }

  /**
   * On convertit la Map en tableau exploitable par le frontend.
   * .entries() → retourne [clé, valeur]
   * .sort(...) → trie les mois dans l'ordre chronologique
   * .map(...) → transforme chaque entrée en objet { month, income, expenses }
   */
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
    }));
};

/**
 * ---------------------------------------------------------
 * Service : Répartition par catégorie
 * Route : GET /stats/categories
 *
 * Objectif :
 *  - Calculer le total des dépenses par catégorie
 *
 * Explication générale :
 *  On utilise une Map pour regrouper les dépenses par nom de catégorie.
 *  Exemple :
 *    "Carburant" → 150
 *    "Courses" → 300
 * ---------------------------------------------------------
 */
export const getCategoryStats = async (userId: number) => {
  /**
   * On récupère toutes les transactions avec leur catégorie.
   */
  const transactions = (await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
  })) as Array<{
    amount: any;
    category: { type: string; name: string };
  }>;

  /**
   * Map : clé = nom de catégorie, valeur = total des dépenses
   */
  const map = new Map<string, number>();

  /**
   * On parcourt toutes les transactions
   */
  for (const t of transactions) {
    /**
     * On ignore les revenus, on ne garde que les dépenses
     */
    if (t.category.type !== "EXPENSE") continue;

    const name = t.category.name;

    /**
     * Si la catégorie n'existe pas encore dans la Map, on l'initialise à 0
     */
    if (!map.has(name)) {
      map.set(name, 0);
    }

    /**
     * On ajoute le montant à la catégorie correspondante
     */
    map.set(name, map.get(name)! + Number(t.amount));
  }

  /**
   * On convertit la Map en tableau exploitable par le frontend
   */
  return [...map.entries()].map(([category, total]) => ({
    category,
    total,
  }));
};

/**
 * ---------------------------------------------------------
 * Service : Suivi des budgets
 * Route : GET /stats/budgets
 *
 * Objectif :
 *  - Pour chaque budget :
 *      * récupérer la limite (limit_amount)
 *      * calculer le total dépensé
 *      * calculer le restant
 *      * calculer le pourcentage utilisé
 *
 * Explication générale :
 *  On récupère tous les budgets, puis toutes les transactions.
 *  Pour chaque budget, on calcule combien a été dépensé dans sa catégorie.
 * ---------------------------------------------------------
 */
export const getBudgetStats = async (userId: number) => {
  /**
   * On récupère tous les budgets de l'utilisateur
   */
  const budgets = (await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
  })) as Array<{
    id: number;
    id_category: number;
    limit_amount: any;
    category: { name: string };
  }>;

  /**
   * On récupère toutes les transactions de l'utilisateur
   */
  const transactions = (await prisma.transaction.findMany({
    where: { userId },
  })) as Array<{
    amount: any;
    categoryId: number;
  }>;

  /**
   * Pour chaque budget, on calcule les informations nécessaires
   */
  return budgets.map((b) => {
    /**
     * On filtre les transactions qui appartiennent à la catégorie du budget
     * puis on additionne les montants
     */
    const spent = transactions
      .filter((t) => t.categoryId === b.id_category)
      .reduce((sum: number, t) => sum + Number(t.amount), 0);

    /**
     * Calculs simples : limite, restant, pourcentage
     */
    const limit = Number(b.limit_amount);
    const remaining = limit - spent;
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    /**
     * On retourne un objet exploitable par le frontend
     */
    return {
      budgetId: b.id,
      category: b.category.name,
      limit,
      spent,
      remaining,
      percent,
    };
  });
};
