import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ParametreForm from "../../components/auth/ParametreForm";
import Footer from "../../components/Footer/footer";
import { AnimatedOrbBackground } from "../../components/AnimatedOrbBackground/AnimatedOrbBackground";

export default function ParametrePage() {
  const { user } = useAuth();

  const [avatarSeeds] = useState<string[]>(() =>
    Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10)),
  );

  const defaultAvatar = `https://api.dicebear.com/9.x/lorelei/svg?seed=${avatarSeeds[0]}`;
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.photo || defaultAvatar);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <main
      className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]"
      role="main"
    >
      <AnimatedOrbBackground />

      <div className="hidden md:block">
        <img
          src="/WEBP/Desktop/Lapince-Hero-Background-Desktop.webp"
          fetchpriority="high"
          className="absolute bottom-0 left-0 w-[55vw] opacity-60 z-0 pointer-events-none"
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
          src="/WEBP/Desktop/Lapince-Logo-Desktop.webp"
          className="absolute top-3 left-10 w-16 lg:w-24 z-50 transition-all"
          alt="Logo Desktop"
        />
      </div>

      <div className="block md:hidden">
        <img
          src="/WEBP/Mobile/Lapince-Hero-Background-Mobile.webp"
          fetchpriority="high"
          className="absolute bottom-0 left-0 w-screen opacity-70 z-0 pointer-events-none"
          alt=""
        />
        <img
          src="/WEBP/Mobile/Lapince-Logo-Mobile.webp"
          className="absolute top-3 left-4 w-20 z-50"
          alt="Logo Mobile"
        />
      </div>

      <div className="absolute inset-0 bg-white/40 z-20 pointer-events-none" aria-hidden="true" />

      <div className="absolute inset-0 z-40 overflow-y-auto scrollbar-hide flex flex-col items-center">

        {/* Mobile */}
        <div className="flex md:hidden flex-col items-center w-full pt-24 pb-32 px-4 shrink-0">
          <header className="text-center mb-8 relative left-0">
            <h1 className="text-[20px] translate-x-[100px] font-black italic uppercase leading-none tracking-tighter">
              Paramètres
            </h1>
            <p className="text-[10px] translate-x-[100px] font-bold opacity-90 mt-2 text-[#002b49]">
              Personnalisez votre espace.
            </p>
          </header>

          <div className="relative mb-8 shrink-0">
            <div className="w-28 h-28 rounded-full bg-white/50 border-2 border-white flex items-center justify-center shadow-xl overflow-hidden backdrop-blur-md">
              <img src={selectedAvatar} className="w-full h-full object-cover" alt="avatar" />
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="absolute bottom-0 right-0 bg-[#002b49] text-white p-2 rounded-full border-2 border-white shadow-lg"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
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
                        onClick={() => { setSelectedAvatar(url); setShowPicker(false); }}
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

          <section className="w-full max-w-[400px] bg-white/20 backdrop-blur-3xl rounded-[2.5rem] p-7 shadow-2xl border border-white/30">
            <ParametreForm selectedAvatar={selectedAvatar} />
          </section>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex flex-col items-center w-full min-h-full justify-center pt-10 pb-28 px-4 shrink-0">
          <header className="text-center mb-10 shrink-0">
            <h1 className="text-[50px] font-black uppercase leading-none tracking-tighter">
              Paramètres
            </h1>
            <p className="text-[18px] font-bold opacity-90 mt-2">
              Personnalisez votre espace sans prise de tête.
            </p>
          </header>

          <div className="relative mb-10 shrink-0 group">
            <div className="w-36 h-36 rounded-full bg-white/50 border-2 border-white flex items-center justify-center shadow-2xl overflow-hidden backdrop-blur-md">
              <img src={selectedAvatar} className="w-full h-full object-cover" alt="avatar" />
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="absolute bottom-1 right-1 bg-[#002b49] text-white p-2 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
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
                        onClick={() => { setSelectedAvatar(url); setShowPicker(false); }}
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

          <section className="w-full max-w-[450px] bg-white/20 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl border border-white/30">
            <ParametreForm selectedAvatar={selectedAvatar} />
          </section>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 w-full z-50">
        <Footer showIcons={true} activeIds={["dashboard", "transactions"]} />
      </footer>
    </main>
  );
}
