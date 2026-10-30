import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface LogoProps {
  variant: "desktop" | "mobile";
  // Position et taille, propres à chaque page
  className: string;
}

// Logo cliquable : retour à l'accueil (privé si connecté, public sinon), comme sur la plupart des sites
export default function Logo({ variant, className }: LogoProps) {
  const { isAuthenticated } = useAuth();
  const folder = variant === "desktop" ? "Desktop" : "Mobile";

  return (
    <Link
      to={isAuthenticated ? "/accueil" : "/"}
      aria-label="La Pince, retour à l'accueil"
      className={`block ${className}`}
    >
      <img
        src={`/WEBP/${folder}/Lapince-Logo-${folder}.webp`}
        className="w-full h-auto"
        alt=""
      />
    </Link>
  );
}
