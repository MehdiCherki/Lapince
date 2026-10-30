import { useState, useCallback } from "react";
import { fetchAlerts, markAlertAsRead } from "@/services/alertApi";
import type { Alert } from "@/types/alert";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState<number | null>(
    null,
  );

  // useCallback [] : la référence est stable entre les renders.
  // Les composants peuvent l'inclure dans leurs deps de useEffect sans boucle infinie.
  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts();
      const unread = data.filter((a) => !a.isRead);
      // Toujours remplacer la liste : si plus aucune alerte, la popup doit disparaître
      setAlerts(unread);
      setCurrentAlertIndex(unread.length > 0 ? 0 : null);
    } catch {
      // les alertes sont non-critiques, on ne bloque pas le chargement
    }
  }, []);

  function handleCloseAlert() {
    if (currentAlertIndex === null) return;
    markAlertAsRead(alerts[currentAlertIndex].id).catch(console.error);
    const next = currentAlertIndex + 1;
    setCurrentAlertIndex(next < alerts.length ? next : null);
  }

  const currentAlert =
    currentAlertIndex !== null ? alerts[currentAlertIndex] : null;

  return { currentAlert, handleCloseAlert, loadAlerts };
}
