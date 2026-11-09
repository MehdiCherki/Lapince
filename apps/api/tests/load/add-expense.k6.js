// Test de charge (k6), en local seulement, en deux scénarios successifs de 50 utilisateurs virtuels :
// 1. meme_categorie : tous ajoutent des dépenses sur la MÊME catégorie, au budget dépassé. Pire cas
//    pour le verrou par utilisateur et par catégorie : les écritures passent l'une après l'autre,
//    par conception. Mesure l'exactitude (une seule alerte, au centime) ; latence rapportée sans seuil.
// 2. categories_differentes : chacun sur sa catégorie. Les verrous ne se gênent plus : seuil de
//    latence de l'usage courant.
import http from "k6/http";
import { check, fail } from "k6";

const BASE = __ENV.BASE_URL;
const LIMIT = 10; // budget mensuel de 10 €
const AMOUNT = 1; // chaque dépense : 1 €

const stages = [
  { duration: "15s", target: 50 },
  { duration: "45s", target: 50 },
  { duration: "10s", target: 0 },
];

export const options = {
  scenarios: {
    meme_categorie: {
      executor: "ramping-vus",
      startVUs: 0,
      stages,
      gracefulRampDown: "5s",
      env: { MODE: "meme" },
    },
    categories_differentes: {
      executor: "ramping-vus",
      startVUs: 0,
      stages,
      gracefulRampDown: "5s",
      startTime: "80s",
      env: { MODE: "differentes" },
    },
  },
  // Seuils : moins de 1 % d'erreurs et contrôles tous verts partout ; 95 % des ajouts en moins de
  // 500 ms dans l'usage courant (une personne n'ajoute pas 50 dépenses à la seconde)
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate==1"],
    "http_req_duration{scenario:meme_categorie}": ["p(95)>0"], // rapportée, sans seuil
    "http_req_duration{scenario:categories_differentes}": ["p(95)<500"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

// Une seule connexion pour tout le test (le limiteur en accepte 10 par quart d'heure) : les
// cookies de session sont recopiés dans l'en-tête Cookie de chaque requête (ils portent
// l'attribut Secure, que le réseau local en HTTP ne permettrait pas d'utiliser autrement)
function cookieHeader(res) {
  return Object.entries(res.cookies)
    .map(([name, values]) => `${name}=${values[0].value}`)
    .join("; ");
}

export function setup() {
  const login = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({
      email: __ENV.LOAD_EMAIL,
      password: __ENV.LOAD_PASSWORD,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
  if (login.status !== 204) fail(`connexion refusée : ${login.status}`);
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookieHeader(login),
  };

  const categories = http.get(`${BASE}/categories`, { headers }).json();
  const expenseIds = categories
    .filter((c) => c.type === "EXPENSE")
    .map((c) => c.id);
  const category = { id: expenseIds[0] };
  const budget = http.post(
    `${BASE}/budgets`,
    JSON.stringify({
      limit_amount: LIMIT,
      period: "monthly",
      id_category: category.id,
    }),
    { headers },
  );
  if (budget.status !== 201) fail(`budget refusé : ${budget.status}`);
  return { headers, categoryId: category.id, expenseIds };
}

export default function (data) {
  // meme_categorie : la catégorie au budget ; categories_differentes : une catégorie par
  // utilisateur virtuel, hors de celle du budget
  const idcategory =
    __ENV.MODE === "meme"
      ? data.categoryId
      : data.expenseIds[1 + (__VU % (data.expenseIds.length - 1))];
  const res = http.post(
    `${BASE}/transactions`,
    JSON.stringify({
      amount: AMOUNT,
      date: new Date().toISOString(),
      idcategory,
    }),
    { headers: data.headers, tags: { name: "POST /transactions" } },
  );
  check(res, { "dépense enregistrée (201)": (r) => r.status === 201 });
}

export function teardown(data) {
  const list = http
    .get(`${BASE}/transactions?idcategory=${data.categoryId}&limit=1`, {
      headers: data.headers,
    })
    .json();
  const alerts = http.get(`${BASE}/alerts`, { headers: data.headers }).json();
  const expected = (list.total * AMOUNT - LIMIT).toFixed(2);
  console.log(
    `dépenses enregistrées : ${list.total} ; alertes : ${alerts.length} ; ` +
      `dépassement : ${alerts[0] && alerts[0].exceededAmount} (attendu : ${expected})`,
  );
  check(alerts, {
    "une seule alerte pour la catégorie": (a) => a.length === 1,
    "dépassement exact au centime": (a) =>
      a.length === 1 && Number(a[0].exceededAmount).toFixed(2) === expected,
  });
}
