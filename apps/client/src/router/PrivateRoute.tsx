import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function PrivateRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  // 1. Pendant qu'on vérifie le token au chargement initial (F5), on affiche un loader
  if (isInitializing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Vérification de la session...</p>
      </div>
    );
  }

  // 2. Si la vérification est finie et qu'on n'est PAS connecté -> retour au Login
  if (!isAuthenticated) {
    // replace=true évite que l'utilisateur puisse faire "Précédent" sur son navigateur
    // pour revenir sur la page protégée
    return <Navigate to="/" replace />;
  }

  // 3. Si tout est OK, on affiche les composants enfants (les pages protégées)
  return <Outlet />;
}
