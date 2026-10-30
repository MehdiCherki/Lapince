import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/layout/Footer";
import { AnimatedOrbBackground } from "@/components/ui/AnimatedOrbBackground";

interface TeamMember {
  name: string;
  role: string;
  email: string;
  avatar: string;
}

const TEAM: TeamMember[] = [
  {
    name: "Mehdi Cherki",
    role: "Développeur Fullstack",
    email: "cherki.m3hdi@gmail.com",
    avatar: "https://api.dicebear.com/9.x/lorelei/svg?seed=Mehdi",
  },
  {
    name: "Julien Mimouni",
    role: "Développeur Fullstack",
    email: "julienmimouni1@gmail.com",
    avatar: "https://api.dicebear.com/9.x/lorelei/svg?seed=Julien",
  },
  {
    name: "Pooya Akhvas",
    role: "Développeur Fullstack",
    email: "pooya.akhvas@oclock.school",
    avatar: "https://api.dicebear.com/9.x/lorelei/svg?seed=Pooya",
  },
  {
    name: "Marie Vidal",
    role: "Développeuse Fullstack",
    email: "marie.vidal@oclock.school",
    avatar: "https://api.dicebear.com/9.x/lorelei/svg?seed=Marie",
  },
  {
    name: "Cathy Chereau",
    role: "Développeuse Fullstack",
    email: "cathy.chereau@oclock.school",
    avatar: "https://api.dicebear.com/9.x/lorelei/svg?seed=Cathy",
  },
];

export default function MentionsLegalesPage() {
  const navigate = useNavigate();
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
    });
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="fixed inset-0 w-full h-full bg-[#b9c6d1] overflow-hidden font-sans text-[#002b49]">
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

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-white/30 z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Logos */}
      <img
        src="/WEBP/Mobile/Lapince-Logo-Mobile.webp"
        className="absolute top-3 left-4 w-20 z-50 md:hidden"
        alt="Logo La Pince"
      />
      <img
        src="/WEBP/Desktop/Lapince-Logo-Desktop.webp"
        className="absolute top-3 left-10 w-16 lg:w-24 z-50 transition-all hidden md:block"
        alt="Logo La Pince"
      />

      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 right-4 md:top-6 md:right-6 lg:top-10 lg:right-10 z-[60] px-8 py-2 rounded-full bg-[#002b49] text-white font-bold text-xs shadow-lg hover:bg-[#003b63] transition-colors cursor-pointer"
      >
        Retour
      </button>

      {/* Header fixe mobile — hors du masque */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[45] flex flex-col items-center pt-28 pb-4 pointer-events-none">
        <h1 className="text-[40px] font-black uppercase leading-none tracking-tighter text-center">
          Mentions légales
        </h1>
        <p className="text-base font-bold mt-1 opacity-80 text-center px-4">
          Conformément à la loi n°2004-575 du 21 juin 2004
        </p>
      </div>

      {/* Zone scrollable avec masque mobile */}
      <div
        className="relative z-40 flex flex-col h-full overflow-y-auto scrollbar-hide
          [mask-image:linear-gradient(to_bottom,transparent_0px,transparent_210px,black_250px)]
          [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,transparent_210px,black_250px)]
          md:[mask-image:none] md:[-webkit-mask-image:none]"
        style={{ paddingBottom: footerHeight + 40 }}
      >
        {/* Spacer mobile */}
        <div className="md:hidden h-[250px] shrink-0" />

        {/* Header desktop */}
        <header className="hidden md:flex flex-col items-center pt-10 pb-8 shrink-0">
          <h1 className="md:text-[50px] lg:text-[60px] font-black uppercase leading-none tracking-tighter">
            Mentions légales
          </h1>
          <p className="text-base font-bold mt-1 opacity-80">
            Conformément à la loi n°2004-575 du 21 juin 2004
          </p>
        </header>

        {/* Contenu */}
        <div className="max-w-4xl lg:max-w-6xl mx-auto w-full px-6 space-y-6">
          <LegalSection title="Éditeur du site">
            <LegalRow label="Nom du site" value="La Pince" />
            <LegalRow
              label="Nature"
              value="Application web — Projet de formation CDA, O'Clock"
            />
            <LegalRow label="Directeur de la publication" value="L'équipe :)" />
            <LegalRow label="Contact" value="cherki.m3hdi@gmail.com" isEmail />
          </LegalSection>

          <LegalSection title="Hébergement">
            <LegalRow
              label="Hébergeur"
              value="O'Clock — plateforme eddi.cloud"
            />
            <LegalRow label="Site web" value="https://oclock.io" />
            <LegalRow label="Adresse" value="Paris, France" />
          </LegalSection>

          <LegalSection title="Propriété intellectuelle">
            <p className="text-sm font-bold leading-relaxed opacity-80">
              L'ensemble des contenus présents sur le site La Pince — textes,
              graphismes, logo et icônes — sont la propriété exclusive de leurs
              auteurs et sont protégés par le droit d'auteur (Code de la
              propriété intellectuelle). Toute reproduction, représentation ou
              exploitation sans autorisation écrite préalable est strictement
              interdite.
            </p>
          </LegalSection>

          <LegalSection title="Protection des données personnelles (RGPD)">
            <p className="text-sm font-bold leading-relaxed opacity-80 mb-4">
              Conformément au RGPD en vigueur depuis le 25 mai 2018, vous
              disposez des droits suivants sur vos données personnelles :
            </p>
            <ul className="space-y-2 mb-4">
              {[
                "Droit d'accès à vos données personnelles",
                "Droit de rectification des informations inexactes",
                "Droit à l'effacement (droit à l'oubli)",
                "Droit à la portabilité de vos données",
                "Droit d'opposition au traitement",
              ].map((right) => (
                <li
                  key={right}
                  className="flex items-start gap-3 text-sm font-bold opacity-80"
                >
                  <span className="font-black shrink-0">—</span>
                  {right}
                </li>
              ))}
            </ul>
            <p className="text-sm font-bold leading-relaxed opacity-80 mt-4">
              <strong>Données collectées :</strong> email, prénom, nom de
              famille.
            </p>
            <p className="text-sm font-bold leading-relaxed opacity-80 mt-2">
              <strong>Finalité :</strong> authentification uniquement. Aucune
              donnée cédée à des tiers.
            </p>
            <p className="text-sm font-bold leading-relaxed opacity-80 mt-2">
              Pour exercer vos droits :{" "}
              <a
                href="mailto:cherki.m3hdi@gmail.com"
                className="underline hover:opacity-70 transition-opacity"
              >
                cherki.m3hdi@gmail.com
              </a>
            </p>
          </LegalSection>

          <LegalSection title="Cookies">
            <p className="text-sm font-bold leading-relaxed opacity-80">
              La Pince utilise uniquement des cookies de session JWT strictement
              nécessaires au fonctionnement de l'authentification (maintien de
              la connexion entre les pages). Aucun cookie publicitaire,
              analytique ou de traçage tiers n'est déposé sur votre navigateur.
            </p>
          </LegalSection>

          <LegalSection title="L'équipe">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="flex flex-col items-center gap-3 p-4 bg-white/20 rounded-[1.5rem] border border-white/30 hover:bg-white/30 transition-all"
                >
                  <img
                    src={member.avatar}
                    alt={`Photo de ${member.name}`}
                    className="w-16 h-16 lg:w-24 lg:h-24 rounded-full object-cover border-2 border-white shadow-lg"
                    loading="lazy"
                  />
                  <div className="text-center space-y-0.5">
                    <p className="text-xs lg:text-sm font-black uppercase italic leading-tight">
                      {member.name}
                    </p>
                    <p className="text-[10px] lg:text-xs font-bold opacity-60">
                      {member.role}
                    </p>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-[10px] lg:text-[11px] font-bold underline opacity-70 hover:opacity-100 transition-opacity block mt-1 break-all"
                    >
                      {member.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </LegalSection>
        </div>
      </div>

      <footer
        ref={footerRef}
        className="absolute bottom-0 left-0 w-full z-[60]"
      >
        <Footer showIcons activeIds={["transactions"]} />
      </footer>
    </main>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/40">
      <h2 className="text-lg font-black uppercase italic tracking-tight mb-4 pb-3 border-b border-[#002b49]/10">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface LegalRowProps {
  label: string;
  value: string;
  isEmail?: boolean;
}

function LegalRow({ label, value, isEmail = false }: LegalRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2.5 border-b border-white/20 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-widest opacity-50 sm:w-52 shrink-0">
        {label}
      </span>
      {isEmail ? (
        <a
          href={`mailto:${value}`}
          className="text-sm font-bold underline hover:opacity-70 transition-opacity"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm font-bold">{value}</span>
      )}
    </div>
  );
}
