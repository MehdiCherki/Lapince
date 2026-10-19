import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Footer/footer";
import { AnimatedOrbBackground } from "../../components/AnimatedOrbBackground/AnimatedOrbBackground";

const features = [
  {
    title: "Tout ce qu'il vous faut. Rien de superflu.",
    subtitle: "Notez vos dépenses et revenus à la volée",
  },
  {
    title: "Aussi rapide que d'envoyer un message.",
    subtitle: "Visualisez où va votre argent",
  },
  {
    title: "Des alertes intelligentes sur vos budgets.",
    subtitle: "Fixez des budgets par catégorie",
  },
  {
    title: "Et tenez-les, on vous aide.",
    subtitle: null,
  },
];

const mainButtonStyle =
  "w-fit px-12 py-3 bg-white text-[#002b49] rounded-full font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/accueil");
  }, [isAuthenticated, navigate]);

  return (
    <main
      className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]"
      role="main"
      aria-label="Page d'accueil de La Pince"
    >
      <AnimatedOrbBackground />

      <div className="hidden md:block">
        <img
          src="/WEBP/Desktop/Lapince-Hero-Background-Desktop.webp"
          fetchPriority="high"
          className="absolute bottom-0 left-0 w-[60vw] opacity-50 object-contain origin-bottom-left z-0 pointer-events-none select-none"
          aria-hidden="true"
          alt=""
        />
        <div className="absolute bottom-0 right-40 z-30 pointer-events-none select-none h-[95vh]">
          <img
            src="/WEBP/Desktop/Lapince-Hero-Woman-Desktop.webp"
            className="h-full w-auto object-contain object-bottom"
            alt="Illustration La Pince"
          />
        </div>
        <img
          src="/WEBP/Desktop/Lapince-Logo-Desktop.webp"
          className="absolute top-3 left-10 w-16 lg:w-24 z-50 transition-all"
          alt="Logo"
        />
        <div className="absolute top-6 right-6 z-50 pointer-events-auto">
          <a
            href="/login"
            className="px-8 py-2 bg-[#002b49] text-white rounded-full font-bold text-xs shadow-lg hover:bg-[#003b63] transition-colors"
          >
            Connexion
          </a>
        </div>
      </div>

      <div className="block md:hidden">
        <img
          src="/WEBP/Mobile/Lapince-Hero-Background-Mobile.webp"
          fetchPriority="high"
          className="absolute bottom-0 right-30 w-screen opacity-40 z-0 pointer-events-none select-none"
          aria-hidden="true"
          alt=""
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-20 z-10 pointer-events-none select-none w-screen h-[45vh]">
          <img
            src="/WEBP/Mobile/Lapince-Hero-Woman-Mobile.webp"
            className="w-full h-full object-contain object-bottom"
            alt="Illustration Mobile"
          />
        </div>
        <img
          src="/WEBP/Mobile/Lapince-Logo-Mobile.webp"
          className="absolute top-3 left-4 w-20 z-50"
          alt="Logo Round"
        />
        <div className="absolute top-6 right-6 z-50">
          <a
            href="/login"
            className="px-8 py-2 bg-[#002b49] text-white rounded-full font-bold text-xs shadow-lg hover:bg-[#003b63] transition-colors"
          >
            Connexion
          </a>
        </div>
      </div>

      <div
        className="absolute inset-0 bg-white/30 z-20 pointer-events-none"
        aria-hidden="true"
      />

      <div className="absolute inset-0 z-40 overflow-y-auto flex flex-col pt-20 pb-20 px-6 md:pl-14 lg:pl-16 scrollbar-hide">
        <header className="max-w-[700px] mt-10 md:mt-56 shrink-0 text-center md:text-left md:pl-28">
          <h1 className="text-[30px] translate-y-30 md:translate-y-0 md:text-[50px] lg:text-[65px] font-medium leading-[0.9] tracking-tighter text-[#002b49]">
            Votre budget
            <br />
            sans prise de tête.
          </h1>
          <p className="text-[15px] translate-y-30 md:translate-y-0 md:text-[17px] lg:text-[21px] font-normal text-[#002b49] opacity-90 mt-6 max-w-[450px] leading-snug">
            <span className="font-bold">La Pince,</span> l'app qui vous aide à garder
            <br />
            la main sur votre budget.
          </p>
        </header>

        <div className="hidden lg:flex flex-row items-center mt-2">
          <div className="w-[480px] shrink-0 pl-28 flex items-center">
            <a href="/register" className={mainButtonStyle}>
              S'inscrire
            </a>
          </div>
          <section className="space-y-1 w-fit shrink-0 relative z-30">
            {features.map((feature, index) => (
              <div
                key={index}
                className="px-8 py-2 rounded-full bg-white/30 backdrop-blur-sm border border-white/20 text-[#002b49] text-[13px] text-center shadow-sm"
              >
                <strong>{feature.title}</strong>
                {feature.subtitle && (
                  <span className="block">{feature.subtitle}</span>
                )}
              </div>
            ))}
          </section>
        </div>

        <div className="flex lg:hidden justify-center translate-y-30 md:translate-y-0 md:justify-start mt-10 md:mt-14 pb-16 shrink-0 relative z-30">
          <a href="/register" className={mainButtonStyle}>
            S'inscrire
          </a>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 w-full z-50">
        <Footer showIcons={false} />
      </footer>
    </main>
  );
}
