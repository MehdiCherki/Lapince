import { useState, type FormEvent } from "react";
import type { LoginPayload } from "@/types/auth";
import type { ApiError } from "@/types/api";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  onSubmit: (credentials: LoginPayload) => void;
  isLoading: boolean;
  error: ApiError | null;
}

export default function LoginForm({
  onSubmit,
  isLoading,
  error,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Utilisation de FormEvent avec le type générique HTMLFormElement
   * pour éviter la dépréciation et assurer le typage correct.
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // On remonte les données au parent
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Affichage de l'erreur globale renvoyée par le parent */}
      {error && (
        <p className="text-red-600 text-[11px] text-center font-bold italic bg-red-100/50 py-1 rounded-full">
          {error.error}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-[14px] font-black ml-4 mb-0.5 italic uppercase text-[#002b49]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e-mail"
          className="w-full px-4 py-2.5 rounded-full bg-white/80 border-none text-[13px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-[#002b49]"
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[14px] font-black ml-4 mb-0.5 italic uppercase text-[#002b49]"
        >
          Mot de passe
        </label>
        <div className="flex items-center gap-2">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mot de passe"
            className="w-full px-4 py-2.5 rounded-full bg-white/80 border-none text-[13px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-[#002b49]"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-fit px-8 py-2 bg-[#002b49] text-white rounded-full font-bold text-sm shadow-lg hover:bg-[#003b63] transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            "Se connecter"
          )}
        </button>
      </div>

      <p className="text-center text-[11px] font-bold mt-4 text-[#002b49]">
        Pas encore de compte ?
        <a
          href="/register"
          className="underline ml-1 hover:text-blue-700 transition-colors"
        >
          Créer un compte
        </a>
      </p>
    </form>
  );
}
