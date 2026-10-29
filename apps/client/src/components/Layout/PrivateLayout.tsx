import { Outlet } from "react-router-dom";
import LogoutButton from "../Logout/LogoutButton";
import { useAuth } from "../../context/AuthContext";

export default function PrivateLayout() {
  const { user } = useAuth();

  const avatar = (size: string) => (
    <div
      className={`${size} rounded-full border-2 border-white shadow-lg overflow-hidden shrink-0`}
    >
      <img
        src={user?.photo ?? "/WEBP/Desktop/Lapince-Profil-Picture-Desktop.webp"}
        className="w-full h-full object-cover"
        alt="Photo de profil"
      />
    </div>
  );

  const namePill = (textSize: string, px: string, py: string) => (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-full ${px} ${py} text-[#002b49] font-bold ${textSize} whitespace-nowrap shadow-sm`}
    >
      {user?.first_name} {user?.last_name}
    </div>
  );

  return (
    <>
      {/* MOBILE < md : avatar + nom + déconnexion alignés à l'horizontale */}
      <div className="md:hidden fixed top-4 right-4 z-[60] flex items-center gap-2">
        <div className="flex items-center gap-2">
          {avatar("w-9 h-9")}
          {namePill("text-xs", "px-4", "py-2")}
        </div>
        <LogoutButton />
      </div>

      {/* TABLETTE md → lg : avatar moyen + nom + déconnexion alignés */}
      <div className="hidden md:flex lg:hidden fixed top-6 right-6 z-[60] items-center gap-4">
        <div className="flex items-center gap-3">
          {avatar("w-12 h-12")}
          {namePill("text-xs", "px-4", "py-2")}
        </div>
        <LogoutButton />
      </div>

      {/* DESKTOP lg+ : grand avatar + nom + déconnexion alignés */}
      <div className="hidden lg:flex fixed top-10 right-10 z-[60] items-center gap-6">
        <div className="flex items-center gap-4">
          {avatar("w-16 h-16")}
          {namePill("text-sm", "px-6", "py-2.5")}
        </div>
        <LogoutButton />
      </div>

      <Outlet />
    </>
  );
}
