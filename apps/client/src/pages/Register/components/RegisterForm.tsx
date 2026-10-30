import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RegisterPayload } from "@/types/auth";
import type { ApiError } from "@/types/api";

/**
 * Interface décrivant les propriétés attendues par le composant RegisterForm.
 */
interface RegisterFormProps {
  /** Fonction appelée lors de la soumission du formulaire */
  onSubmit: (data: RegisterPayload) => void;

  /** Indique si une requête API est en cours */
  isLoading: boolean;

  /** Contient l'erreur retournée par l'API (champ + message) */
  error: ApiError | null;
}

export default function RegisterForm({
  onSubmit,
  isLoading,
  error,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  /**
   * Gère la soumission du formulaire et extrait les valeurs des champs.
   */
  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    const data: RegisterPayload = {
      first_name: (form.elements.namedItem("first_name") as HTMLInputElement)
        .value,
      last_name: (form.elements.namedItem("last_name") as HTMLInputElement)
        .value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
    };

    onSubmit(data);
  }

  return (
    <form
      className="space-y-2"
      onSubmit={handleFormSubmit}
      role="form"
      aria-label="Formulaire d'inscription"
    >
      {[
        {
          id: "first_name",
          label: "Prénom",
          type: "text",
          placeholder: "Prénom",
          autoComplete: "given-name",
        },
        {
          id: "last_name",
          label: "Nom",
          type: "text",
          placeholder: "Nom de famille",
          autoComplete: "family-name",
        },
        {
          id: "email",
          label: "E-mail",
          type: "email",
          placeholder: "e-mail",
          autoComplete: "username",
        },
        {
          id: "password",
          label: "Mot de passe",
          type: showPassword ? "text" : "password",
          placeholder: "mot de passe",
          autoComplete: "new-password",
        },
        {
          id: "confirm",
          label: "Saisir de nouveau...",
          type: showConfirm ? "text" : "password",
          placeholder: "mot de passe",
          autoComplete: "new-password",
        },
      ].map((field) => (
        <div key={field.id}>
          {/* Label accessible */}
          <label
            htmlFor={field.id}
            className="block text-[14px] font-black ml-4 mb-0.5 italic uppercase"
          >
            {field.label}
          </label>

          {/* Champ de saisie accessible */}
          <div className="flex items-center gap-2">
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              disabled={isLoading}
              aria-invalid={error?.field === field.id}
              aria-describedby={
                error?.field === field.id ? `${field.id}-error` : undefined
              }
              className={cn(
                "w-full px-4 py-2.5 rounded-full bg-white/80 border-none text-[13px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                error?.field === field.id && "ring-2 ring-red-400",
              )}
              required
            />

            {/* On va afficher le bouton que pour les champs password et confirm*/}
            {/* Pour inverser les états : on passe de true à false ou inversement pour afficher ou masquer */}
            {(field.id === "password" || field.id === "confirm") && (
              <button
                type="button"
                onClick={() =>
                  field.id === "password"
                    ? setShowPassword((prev) => !prev)
                    : setShowConfirm((prev) => !prev)
                }
              >
                {field.id === "password" ? (
                  showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )
                ) : showConfirm ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            )}
          </div>

          {/* Message d'erreur accessible */}
          {error?.field === field.id && (
            <p
              id={`${field.id}-error`}
              className="text-red-600 text-xs ml-4 mt-1"
              role="alert"
            >
              {error.error}
            </p>
          )}
        </div>
      ))}
      {/* Bouton de validation */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isLoading}
          className="w-fit px-10 py-2 bg-[#002b49] text-white rounded-full font-bold text-sm shadow-lg 
             hover:bg-[#003b63] active:scale-95 active:bg-[#001b2e] 
             transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            "S'inscrire"
          )}
        </button>
      </div>
    </form>
  );
}
