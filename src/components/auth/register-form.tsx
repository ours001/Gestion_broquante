"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

function PasswordStrengthHint({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: "Au moins 8 caractères", valid: password.length >= 8 },
    { label: "Une lettre majuscule", valid: /[A-Z]/.test(password) },
    { label: "Une lettre minuscule", valid: /[a-z]/.test(password) },
    { label: "Un chiffre", valid: /[0-9]/.test(password) },
  ];

  return (
    <ul className="mt-2 space-y-1">
      {checks.map((check) => (
        <li
          key={check.label}
          className={`text-xs flex items-center gap-1.5 ${
            check.valid ? "text-green-600" : "text-gray-400"
          }`}
        >
          <span>{check.valid ? "✓" : "○"}</span>
          {check.label}
        </li>
      ))}
    </ul>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="space-y-4">
      {state?.errors?.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {state.errors.general[0]}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nom complet
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Jean Dupont"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="vous@exemple.fr"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm"
          >
            {showPassword ? "Masquer" : "Voir"}
          </button>
        </div>
        {state?.errors?.password && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.password[0]}
          </p>
        )}
        <PasswordStrengthHint password={password} />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-20"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm"
          >
            {showConfirm ? "Masquer" : "Voir"}
          </button>
        </div>
        {state?.errors?.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {pending ? "Inscription..." : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
