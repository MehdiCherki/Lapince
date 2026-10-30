import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import { resetPassword } from "@/services/authApi";
import type { ApiError } from "@/types/api";

const inputStyle =
  "w-full px-4 py-2.5 rounded-full bg-white/80 border-none text-[13px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-[#002b49]";
const labelStyle = "block text-[13px] font-black ml-4 mb-1 italic uppercase";
const buttonStyle =
  "bg-[#002b49] text-white font-bold px-8 py-3 rounded-full hover:opacity-80 transition-opacity disabled:opacity-50";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [visible, setVisible] = useState({ password: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError({
        error: "Les mots de passe ne correspondent pas.",
        field: "confirm",
      });
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token ?? "", form.password);
      setDone(true);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCardLayout title="Nouveau mot de passe">
        <p className="text-center text-lg font-black">Ce lien est incomplet.</p>
        <p className="text-center text-sm opacity-70">
          Faites une nouvelle demande pour recevoir un lien valide.
        </p>
        <Link to="/forgot-password" className={buttonStyle}>
          Nouvelle demande
        </Link>
      </AuthCardLayout>
    );
  }

  if (done) {
    return (
      <AuthCardLayout title="Nouveau mot de passe">
        <p role="status" className="text-center text-lg font-black">
          ✓ Votre mot de passe a été modifié.
        </p>
        <p className="text-center text-sm opacity-70">
          Par sécurité, vous avez été déconnecté de tous vos appareils.
        </p>
        <Link to="/login" className={buttonStyle}>
          Se connecter
        </Link>
      </AuthCardLayout>
    );
  }

  const fields = [
    { name: "password", label: "Nouveau mot de passe" },
    { name: "confirm", label: "Confirmer le mot de passe" },
  ] as const;

  return (
    <AuthCardLayout title="Nouveau mot de passe">
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {fields.map(({ name, label }) => (
          <div key={name}>
            <label htmlFor={name} className={labelStyle}>
              {label}
            </label>
            <div className="flex items-center gap-2">
              <input
                id={name}
                name={name}
                type={visible[name] ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form[name]}
                onChange={(e) => {
                  setForm({ ...form, [name]: e.target.value });
                  setError(null);
                }}
                placeholder="mot de passe"
                className={inputStyle}
                disabled={isLoading}
              />
              <button
                type="button"
                aria-label={
                  visible[name]
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                onClick={() => setVisible((v) => ({ ...v, [name]: !v[name] }))}
              >
                {visible[name] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error?.field === name && (
              <p className="text-red-500 text-xs ml-4 mt-1">{error.error}</p>
            )}
          </div>
        ))}

        {error && !error.field && (
          <div role="alert" className="text-center space-y-2">
            <p className="text-red-600 text-[11px] font-bold italic bg-red-100/50 py-1 rounded-full">
              {error.error}
            </p>
            <Link
              to="/forgot-password"
              className="text-[11px] font-bold underline"
            >
              Faire une nouvelle demande
            </Link>
          </div>
        )}

        <div className="flex justify-center">
          <button type="submit" disabled={isLoading} className={buttonStyle}>
            {isLoading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              "Enregistrer"
            )}
          </button>
        </div>
      </form>
    </AuthCardLayout>
  );
}
