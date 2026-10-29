import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/footer";
import { AnimatedOrbBackground } from "../../components/AnimatedOrbBackground/AnimatedOrbBackground";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]">
      <AnimatedOrbBackground />

      <div className="relative z-30 flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
        <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter">
          404
        </h1>
        <p className="text-[18px] md:text-[22px] font-medium">
          Cette page n'existe pas.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-8 py-3 bg-[#002b49] text-white font-bold rounded-full hover:bg-[#003b63] active:scale-95 transition-all"
        >
          Retour à l'accueil
        </button>
      </div>

      <footer className="absolute bottom-0 left-0 w-full z-[60]">
        <Footer showIcons={false} />
      </footer>
    </main>
  );
}
