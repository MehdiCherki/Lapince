import { useEffect, useId, useRef } from "react";
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
// - boîte de dialogue non modale (la page reste utilisable), nommée par son titre et décrite par
//   son contenu, que les lecteurs d'écran annoncent quand le focus y arrive ;
// - à son apparition, le focus va sur « Fermer » : au clavier, on la ferme aussitôt (Entrée), sans
//   parcourir toute la page ; à sa fermeture, il revient d'où il venait (le bouton « Ajouter ») ;
// - Échap la ferme aussi ; elle s'affiche au-dessus de la barre et du pied de page ;
// - texte marine #002b49 sur corail #FF6855 : 5,1:1 ; bouton blanc sur marine : 14:1 (4,5:1 exigé).
export default function AlertPopup({ alert, onClose }: AlertPopupProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus sur « Fermer » à l'apparition, rendu à l'élément d'origine à la disparition
  useEffect(() => {
    const origin =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();
    return () => {
      if (origin?.isConnected) origin.focus();
    };
  }, []);

  // Échap ferme l'alerte, où que soit le focus : la fenêtre ne bloque pas la page
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    //Overlay plein ecran non bloquant, au-dessus de la barre des transactions et du pied de page
    // pointer-events-none sur l'overlay -> l'user peut cliquer sur le reste de la page .
    // pointer-eventes-autot sur la carte -> la carte reste cliquable

    <div className="fixed inset-0 z-[70] flex items-end justify-center pb-24 px-4 pointer-events-none ">
      <div
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
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
        {/** Corps : la description de la boîte de dialogue */}
        <div id={descriptionId} className="flex flex-col items-center gap-2">
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
        </div>

        {/** Fermeture : un vrai bouton, qui reçoit le focus à l'apparition. Contour affiché dès qu'il a
            le focus (focus:, pas focus-visible:) : donné par le code après un clic sur « Ajouter »,
            le focus ne serait pas montré par les navigateurs, et Tab le ferait quitter sans le voir */}
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Fermer l'alerte"
          onClick={(event) => {
            event.stopPropagation(); // sinon le clic remonte aussi à la carte
            onClose();
          }}
          className="mt-3 rounded-full bg-[#002b49] px-6 py-2 text-sm font-bold text-white outline-none focus:outline-3 focus:outline-offset-3 focus:outline-solid focus:outline-[#002b49]"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
