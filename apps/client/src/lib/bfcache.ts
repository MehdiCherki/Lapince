// Une page restaurée depuis le cache « précédent/suivant » du navigateur (bfcache) est une copie figée :
// notre code ne s'est pas réexécuté, la session n'a pas été revérifiée. Après une déconnexion,
// « Précédent » pourrait donc réafficher un écran privé (budgets, transactions) sur un ordinateur partagé.
// On recharge : la vérification de session au démarrage (AuthProvider) renvoie alors vers l'accueil public.
export function reloadIfRestoredFromCache(
  event: Pick<PageTransitionEvent, "persisted">,
  reload: () => void = () => window.location.reload(),
): void {
  if (event.persisted) reload();
}
