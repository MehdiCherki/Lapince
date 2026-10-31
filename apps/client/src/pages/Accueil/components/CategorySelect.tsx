import { useState, useEffect, useRef } from "react";
import type { Category } from "@/types/category";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (val: string) => void;
  small?: boolean;
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  small = false,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedCategory = Array.isArray(categories)
    ? categories.find((cat) => cat?.id?.toString() === value)
    : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    /* 1. Largeur augmentée ici : w-32 pour small, w-44 pour normal */
    <div ref={ref} className={`relative z-20 ${small ? "w-32" : "w-44"}`}>
      <div
        /* 2. Le fond orange [#FF7F00] est appliqué sur tout le conteneur */
        className={`bg-[#FF7F00] shadow-md overflow-hidden transition-[border-radius] ${
          open
            ? "rounded-md duration-100 delay-0"
            : "rounded-full duration-100 delay-200"
        }`}
      >
        {/* Bouton principal */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-1 px-3 py-1 focus:outline-none"
        >
          <span
            className={`flex-1 flex items-center gap-1.5 text-[#002b49] font-bold truncate ${small ? "text-sm" : "text-base"}`}
          >
            {selectedCategory && (
              <CategoryIcon name={selectedCategory.icon} className="shrink-0" />
            )}
            {selectedCategory ? selectedCategory.name : "Catégorie"}
          </span>
          <span
            className={`text-white text-[10px] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>

        {/* Liste déroulante (Slider) */}
        <div
          className={`transition-all duration-300 overflow-y-auto ${
            open ? "max-h-40" : "max-h-0"
          }`}
        >
          {Array.isArray(categories) &&
            categories.map((cat) => {
              if (!cat || cat.id === undefined) return null;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChange(cat.id.toString());
                    setOpen(false);
                  }}
                  /* 3. On garde le texte sombre sur fond orange, avec un hover plus clair */
                  className="w-full flex items-center gap-2 px-3 py-2 text-[#002b49] text-sm font-medium hover:bg-orange-400 transition-colors border-t border-white/20"
                >
                  <CategoryIcon name={cat.icon} className="shrink-0" />
                  {cat.name || "Sans nom"}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
