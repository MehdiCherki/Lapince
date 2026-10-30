import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import { requestPasswordReset } from "@/services/authApi";
import type { ApiError } from "@/types/api";

const inputStyle =
  "w-full px-4 py-2.5 rounded-full bg-white/80 border-none text-[13px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-[#002b49]";
const buttonStyle =
  "bg-[#002b49] text-white font-bold px-8 py-3 rounded-full hover:opacity-80 transition-opacity disabled:opacity-50";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      setSentMessage(await requestPasswordReset(email));
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCardLayout title="Mot de passe oublié">
      {sentMessage ? (
        <>
          <p role="status" className="text-center text-lg font-black">
            ✓ {sentMessage}
          </p>
          <p className="text-center text-sm opacity-70">
            Le lien est valable 30 minutes. Pensez à vérifier vos courriers
            indésirables.
          </p>
          <Link to="/login" className={buttonStyle}>
            Retour à la connexion
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <p className="text-center text-sm opacity-80">
            Saisissez l'adresse de votre compte : nous vous enverrons un lien
            pour choisir un nouveau mot de passe.
          </p>
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-black ml-4 mb-1 italic uppercase"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-mail"
              className={inputStyle}
              disabled={isLoading}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-red-600 text-[11px] text-center font-bold italic bg-red-100/50 py-1 rounded-full"
            >
              {error.error}
            </p>
          )}

          <div className="flex justify-center">
            <button type="submit" disabled={isLoading} className={buttonStyle}>
              {isLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                "Envoyer le lien"
              )}
            </button>
          </div>

          <p className="text-center text-[11px] font-bold">
            <Link to="/login" className="underline">
              Retour à la connexion
            </Link>
          </p>
        </form>
      )}
    </AuthCardLayout>
  );
}
