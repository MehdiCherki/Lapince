import { useEffect, useId } from "react";
import type { Alert } from "@/types/alert";

type AlertPopupProps = {
  alert: Alert;
  onClose: () => void; // le parent decide quoi faire apres la fermeture
};

// Recoit 5.5 -> renvoie "5.50"

function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

// Accessibilité (RGAA, niveau AA du WCAG) :
// - la fenêtre ne bloque pas la page : c'est une alerte (role="alert"), annoncée aussitôt par les
//   lecteurs d'écran, et non une boîte de dialogue modale ;
// - texte marine #002b49 sur corail #FF6855 : contraste de 5,1:1 (au moins 4,5:1 exigé) ;
// - fermeture au clavier : touche Échap, ou bouton « Fermer » atteignable avec Tab.
export default function AlertPopup({ alert, onClose }: AlertPopupProps) {
  const titleId = useId();

  // Échap ferme l'alerte, où que soit le focus : la fenêtre ne bloque pas la page
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    //Overlay plein ecran non bloquant
    // pointer-events-none sur l'overlay -> l'user peut cliquer sur le reste de la page .
    // pointer-eventes-autot sur la carte -> la carte reste cliquable

    <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 px-4 pointer-events-none ">
      <div
        role="alert"
        aria-labelledby={titleId}
        onClick={onClose}
        className="
                bg-[#FF6855] rounded-2xl shadow-2xl
                px-8 py-6 w-full max-w-xs
                flex flex-col items-center gap-2
                pointer-events-auto cursor-pointer
                animate-slide-up
                "
      >
        {/**Icone cloche */}
        <img
          src="/WEBP/Icones/Lapince-alert-icon.webp"
          className="w-16 h-16 object-contain"
          alt=""
          aria-hidden="true"
        />
        {/** Titre */}
        <p
          id={titleId}
          className="text-[#002b49] font-black text-xl uppercase tracking-widest"
        >
          Alerte
        </p>
        {/** Corps */}
        <p className="text-[#002b49] text-sm">Dépassement de :</p>
        <p className="text-[#002b49] font-black text-3xl tracking-tight">
          {formatAmount(alert.exceededAmount)} €
        </p>
        <p className="text-[#002b49] text-lg font-semibold">
          dans la catégorie
        </p>

        <p className="text-[#002b49] font-black text-3xl tracking-tight text-center">
          {alert.category.name}
        </p>

        {/** Fermeture : un vrai bouton, atteignable au clavier, en plus du clic sur la carte */}
        <button
          type="button"
          aria-label="Fermer l'alerte"
          onClick={(event) => {
            event.stopPropagation(); // sinon le clic remonte aussi à la carte
            onClose();
          }}
          className="mt-2 rounded-full px-4 py-1 text-sm font-semibold text-[#002b49] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002b49]"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
