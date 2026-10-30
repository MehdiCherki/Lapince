import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { deleteUserAccount } from "@/services/userApi";
import ParametreForm from "./components/ParametreForm";
import Footer from "@/components/layout/Footer";
import { AnimatedOrbBackground } from "@/components/ui/AnimatedOrbBackground";

export default function ParametrePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [avatarSeeds] = useState<string[]>(() =>
    Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10)),
  );

  const defaultAvatar = `https://api.dicebear.com/9.x/lorelei/svg?seed=${avatarSeeds[0]}`;
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    user?.photo || defaultAvatar,
  );
  const [showPicker, setShowPicker] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);

  const handleDeleteConfirmed = async () => {
    try {
      await deleteUserAccount();
      await logout();
      navigate("/login");
    } catch {
      setDeleteStep(0);
    }
  };

  return (
    <main
      className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]"
      role="main"
    >
      <AnimatedOrbBackground />

      {/* Arrière-plans */}
      <img
        src="/WEBP/Desktop/Lapince-Hero-Background-Desktop.webp"
        fetchPriority="high"
        className="absolute bottom-0 left-0 w-[55vw] opacity-60 object-contain origin-bottom-left z-0 pointer-events-none select-none hidden md:block"
        aria-hidden="true"
        alt=""
      />
      <div className="absolute bottom-0 right-[5%] z-10 pointer-events-none hidden lg:block">
        <img
          src="/WEBP/Desktop/Lapince-Hand-Desktop.webp"
          className="w-[24vw] h-auto object-contain"
          alt=""
        />
      </div>
      <img
        src="/WEBP/Mobile/Lapince-Hero-Background-Mobile.webp"
        fetchPriority="high"
        className="absolute bottom-0 left-0 w-screen opacity-70 z-0 pointer-events-none block md:hidden"
        alt=""
      />

      {/* Logos */}
      <img
        src="/WEBP/Mobile/Lapince-Logo-Mobile.webp"
        className="absolute top-3 left-4 w-20 z-50 md:hidden"
        alt="Logo"
      />
      <img
        src="/WEBP/Desktop/Lapince-Logo-Desktop.webp"
        className="absolute top-3 left-10 w-16 lg:w-24 z-50 transition-all hidden md:block"
        alt="Logo"
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-white/30 z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Header fixe mobile — hors du masque */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[45] flex flex-col items-center pt-28 pb-4 pointer-events-none">
        <h1 className="text-[50px] font-black uppercase leading-none tracking-tighter">
          Paramètres
        </h1>
        <p className="text-base font-bold mt-1 opacity-80">
          Personnalisez votre espace.
        </p>
      </div>

      {/* Zone scrollable avec masque mobile */}
      <div
        className="relative z-40 flex flex-col h-full overflow-y-auto scrollbar-hide pb-40
          [mask-image:linear-gradient(to_bottom,transparent_0px,transparent_220px,black_260px)]
          [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,transparent_220px,black_260px)]
          md:[mask-image:none] md:[-webkit-mask-image:none]"
      >
        {/* Spacer mobile */}
        <div className="md:hidden h-[260px] shrink-0" />

        {/* Header desktop */}
        <header className="hidden md:flex flex-col items-center pt-10 pb-6 shrink-0">
          <h1 className="md:text-[50px] lg:text-[60px] font-black uppercase leading-none tracking-tighter">
            Paramètres
          </h1>
          <p className="text-base font-bold mt-1 opacity-80">
            Personnalisez votre espace sans prise de tête.
          </p>
        </header>

        {/* Contenu */}
        <div className="flex flex-col items-center w-full px-4 pb-10">
          {/* Avatar */}
          <div className="relative mb-8 shrink-0 group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/50 border-2 border-white flex items-center justify-center shadow-2xl overflow-hidden backdrop-blur-md">
              <img
                src={selectedAvatar}
                className="w-full h-full object-cover"
                alt="avatar"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="absolute bottom-1 right-1 bg-[#002b49] text-white p-2 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform"
            >
              <svg
                className="w-3 h-3 md:w-4 md:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="4"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {showPicker && (
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/50 z-50">
                <div className="flex flex-wrap justify-center gap-3 w-64">
                  {avatarSeeds.map((seed) => {
                    const url = `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}`;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(url);
                          setShowPicker(false);
                        }}
                        className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all hover:scale-110 ${selectedAvatar === url ? "border-[#002b49]" : "border-transparent"}`}
                      >
                        <img src={url} alt={seed} className="w-full h-full" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Formulaire */}
          <section className="w-full max-w-[450px] bg-white/20 backdrop-blur-3xl rounded-[2.5rem] p-7 md:p-10 shadow-2xl border border-white/30">
            <ParametreForm
              selectedAvatar={selectedAvatar}
              onDeleteRequest={() => setDeleteStep(1)}
            />
          </section>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 w-full z-[60]">
        <Footer
          showIcons={true}
          activeIds={["dashboard", "mentions-legales", "transactions"]}
        />
      </footer>

      {/* Étape 1 — première confirmation */}
      {deleteStep === 1 && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-xl flex flex-col items-center gap-5">
            <h2 className="text-lg font-black uppercase tracking-tight text-[#002b49] text-center">
              Vous souhaitez partir ?
            </h2>
            <p className="text-sm text-center text-[#002b49]/70 leading-snug">
              Supprimer votre compte effacera définitivement toutes vos données,
              transactions et budgets.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="flex-1 py-2.5 rounded-full bg-[#002b49]/10 text-[#002b49] font-bold text-sm hover:bg-[#002b49]/20 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setDeleteStep(2)}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Étape 2 — confirmation définitive */}
      {deleteStep === 2 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-xl flex flex-col items-center gap-5">
            <h2 className="text-lg font-black uppercase tracking-tight text-red-600 text-center">
              Êtes-vous vraiment sûr ?
            </h2>
            <p className="text-sm text-center text-[#002b49]/70 leading-snug">
              Cette action est{" "}
              <span className="font-black text-red-600">irréversible</span>.
              Votre compte et toutes vos données seront supprimés immédiatement.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="flex-1 py-2.5 rounded-full bg-[#002b49]/10 text-[#002b49] font-bold text-sm hover:bg-[#002b49]/20 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="flex-1 py-2.5 rounded-full bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
