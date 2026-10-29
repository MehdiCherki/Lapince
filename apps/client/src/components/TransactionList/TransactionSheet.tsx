import { useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import type { Transaction } from "../../types/transaction.js";
import TransactionLine from "./TransactionLine.js";

// La hauteur visible quand le panneau est "fermé"
// Si modification, ajuster cette constante
const HANDLE_HEIGHT = 56;

type Props = {
  transactions: Transaction[];
  footerHeight: number;
  onDeleteRequest: (id: number) => void;
  onUpdateRequest: (t: Transaction) => void;
};

export default function TransactionSheet({
  transactions,
  footerHeight,
  onDeleteRequest,
  onUpdateRequest,
}: Props) {
  const COLLAPSED_HEIGHT = footerHeight + HANDLE_HEIGHT;

  // --- ÉTATS (States) ---
  // Gère l'ouverture du panneau (vrai = ouvert, faux = réduit)
  const [isOpen, setIsOpen] = useState(false);

  // useRef : On utilise des refs pour le drag-and-drop car changer un state
  // à chaque pixel déplacé ferait ramer l'application (trop de re-renders).
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false); // Distingue un simple clic d'un glissement réel

  // --- GESTION DU GLISSEMENT (DRAG) ---
  // Ces fonctions calculent si le doigt/souris monte ou descend pour ouvrir/fermer le panneau.

  function onDragStart(clientY: number) {
    dragStartY.current = clientY;
    isDragging.current = false;
  }

  function onDragMove(clientY: number) {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - clientY;
    if (Math.abs(delta) > 5) isDragging.current = true;
  }

  function onDragEnd(clientY: number) {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - clientY;

    if (!isDragging.current) {
      // Si pas de mouvement, c'est un clic -> on inverse l'état ouvert/fermé
      setIsOpen((prev) => !prev);
    } else if (delta > 40) {
      setIsOpen(true); // Tiré vers le haut
    } else if (delta < -40) {
      setIsOpen(false); // Tiré vers le bas
    }
    dragStartY.current = null;
    isDragging.current = false;
  }

  return (
    <div
      style={{
        height: "85vh",
        // On déplace le panneau vers le bas de (85vh - hauteur visible) quand il est fermé
        transform: isOpen
          ? "translateY(0)"
          : `translateY(calc(85vh - ${COLLAPSED_HEIGHT}px))`,
      }}
      className="fixed bottom-0 left-0 w-full bg-[#1e3a5f] text-white rounded-t-2xl shadow-2xl flex flex-col z-[55] transition-transform duration-300 ease-in-out"
    >
      {/* --- ENTÊTE / POIGNÉE DE DRAG --- */}
      <div
        className="flex flex-col items-center pt-3 pb-2 shrink-0 cursor-pointer select-none group hover:bg-white/5 transition-colors rounded-t-2xl"
        onMouseDown={(e) => onDragStart(e.clientY)}
        onMouseMove={(e) => {
          if (e.buttons === 1) onDragMove(e.clientY);
        }}
        onMouseUp={(e) => onDragEnd(e.clientY)}
        onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => onDragMove(e.touches[0].clientY)}
        onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientY)}
      >
        {/* Petite barre horizontale visuelle */}
        <div className="w-10 h-1 bg-white/40 rounded-full mb-2" />

        <div className="flex items-center gap-1.5">
          {/* Flèche qui tourne selon l'état */}
          <ChevronUp
            size={14}
            className={`text-white/70 transition-transform duration-300 group-hover:text-white ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <p className="text-xs font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors whitespace-nowrap">
            Toutes mes transactions
          </p>
          <ChevronUp
            size={14}
            className={`text-white/70 transition-transform duration-300 group-hover:text-white ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* --- LISTE DES TRANSACTIONS --- */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {transactions.length === 0 ? (
          <p className="text-center text-white/50 mt-8 text-sm italic">
            Aucune transaction pour le moment.
          </p>
        ) : (
          transactions.map((t) => (
            <TransactionLine
              key={t.id}
              transaction={t}
              // On passe les callbacks pour gérer l'édition et la suppression
              onUpdateRequest={onUpdateRequest}
              onDeleteRequest={onDeleteRequest}
            />
          ))
        )}
      </div>
    </div>
  );
}
