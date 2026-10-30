import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { updateUserProfile } from "@/services/userApi";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/types/auth";
import type { ApiError } from "@/types/api";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function ParametreForm({
  selectedAvatar,
  onDeleteRequest,
}: {
  selectedAvatar: string;
  onDeleteRequest: () => void;
}) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    password: "",
    confirm: "",
    currentPassword: "",
  });

  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Champs mot de passe affichés en clair (icône œil), un état par champ
  const [visible, setVisible] = useState({
    password: false,
    confirm: false,
    currentPassword: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setApiError(null);
    setSuccessMessage(null);
  };

  // Envoi du formulaire : vérifications locales, puis demande de confirmation (modale de l'app)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (form.password && form.password !== form.confirm) {
      setApiError({
        error: "Les mots de passe ne correspondent pas.",
        field: "confirm",
      });
      return;
    }

    setConfirmOpen(true);
  };

  // Confirmé : enregistrement. Les erreurs de l'API s'affichent sous les champs, pas dans la modale.
  const save = async () => {
    setConfirmOpen(false);
    setIsLoading(true);

    try {
      const updatedUser = await updateUserProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password || undefined,
        // Exigé par l'API pour changer l'email ou le mot de passe
        currentPassword: form.currentPassword || undefined,
        photo: selectedAvatar || undefined,
      });

      // Nouveau mot de passe : l'API a fermé toutes les sessions → reconnexion
      if (form.password) {
        setSuccessMessage("Mot de passe modifié : reconnectez-vous.");
        // Navigation AVANT la déconnexion : sinon PrivateRoute réagit à la perte de session
        // et renvoie vers "/" avant que ce composant (déjà démonté) puisse aller sur /login
        setTimeout(async () => {
          navigate("/login", { replace: true });
          await logout();
        }, 2000);
        return;
      }

      login(updatedUser as AuthUser);
      setForm({ ...form, currentPassword: "" });
      setSuccessMessage("Vos informations ont été mises à jour.");
    } catch (err) {
      setApiError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle =
    "w-full px-4 py-2 rounded-full bg-white/80 border-none text-[12px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-[#002b49]";
  const labelStyle =
    "block text-[11px] font-black ml-4 mb-0.5 italic uppercase text-[#002b49]";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={labelStyle}>Prénom</label>
        <input
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          className={inputStyle}
          placeholder="Prénom"
        />
        {apiError?.field === "first_name" && (
          <p className="text-red-500 text-xs ml-4">{apiError.error}</p>
        )}
      </div>

      <div>
        <label className={labelStyle}>Nom</label>
        <input
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          className={inputStyle}
          placeholder="Nom de famille"
        />
        {apiError?.field === "last_name" && (
          <p className="text-red-500 text-xs ml-4">{apiError.error}</p>
        )}
      </div>

      <div>
        <label className={labelStyle}>e-mail</label>
        <input
          name="email"
          type="email"
          autoComplete="username"
          value={form.email}
          onChange={handleChange}
          className={inputStyle}
          placeholder="e-mail"
        />
        {apiError?.field === "email" && (
          <p className="text-red-500 text-xs ml-4">{apiError.error}</p>
        )}
      </div>

      <div>
        <label className={labelStyle}>Nouveau mot de passe</label>
        <div className="flex items-center gap-2">
          <input
            name="password"
            type={visible.password ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            className={inputStyle}
            placeholder="mot de passe"
          />
          <button
            type="button"
            aria-label={
              visible.password
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            onClick={() => setVisible((v) => ({ ...v, password: !v.password }))}
          >
            {visible.password ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {apiError?.field === "password" && (
          <p className="text-red-500 text-xs ml-4">{apiError.error}</p>
        )}
      </div>

      <div>
        <label className={labelStyle}>Confirmer le mot de passe</label>
        <div className="flex items-center gap-2">
          <input
            name="confirm"
            type={visible.confirm ? "text" : "password"}
            autoComplete="new-password"
            value={form.confirm}
            onChange={handleChange}
            className={inputStyle}
            placeholder="mot de passe"
          />
          <button
            type="button"
            aria-label={
              visible.confirm
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            onClick={() => setVisible((v) => ({ ...v, confirm: !v.confirm }))}
          >
            {visible.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {apiError?.field === "confirm" && (
          <p className="text-red-500 text-xs ml-4">{apiError.error}</p>
        )}
      </div>

      <div>
        <label className={labelStyle}>Mot de passe actuel</label>
        <div className="flex items-center gap-2">
          <input
            name="currentPassword"
            type={visible.currentPassword ? "text" : "password"}
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange}
            className={inputStyle}
            placeholder="requis pour changer l'e-mail ou le mot de passe"
          />
          <button
            type="button"
            aria-label={
              visible.currentPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            onClick={() =>
              setVisible((v) => ({ ...v, currentPassword: !v.currentPassword }))
            }
          >
            {visible.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {apiError?.field === "currentPassword" && (
          <p className="text-red-500 text-xs ml-4">{apiError.error}</p>
        )}
      </div>

      {apiError && !apiError.field && (
        <p className="text-red-500 text-xs text-center">{apiError.error}</p>
      )}

      {successMessage && (
        <p
          role="status"
          className="text-green-700 text-[11px] text-center font-bold italic bg-green-100/60 py-1 rounded-full"
        >
          ✓ {successMessage}
        </p>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-fit px-10 py-2 bg-[#002b49] text-white rounded-full font-bold text-sm shadow-lg hover:bg-[#003b63] transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            "Soumettre"
          )}
        </button>
      </div>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onDeleteRequest}
          className="text-[11px] text-red-600 font-bold underline italic opacity-80"
        >
          Se désinscrire
        </button>
      </div>
      {/* Portail vers <body> : le backdrop-blur de la carte piégerait sinon la modale (position fixed) */}
      {confirmOpen &&
        createPortal(
          <ConfirmModal
            title="Modifier vos informations ?"
            message="Les modifications seront enregistrées sur votre compte."
            confirmLabel="Enregistrer"
            onConfirm={save}
            onCancel={() => setConfirmOpen(false)}
          />,
          document.body,
        )}
    </form>
  );
}
