import type { Alert } from "@/types/alert";

type Props = {
  alert: Alert;
  onClose: () => void; // le parent decide quoi faire apres la fermeture
};

// Recoit 5.5 -> renvoie "5.50"

function formatAmount(amount: number | string): string {
  return Number(amount).toFixed(2).replace(".", ",");
}

export default function AlertPopup({ alert, onClose }: Props) {
  return (
    //Overlay plein ecran non bloquant
    // pointer-events-none sur l'overlay -> l'user peut cliquer sur le reste de la page .
    // pointer-eventes-autot sur la carte -> la carte reste cliquable

    <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 px-4 pointer-events-none ">
      <div
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
        <p className="text-white font-black text-xl uppercase tracking-widest">
          Alerte
        </p>
        {/** Corps */}
        <p className="text-white/90 text-sm">Dépassement de :</p>
        <p className="text-white font-black text-3xl tracking-tight">
          {formatAmount(alert.exceededAmount)} €
        </p>
        <p className="text-white/90 text-lg font-semibold">dans la catégorie</p>

        <p className="text-white font-black text-3xl tracking-tight text-center">
          {alert.category.name}
        </p>

        {/** Micro indication */}

        <p className="text-white/50 text-[10px] mt-2">Appuie pour fermer</p>
      </div>
    </div>
  );
}
