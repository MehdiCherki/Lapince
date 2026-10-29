import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Footer from "../../components/Footer/footer";
import { AnimatedOrbBackground } from "../../components/AnimatedOrbBackground/AnimatedOrbBackground";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/auth/verify-email?token=${token}`,
    )
      .then((res) => {
        if (res.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main
      className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]"
      role="main"
    >
      <AnimatedOrbBackground />

      {/* Desktop */}
      <div className="hidden md:block">
        <img
          src="/WEBP/Desktop/Lapince-Hero-Background-Desktop.webp"
          fetchPriority="high"
          className="absolute bottom-0 left-0 w-[55vw] opacity-60 object-contain z-0 pointer-events-none"
          alt=""
        />
        <img
          src="/WEBP/Desktop/Lapince-Logo-Desktop.webp"
          className="absolute top-3 left-10 w-16 lg:w-24 z-50 transition-all"
          alt="Logo"
        />
      </div>

      {/* Mobile */}
      <div className="block md:hidden">
        <img
          src="/WEBP/Mobile/Lapince-Hero-Background-Mobile.webp"
          fetchPriority="high"
          className="absolute bottom-0 left-0 w-full opacity-70 z-0 pointer-events-none"
          alt=""
        />
        <img
          src="/WEBP/Mobile/Lapince-Logo-Mobile.webp"
          className="absolute top-3 left-4 w-20 z-50"
          alt="Logo Mobile"
        />
      </div>

      <div className="absolute inset-0 bg-white/40 z-20 pointer-events-none" />

      {/* Contenu */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-4">
        <header className="text-center mb-8">
          <h1 className="text-[35px] md:text-[50px] lg:text-[60px] font-black uppercase leading-none tracking-tighter">
            {status === "success" ? "Email confirmé" : "Vérification"}
          </h1>
        </header>

        <section className="w-full max-w-[440px] flex flex-col items-center justify-center gap-6 bg-white/20 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl border border-white/30">
          {status === "loading" && (
            <p className="text-center text-lg font-medium">
              Vérification en cours...
            </p>
          )}

          {status === "success" && (
            <>
              <p className="text-center text-xl font-black text-[#002b49]">
                ✓ Votre adresse email a bien été confirmée !
              </p>
              <p className="text-center text-sm opacity-70">
                Vous pouvez maintenant vous connecter à votre compte.
              </p>
              <Link
                to="/login"
                className="bg-[#002b49] text-white font-bold px-8 py-3 rounded-full hover:opacity-80 transition-opacity"
              >
                Se connecter
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-center text-xl font-black text-[#002b49]">
                Ce lien est invalide ou a déjà été utilisé.
              </p>
              <p className="text-center text-sm opacity-70">
                Inscrivez-vous à nouveau pour recevoir un nouvel email.
              </p>
              <Link
                to="/login"
                className="bg-[#002b49] text-white font-bold px-8 py-3 rounded-full hover:opacity-80 transition-opacity"
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </section>
      </div>

      <footer className="absolute bottom-0 left-0 w-full z-50">
        <Footer showIcons={true} />
      </footer>
    </main>
  );
}
