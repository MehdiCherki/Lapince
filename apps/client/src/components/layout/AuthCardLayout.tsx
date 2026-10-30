import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import { AnimatedOrbBackground } from "@/components/ui/AnimatedOrbBackground";

interface AuthCardLayoutProps {
  title: string;
  children: ReactNode;
}

// Mise en page des pages publiques à carte centrée (mot de passe oublié, réinitialisation)
export default function AuthCardLayout({
  title,
  children,
}: AuthCardLayoutProps) {
  return (
    <main
      className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]"
      role="main"
    >
      <AnimatedOrbBackground />

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

      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-4">
        <header className="text-center mb-8">
          <h1 className="text-[35px] md:text-[50px] lg:text-[60px] font-black uppercase leading-none tracking-tighter">
            {title}
          </h1>
        </header>

        <section className="w-full max-w-[440px] flex flex-col items-center justify-center gap-5 bg-white/20 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/30">
          {children}
        </section>
      </div>

      <footer className="absolute bottom-0 left-0 w-full z-50">
        <Footer showIcons={true} />
      </footer>
    </main>
  );
}
