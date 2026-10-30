import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    // logout() dans AuthContext appelle fetchLogout() (détruit le cookie côté back)
    // puis vide l'état React. Tout est géré dans le contexte — pas de fetch ici.
    await logout();
    navigate("/");
  }

  return (
    <button
      onClick={handleLogout}
      className="px-8 py-2 rounded-full bg-[#002b49] text-white font-bold text-xs shadow-lg hover:bg-[#003b63] transition-colors cursor-pointer"
    >
      Déconnexion
    </button>
  );
}
