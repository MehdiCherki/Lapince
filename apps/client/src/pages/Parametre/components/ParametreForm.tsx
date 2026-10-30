import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateUserProfile } from "@/services/user";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser, ApiError } from "@/types/auth";

export default function ParametreForm({
  selectedAvatar,
  onDeleteRequest,
}: {
  selectedAvatar: string;
  onDeleteRequest: () => void;
}) {
  const { user, login } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    password: "",
    confirm: "",
  });

  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!confirm("Êtes-vous sûr de vouloir modifier vos informations ?"))
      return;

    setIsLoading(true);
    setApiError(null);

    try {
      if (form.password && form.password !== form.confirm) {
        setApiError({
          error: "Les mots de passe ne correspondent pas.",
          field: "confirm",
        });
        setIsLoading(false);
        return;
      }

      const updatedUser = await updateUserProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password || undefined,
        photo: selectedAvatar || undefined,
      });

      login(updatedUser as AuthUser);
      alert("Vos informations ont été mises à jour avec succès !");
    } catch (err) {
      setApiError(err as ApiError);
    }

    setIsLoading(false);
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
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          className={inputStyle}
          placeholder="mot de passe"
        />
        {apiError?.field === "password" && (
          <p className="text-red-500 text-xs ml-4">{apiError.error}</p>
        )}
      </div>

      <div>
        <label className={labelStyle}>Confirmer le mot de passe</label>
        <input
          name="confirm"
          type="password"
          value={form.confirm}
          onChange={handleChange}
          className={inputStyle}
          placeholder="mot de passe"
        />
        {apiError?.field === "confirm" && (
          <p className="text-red-500 text-xs ml-4">{apiError.error}</p>
        )}
      </div>

      {apiError && !apiError.field && (
        <p className="text-red-500 text-xs text-center">{apiError.error}</p>
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
    </form>
  );
}
