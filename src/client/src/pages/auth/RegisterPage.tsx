import RegisterForm from "../../components/auth/RegisterForm";
import { useState } from "react";
import { registerUser } from "../../services/authApi";
import type { RegisterFormData, ApiError } from "../../types/auth";
import Footer from "../../components/Footer/footer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AnimatedOrbBackground } from "../../components/AnimatedOrbBackground/AnimatedOrbBackground";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [showPicker, setShowPicker] = useState(false);
  const [avatarSeeds] = useState<string[]>(() =>
    Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10))
  );

  const handleSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const defaultAvatar = `https://api.dicebear.com/9.x/lorelei/svg?seed=${avatarSeeds[0]}`;
      const user = await registerUser({ ...data, photo: selectedAvatar || defaultAvatar });
      setSuccessMessage("Inscription réussie ! Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre compte.");
      setTimeout(() => {
        login(user);
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]"
      role="main"
    >
      <AnimatedOrbBackground />
      {/* ------------------------------------------------------------ */}
      {/* 1. BLOC DESKTOP (MD+)                                        */}
      {/* ------------------------------------------------------------ */}
      <div className="hidden md:block">
        <img
          src="/WEBP/Desktop/Lapince-Hero-Background-Desktop.webp"
          fetchPriority="high"
          className="absolute bottom-0 left-0 w-[55vw] opacity-60 z-0 pointer-events-none select-none"
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
          alt="Logo"
        />
        <div className="absolute z-50 left-0 w-full md:pl-14 lg:pl-16 pointer-events-none pt-20">
          <header className="max-w-[700px] md:mt-56 shrink-0 text-left md:pl-28">
            <h2 className="text-[50px] lg:text-[65px] font-medium leading-[0.9] tracking-tighter text-[#002b49]">
              Créez votre
              <br />
              compte.
            </h2>
            <p className="text-[17px] lg:text-[21px] font-normal text-[#002b49] opacity-90 mt-6 max-w-[450px] leading-snug">
              <span className="font-bold">La Pince,</span> sans connexion bancaire,
              <br />
              sans prise de tête.
            </p>
          </header>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* 2. BLOC MOBILE (< MD)                                       */}
      {/* ------------------------------------------------------------ */}
      <div className="block md:hidden">
        <img
          src="/WEBP/Mobile/Lapince-Hero-Background-Mobile.webp"
          fetchPriority="high"
          className="absolute bottom-0 left-0 w-full opacity-70 z-0 pointer-events-none select-none"
          alt=""
        />
        <img
          src="/WEBP/Mobile/Lapince-Hand-Mobile.webp"
          className="absolute bottom-0 right-0 w-[45%] z-10 opacity-90 pointer-events-none"
          alt=""
        />
        <img
          src="/WEBP/Mobile/Lapince-Logo-Mobile.webp"
          className="absolute top-3 left-4 w-20 z-50"
          alt="Logo Mobile"
        />
      </div>

      {/* Overlay global (Z-20) */}
      <div
        className="absolute inset-0 bg-white/40 z-20 pointer-events-none"
        aria-hidden="true"
      ></div>

      {/* ------------------------------------------------------------ */}
      {/* 3. ZONE DE CONTENU (L'essentiel - Z-40)                      */}
      {/* ------------------------------------------------------------ */}
      <div className="absolute inset-0 z-40 overflow-y-auto flex flex-col items-center pt-2 pb-5 px-4 scrollbar-hide">

        {/* Titre */}
        <header className="text-center mt-12 mb-8 shrink-0">
          <h1 className="text-[35px] md:text-[50px] lg:text-[60px] font-black uppercase leading-none tracking-tighter">
            Inscription
          </h1>
        </header>

        {/* Avatar */}
        <div className="relative mb-6 shrink-0">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/50 backdrop-blur-md border-2 border-white flex items-center justify-center shadow-2xl overflow-hidden">
            <img
              src={selectedAvatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${avatarSeeds[0]}`}
              className={`w-full h-full object-cover ${selectedAvatar ? "" : "opacity-20"}`}
              alt="Aperçu"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="absolute bottom-1 right-1 bg-[#002b49] text-white p-2 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform"
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

        {/* Formulaire */}
        <section className="w-full max-w-[440px] min-h-[340px] flex flex-col justify-center bg-white/20 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/30 mb-8 shrink-0">
          {successMessage ? (
            <p className="text-center text-xl font-black text-[#002b49]">
              ✓ {successMessage}
            </p>
          ) : (
            <RegisterForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />
          )}
        </section>

        {/* Lien de redirection */}
        <p className="text-sm font-bold shrink-0 mb-10">
          Déjà un compte ?{" "}
          <a href="/login" className="underline ml-1">
            Se connecter
          </a>
        </p>

      </div>

      {/* ------------------------------------------------------------ */}
      {/* 4. FOOTER                                                    */}
      {/* ------------------------------------------------------------ */}
      <footer className="absolute bottom-0 left-0 w-full z-50">
        <Footer showIcons={true} />
      </footer>

    </main>
  );
}
